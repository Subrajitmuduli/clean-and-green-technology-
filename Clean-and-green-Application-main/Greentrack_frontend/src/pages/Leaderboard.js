import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box, Typography, Card, CardContent, Avatar, useTheme, CircularProgress,
  Chip, useMediaQuery, Button, Skeleton
} from "@mui/material";
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { getUser } from '../utils/safeStorage';

import { BACKEND_URL as API_BASE } from '../config';
const PAGE_SIZE = 20;

// 🛡️ Resilient fetch with retry + timeout
const fetchWithRetry = async (url, options = {}, retries = 3, timeoutMs = 30000) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      const isLastAttempt = attempt === retries;

      if (error.name === 'AbortError') {
        if (isLastAttempt) throw new Error('Request timed out. Server may be waking up.');
      } else if (isLastAttempt) {
        throw error;
      }

      const delay = Math.min(2000 * Math.pow(2, attempt - 1), 8000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

const medalColors = {
  1: { bg: 'linear-gradient(135deg, #FFD700, #FFA000)', shadow: 'rgba(255,215,0,0.4)', emoji: '🥇' },
  2: { bg: 'linear-gradient(135deg, #C0C0C0, #9E9E9E)', shadow: 'rgba(192,192,192,0.4)', emoji: '🥈' },
  3: { bg: 'linear-gradient(135deg, #CD7F32, #A0522D)', shadow: 'rgba(205,127,50,0.4)', emoji: '🥉' },
};

/* ─── Skeleton placeholders for loading state ─── */
const SkeletonPodium = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: 3, mb: 5, px: 2 }}>
    {[160, 200, 130].map((h, i) => (
      <Box key={i} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, maxWidth: 200 }}>
        <Skeleton variant="circular" width={i === 1 ? 90 : 70} height={i === 1 ? 90 : 70} />
        <Skeleton variant="text" width={80} sx={{ mt: 1 }} />
        <Skeleton variant="rectangular" width="100%" height={h} sx={{ mt: 1, borderRadius: '12px 12px 0 0' }} />
      </Box>
    ))}
  </Box>
);

const SkeletonRow = () => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, px: 3, py: 2 }}>
    <Skeleton variant="text" width={30} />
    <Skeleton variant="circular" width={42} height={42} />
    <Box sx={{ flex: 1 }}>
      <Skeleton variant="text" width="60%" />
      <Skeleton variant="text" width="30%" />
    </Box>
    <Skeleton variant="text" width={40} />
  </Box>
);

const Leaderboard = () => {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const navigate = useNavigate();
  const currentUser = useMemo(() => getUser(), []);
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [autoRetried, setAutoRetried] = useState(false);

  useEffect(() => {
    fetchLeaderboard();
    // Auto-refresh every 10 seconds to keep data fresh without overwhelming server
    const interval = setInterval(() => {
      fetchLeaderboard();
    }, 10 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Auto-retry once on failure (cold-start recovery)
  useEffect(() => {
    if (!loading && error && !autoRetried) {
      setAutoRetried(true);
      const timer = setTimeout(() => {
        setLoading(true);
        fetchLeaderboard();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [loading, error, autoRetried]);

  const fetchLeaderboard = async () => {
    try {
      setError(null);
      const res = await fetchWithRetry(`${API_BASE}/api/leaderboard`);
      if (res.ok) {
        const data = await res.json();
        setLeaders(data);
      } else {
        setError("Failed to load leaderboard data.");
      }
    } catch (err) {
      if (err.message.includes('timed out')) {
        setError("⏳ Server is waking up — please wait a moment and refresh.");
      } else {
        setError("Failed to connect to server. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUserClick = (userId) => {
    navigate(`/profile/${userId}`);
  };

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + PAGE_SIZE);
  };

  const top3 = leaders.slice(0, 3);
  const visibleLeaders = useMemo(() => leaders.slice(0, visibleCount), [leaders, visibleCount]);
  const hasMore = visibleCount < leaders.length;

  // Reorder for podium display: [2nd, 1st, 3rd]
  const podiumOrder = top3.length >= 3 ? [top3[1], top3[0], top3[2]] : top3;

  if (loading) {
    return (
      <Box sx={{
        bgcolor: theme.palette.background.default, minHeight: '100vh',
        py: { xs: 3, md: 5 }, px: { xs: 1.5, sm: 3, md: 10 },
      }}>
        {/* Header skeleton */}
        <Box sx={{
          background: isDark ? 'linear-gradient(135deg, #1A4222, #0F2916)' : 'linear-gradient(135deg, #d6ffe0, #e9f7ff)',
          borderRadius: '20px', p: 4, mb: 5, textAlign: 'center',
        }}>
          <Skeleton variant="text" width={200} height={50} sx={{ mx: 'auto' }} />
          <Skeleton variant="text" width={350} sx={{ mx: 'auto' }} />
        </Box>
        <SkeletonPodium />
        <Card sx={{ borderRadius: '16px', overflow: 'hidden' }}>
          <CardContent sx={{ p: 0 }}>
            <Box sx={{ px: 3, py: 2.5 }}>
              <Skeleton variant="text" width={150} />
            </Box>
            {[...Array(8)].map((_, i) => <SkeletonRow key={i} />)}
          </CardContent>
        </Card>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', gap: 2 }}>
        <Typography sx={{ fontSize: '3rem' }}>😔</Typography>
        <Typography sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>{error}</Typography>
        <Button
          variant="contained"
          onClick={() => { setLoading(true); fetchLeaderboard(); }}
          sx={{
            mt: 1, textTransform: 'none', fontWeight: 'bold',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #4caf50, #2e7d32)',
          }}
        >
          🔄 Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{
      bgcolor: theme.palette.background.default, minHeight: '100vh',
      py: { xs: 3, md: 5 }, px: { xs: 1.5, sm: 3, md: 10 },
      transition: 'all 0.5s ease',
    }}>

      {/* Header */}
      <Box sx={{
        background: isDark
          ? 'linear-gradient(135deg, #1A4222, #0F2916)'
          : 'linear-gradient(135deg, #d6ffe0, #e9f7ff)',
        borderRadius: { xs: '16px', md: '20px' },
        p: { xs: 2.5, md: 4 }, mb: { xs: 3, md: 5 },
        boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.4)' : '0 2px 15px rgba(0,0,0,0.04)',
        textAlign: 'center',
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1, mb: 1 }}>
          <EmojiEventsIcon sx={{ fontSize: { xs: 30, md: 42 }, color: '#FFD700' }} />
          <Typography sx={{
            fontWeight: 'bold', color: isDark ? '#fff' : '#146b35',
            fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' },
          }}>
            Leaderboard
          </Typography>
        </Box>
        <Typography sx={{
          color: isDark ? 'rgba(255,255,255,0.6)' : '#555',
          maxWidth: 500, mx: 'auto',
          fontSize: { xs: '0.8rem', md: '1rem' },
        }}>
          Our top environmental champions ranked by approved waste reports. Compete, contribute, and make a difference! 🌍
        </Typography>
      </Box>

      {/* Podium Section - Top 3 */}
      {top3.length >= 3 && (
        <Box sx={{ mb: { xs: 3, md: 5 } }}>
          <Box sx={{
            display: 'flex', justifyContent: 'center', alignItems: 'flex-end',
            gap: { xs: 0.8, sm: 1.5, md: 3 },
            px: { xs: 0, md: 2 },
          }}>
            {podiumOrder.map((user) => {
              const actualRank = user.rank;
              const medal = medalColors[actualRank];
              const isFirst = actualRank === 1;
              const podiumHeight = isMobile
                ? (isFirst ? 120 : actualRank === 2 ? 95 : 75)
                : (isFirst ? 200 : actualRank === 2 ? 160 : 130);
              const avatarSize = isMobile
                ? (isFirst ? 56 : 44)
                : (isFirst ? 90 : 70);

              return (
                <Box
                  key={user.userId}
                  onClick={() => handleUserClick(user.userId)}
                  sx={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': { transform: 'translateY(-6px)' },
                    flex: 1, maxWidth: { xs: 110, sm: 160, md: 200 },
                  }}
                >
                  {/* Avatar with medal ring */}
                  <Box sx={{ position: 'relative', mb: 1 }}>
                    <Avatar
                      src={user.profileImageBase64 || undefined}
                      sx={{
                        width: avatarSize, height: avatarSize,
                        border: `3px solid`,
                        borderColor: actualRank === 1 ? '#FFD700' : actualRank === 2 ? '#C0C0C0' : '#CD7F32',
                        boxShadow: `0 4px 16px ${medal.shadow}`,
                        bgcolor: '#4caf50',
                        fontSize: isFirst ? (isMobile ? '1.3rem' : '2rem') : (isMobile ? '1rem' : '1.5rem'),
                        fontWeight: 'bold',
                      }}
                    >
                      {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                    </Avatar>
                    {/* Medal badge */}
                    <Box sx={{
                      position: 'absolute', bottom: -5, left: '50%', transform: 'translateX(-50%)',
                      fontSize: isFirst ? (isMobile ? '1.1rem' : '1.5rem') : (isMobile ? '0.9rem' : '1.2rem'),
                      filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
                    }}>
                      {medal.emoji}
                    </Box>
                    {/* Volunteer badge */}
                    {user.volunteerBadge && (
                      <Box sx={{
                        position: 'absolute', top: -3, right: -3,
                        width: isMobile ? 18 : 24, height: isMobile ? 18 : 24,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #FFD700, #FFA000)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 2px 8px rgba(255,215,0,0.5)',
                      }}>
                        <EmojiEventsIcon sx={{ fontSize: isMobile ? 10 : 14, color: '#fff' }} />
                      </Box>
                    )}
                  </Box>

                  {/* Name */}
                  <Typography sx={{
                    fontWeight: 'bold',
                    fontSize: isMobile ? '0.7rem' : (isFirst ? '1rem' : '0.9rem'),
                    color: theme.palette.text.primary,
                    textAlign: 'center',
                    mb: 0.2,
                    maxWidth: isMobile ? 90 : 150,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {user.fullName}
                  </Typography>

                  {/* Reports count */}
                  <Typography sx={{ fontSize: isMobile ? '0.65rem' : '0.8rem', color: '#4caf50', fontWeight: 'bold' }}>
                    {user.totalReports || 0} reports
                  </Typography>

                  {/* Podium block */}
                  <Box sx={{
                    width: '100%',
                    height: podiumHeight,
                    mt: 1,
                    borderRadius: { xs: '8px 8px 0 0', md: '12px 12px 0 0' },
                    background: medal.bg,
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: `0 -4px 20px ${medal.shadow}`,
                    position: 'relative',
                    overflow: 'hidden',
                  }}>
                    {/* Decorative shimmer */}
                    <Box sx={{
                      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                      background: 'linear-gradient(180deg, rgba(255,255,255,0.2) 0%, transparent 50%)',
                    }} />
                    <Typography sx={{
                      fontSize: isMobile ? (isFirst ? '1.5rem' : '1.2rem') : (isFirst ? '2.5rem' : '2rem'),
                      fontWeight: 'bold', color: '#fff', position: 'relative', zIndex: 1,
                    }}>
                      #{actualRank}
                    </Typography>
                    <Typography sx={{
                      fontSize: isMobile ? '0.6rem' : '0.75rem',
                      color: 'rgba(255,255,255,0.8)', fontWeight: 600,
                      position: 'relative', zIndex: 1,
                    }}>
                      🪙 {user.greenCoins}
                    </Typography>
                  </Box>
                </Box>
              );
            })}
          </Box>
        </Box>
      )}

      {/* Find Your Rank */}
      {currentUser && leaders.length > 0 && (() => {
        const myEntry = leaders.find(l => String(l.userId) === String(currentUser.id));
        if (!myEntry) return null;
        return (
          <Card sx={{
            borderRadius: '16px', mb: { xs: 2.5, md: 4 }, overflow: 'hidden',
            background: isDark
              ? 'linear-gradient(135deg, rgba(76,175,80,0.12), rgba(33,150,243,0.08))'
              : 'linear-gradient(135deg, #e8f5e9, #e3f2fd)',
            border: `2px solid ${isDark ? 'rgba(76,175,80,0.2)' : 'rgba(76,175,80,0.15)'}`,
            boxShadow: isDark ? '0 4px 20px rgba(76,175,80,0.1)' : '0 2px 15px rgba(76,175,80,0.08)',
          }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: { xs: 2, md: 2.5 }, px: { xs: 2, md: 3 } }}>
              <TrendingUpIcon sx={{ color: '#4caf50', fontSize: { xs: 24, md: 28 } }} />
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontWeight: 'bold', color: theme.palette.text.primary, fontSize: { xs: '0.9rem', md: '1rem' } }}>
                  Your Rank
                </Typography>
                <Typography sx={{ fontSize: { xs: '0.7rem', md: '0.8rem' }, color: theme.palette.text.secondary }}>
                  Keep reporting waste to climb!
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography sx={{ fontWeight: 'bold', fontSize: { xs: '1.5rem', md: '2rem' }, color: '#4caf50' }}>
                  #{myEntry.rank}
                </Typography>
                <Typography sx={{ fontSize: '0.7rem', color: theme.palette.text.secondary }}>
                  {myEntry.totalReports || 0} reports
                </Typography>
              </Box>
            </CardContent>
          </Card>
        );
      })()}

      {/* Full Rankings */}
      <Card sx={{
        borderRadius: '16px',
        boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 2px 10px rgba(0,0,0,0.06)',
        overflow: 'hidden',
      }}>
        <CardContent sx={{ p: 0 }}>
          {/* Section Header */}
          <Box sx={{
            px: { xs: 2, md: 3 }, py: { xs: 2, md: 2.5 },
            background: isDark
              ? 'linear-gradient(135deg, rgba(76,175,80,0.1), rgba(0,0,0,0.1))'
              : 'linear-gradient(135deg, #f0fdf4, #f8fdf8)',
            borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
          }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: theme.palette.text.primary, fontSize: { xs: '1rem', md: '1.25rem' } }}>
              🏅 Full Rankings
            </Typography>
            <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
              {leaders.length} contributors ranked by green coins
            </Typography>
          </Box>

          {leaders.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <Typography sx={{ fontSize: '3rem', mb: 1 }}>🌱</Typography>
              <Typography sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>No leaders yet</Typography>
              <Typography sx={{ color: theme.palette.text.secondary, fontSize: '0.85rem' }}>
                Be the first to report waste and climb to the top!
              </Typography>
            </Box>
          ) : (
            <Box>
              {/* Card-based ranking list — paginated for performance */}
              {visibleLeaders.map((user) => {
                const isCurrentUser = currentUser && String(user.userId) === String(currentUser.id);
                const medal = medalColors[user.rank];

                return (
                  <Box
                    key={user.userId}
                    onClick={() => handleUserClick(user.userId)}
                    sx={{
                      display: 'flex', alignItems: 'center', gap: { xs: 1.5, md: 2 },
                      px: { xs: 2, md: 3 }, py: { xs: 1.5, md: 2 },
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      bgcolor: isCurrentUser
                        ? (isDark ? 'rgba(76,175,80,0.08)' : 'rgba(76,175,80,0.04)')
                        : 'transparent',
                      '&:hover': {
                        bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
                      },
                      borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}`,
                      borderLeft: isCurrentUser ? '3px solid #4caf50' : '3px solid transparent',
                    }}
                  >
                    {/* Rank */}
                    <Box sx={{ width: { xs: 32, md: 40 }, textAlign: 'center', flexShrink: 0 }}>
                      {medal ? (
                        <Typography sx={{ fontSize: { xs: '1.1rem', md: '1.3rem' } }}>{medal.emoji}</Typography>
                      ) : (
                        <Typography sx={{
                          fontWeight: 'bold', fontSize: { xs: '0.85rem', md: '1rem' },
                          color: isDark ? 'rgba(255,255,255,0.5)' : '#888',
                        }}>
                          #{user.rank}
                        </Typography>
                      )}
                    </Box>

                    {/* Avatar — shows profile photo if available */}
                    <Avatar
                      src={user.profileImageBase64 || undefined}
                      sx={{
                        width: { xs: 36, md: 42 }, height: { xs: 36, md: 42 },
                        bgcolor: '#4caf50',
                        fontSize: { xs: '0.8rem', md: '0.95rem' }, fontWeight: 'bold',
                        border: medal ? `2px solid ${user.rank === 1 ? '#FFD700' : user.rank === 2 ? '#C0C0C0' : '#CD7F32'}` : 'none',
                        flexShrink: 0,
                      }}
                    >
                      {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                    </Avatar>

                    {/* User info */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Typography sx={{
                          fontWeight: isCurrentUser ? 'bold' : 600,
                          color: theme.palette.text.primary,
                          fontSize: { xs: '0.82rem', md: '0.95rem' },
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {user.fullName}
                        </Typography>
                        {isCurrentUser && (
                          <Chip label="You" size="small" sx={{
                            height: 18, fontSize: '0.6rem', fontWeight: 'bold',
                            bgcolor: 'rgba(76,175,80,0.15)', color: '#4caf50',
                            flexShrink: 0,
                          }} />
                        )}
                        {user.volunteerBadge && (
                          <EmojiEventsIcon sx={{ fontSize: 16, color: '#FFD700', flexShrink: 0 }} />
                        )}
                      </Box>
                      {(user.city || user.profession) && (
                        <Typography sx={{ fontSize: { xs: '0.65rem', md: '0.72rem' }, color: theme.palette.text.secondary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {[user.profession, user.city].filter(Boolean).join(' • ')}
                        </Typography>
                      )}
                    </Box>

                    {/* Stats — right side */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.5, md: 3 }, flexShrink: 0 }}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography sx={{ fontWeight: 'bold', color: '#4caf50', fontSize: { xs: '0.9rem', md: '1rem' } }}>
                          {user.totalReports || 0}
                        </Typography>
                        <Typography sx={{ fontSize: { xs: '0.55rem', md: '0.65rem' }, color: theme.palette.text.secondary }}>
                          Reports
                        </Typography>
                      </Box>
                      {!isMobile && (
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography sx={{ fontWeight: 600, color: theme.palette.text.secondary, fontSize: '0.9rem' }}>
                            🪙 {user.greenCoins}
                          </Typography>
                          <Typography sx={{ fontSize: '0.65rem', color: theme.palette.text.secondary }}>
                            Coins
                          </Typography>
                        </Box>
                      )}
                      <ArrowForwardIosIcon sx={{ fontSize: 14, color: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)' }} />
                    </Box>
                  </Box>
                );
              })}

              {/* Load More Button */}
              {hasMore && (
                <Box sx={{ textAlign: 'center', py: 2.5 }}>
                  <Button
                    onClick={handleLoadMore}
                    variant="text"
                    endIcon={<ExpandMoreIcon />}
                    sx={{
                      textTransform: 'none',
                      fontWeight: 'bold',
                      color: '#4caf50',
                      borderRadius: '12px',
                      px: 4,
                      '&:hover': {
                        bgcolor: isDark ? 'rgba(76,175,80,0.1)' : 'rgba(76,175,80,0.06)',
                      },
                    }}
                  >
                    Load More ({leaders.length - visibleCount} remaining)
                  </Button>
                </Box>
              )}
            </Box>
          )}

          {/* Footer */}
          <Box sx={{
            px: { xs: 2, md: 3 }, py: 2,
            borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}`,
            background: isDark ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.02)',
          }}>
            <Typography sx={{ fontSize: { xs: '0.7rem', md: '0.75rem' }, color: theme.palette.text.secondary }}>
              💡 Stay at Rank #1 for 7 consecutive days to earn the exclusive <strong>Volunteer Champion 🏆</strong> badge!
            </Typography>
          </Box>
        </CardContent>
      </Card>

      <Box sx={{ height: 40 }} />
    </Box>
  );
};

export default Leaderboard;
