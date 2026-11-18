import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box, Typography, Card, CardContent, Avatar, Button, TextField, Grid,
  useTheme, CircularProgress, IconButton, MenuItem, Select, FormControl, InputLabel, Chip,
  Divider, Tooltip, useMediaQuery, Modal, Fade, Backdrop
} from "@mui/material";
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import WorkIcon from '@mui/icons-material/Work';
import CakeIcon from '@mui/icons-material/Cake';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import VerifiedIcon from '@mui/icons-material/Verified';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import { toast } from 'react-toastify';
import { getUser } from '../utils/safeStorage';

import { BACKEND_URL as API_BASE } from '../config';

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
        if (isLastAttempt) throw new Error('Request timed out. Server may be waking up — please try again.');
      } else if (isLastAttempt) {
        throw error;
      }

      const delay = Math.min(2000 * Math.pow(2, attempt - 1), 8000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

const UserProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const fileInputRef = useRef(null);
  const coverFileInputRef = useRef(null);

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [approvedCount, setApprovedCount] = useState(0);
  const [totalReports, setTotalReports] = useState(0);
  const [leaderboardRank, setLeaderboardRank] = useState('...');
  const [editData, setEditData] = useState({});
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [autoRetried, setAutoRetried] = useState(false);

  const currentUser = useMemo(() => getUser(), []);
  const isOwnProfile = currentUser && String(currentUser.id) === String(id);

  useEffect(() => {
    fetchProfile();
    fetchReportCount();
    fetchLeaderboardRank();
  }, [id]);

  const fetchProfile = useCallback(async () => {
    try {
      setError(null);
      const res = await fetchWithRetry(`${API_BASE}/api/auth/profile/${id}`);
      if (!res.ok) {

        setError("Could not load profile. Please try again.");
        return;
      }
      const data = await res.json();
      if (data.status) {
        setProfile(data);
        setEditData({
          fullName: data.fullName || '',
          age: data.age || '',
          gender: data.gender || '',
          profession: data.profession || '',
          city: data.city || '',
          bio: data.bio || '',
        });
      } else {
        setError("Profile data unavailable.");
      }
    } catch (err) {
      if (err.message.includes('timed out') || err.message.includes('waking up')) {
        setError("⏳ Server is waking up — please wait a moment and try again.");
      } else {
        setError("Network error loading profile. Please check your connection.");
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchReportCount = useCallback(async () => {
    try {
      const res = await fetchWithRetry(`${API_BASE}/api/reports/user/${id}`);
      if (res.ok) {
        const reports = await res.json();
        setTotalReports(reports.length);
        setApprovedCount(reports.filter(r => r.status === 'APPROVED').length);
      }
    } catch (err) {
    }
  }, [id]);

  const fetchLeaderboardRank = useCallback(async () => {
    try {
      const res = await fetchWithRetry(`${API_BASE}/api/leaderboard`);
      if (res.ok) {
        const data = await res.json();
        // Ensure robust comparison between backend ID (number) and URL param ID (string)
        const entry = data.find(e => String(e.userId) === String(id));
        if (entry && entry.rank) {
            setLeaderboardRank(entry.rank);
        } else {
            console.warn("User not found in leaderboard or rank missing", id, data.length);
            setLeaderboardRank('—');
        }
      } else {
          setLeaderboardRank('—');
      }
    } catch (err) {
        console.error("Error fetching leaderboard rank:", err);
        setLeaderboardRank('—');
    }
  }, [id, API_BASE]);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error("Please upload an image file");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image size must be less than 2MB");
      return;
    }

    setUploadingImage(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64 = reader.result;
          const res = await fetchWithRetry(`${API_BASE}/api/auth/profile/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ profileImageBase64: base64 }),
          });
          const data = await res.json();
          if (data.status) {
            toast.success("Profile photo updated!");
            fetchProfile();
          } else {
            toast.warning("Could not upload photo. Try again.");
          }
        } catch (err) {
          toast.warning("Upload failed — server may be waking up. Try again.");
        }
        setUploadingImage(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      toast.warning("Upload failed. Please try again.");
      setUploadingImage(false);
    }
  };

  const handleCoverUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error("Please upload an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Cover image size must be less than 5MB");
      return;
    }

    setUploadingCover(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64 = reader.result;
          const res = await fetchWithRetry(`${API_BASE}/api/auth/profile/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ coverImageBase64: base64 }),
          });
          const data = await res.json();
          if (data.status) {
            toast.success("Cover photo updated!");
            fetchProfile();
          } else {
            toast.warning("Could not upload cover photo. Try again.");
          }
        } catch (err) {
          toast.warning("Upload failed — server may be waking up. Try again.");
        }
        setUploadingCover(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      toast.warning("Upload failed. Please try again.");
      setUploadingCover(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetchWithRetry(`${API_BASE}/api/auth/profile/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: editData.fullName,
          age: editData.age ? parseInt(editData.age) : null,
          gender: editData.gender,
          profession: editData.profession,
          city: editData.city,
          bio: editData.bio,
        }),
      });
      const data = await res.json();
      if (data.status) {
        toast.success("Profile updated!");
        if (currentUser) {
          currentUser.fullName = editData.fullName;
          localStorage.setItem('user', JSON.stringify(currentUser));
        }
        setEditing(false);
        fetchProfile();
      } else {
        toast.error(data.message || "Failed to update");
      }
    } catch (err) {
      if (err.message.includes('timed out')) {
        toast.warning("⏳ Server is waking up — please try again in a moment.");
      } else {
        toast.warning("Network issue. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  };

  // Auto-retry once if profile failed to load (server cold-start)
  useEffect(() => {
    if (!loading && (error || !profile) && !autoRetried) {
      setAutoRetried(true);
      const timer = setTimeout(() => {
        setLoading(true);
        setError(null);
        fetchProfile();
        fetchReportCount();
        fetchLeaderboardRank();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [loading, error, profile, autoRetried, fetchProfile, fetchReportCount, fetchLeaderboardRank]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', gap: 2 }}>
        <CircularProgress sx={{ color: '#4caf50' }} />
        <Typography sx={{ color: theme.palette.text.secondary, fontSize: '0.85rem' }}>Loading profile...</Typography>
      </Box>
    );
  }


  if (error || !profile) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', gap: 2, px: 3 }}>
        <Typography sx={{ fontSize: '3rem' }}>😔</Typography>
        <Typography variant="h6" sx={{ fontWeight: 'bold', color: theme.palette.text.primary, textAlign: 'center' }}>
          {error || "User not found"}
        </Typography>
        {autoRetried ? (
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Button
              variant="contained"
              onClick={() => { setLoading(true); setError(null); fetchProfile(); fetchReportCount(); fetchLeaderboardRank(); }}
              sx={{
                textTransform: 'none', fontWeight: 'bold', borderRadius: '12px',
                background: 'linear-gradient(135deg, #4caf50, #2e7d32)',
              }}
            >
              🔄 Retry
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate(-1)}
              sx={{ textTransform: 'none', fontWeight: 'bold', borderRadius: '12px' }}
            >
              Go Back
            </Button>
          </Box>
        ) : (
          <Typography sx={{ color: theme.palette.text.secondary, fontSize: '0.85rem' }}>
            ⏳ Auto-retrying in a moment...
          </Typography>
        )}
      </Box>
    );
  }

  return (
    <Box sx={{
      bgcolor: theme.palette.background.default, minHeight: '100vh',
      py: { xs: 2, md: 5 }, px: { xs: 1.5, sm: 3, md: 10 },
    }}>
      {/* Back button */}
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate(-1)}
        sx={{ mb: { xs: 1.5, md: 3 }, color: theme.palette.text.secondary, textTransform: 'none', fontWeight: 600, fontSize: { xs: '0.85rem', md: '1rem' } }}
      >
        Back
      </Button>

      {/* Profile Header Card */}
      <Card sx={{
        borderRadius: { xs: '16px', md: '24px' },
        overflow: 'hidden',
        boxShadow: isDark ? '0 8px 40px rgba(0,0,0,0.4)' : '0 4px 30px rgba(0,0,0,0.08)',
        mb: 4,
      }}>
        {/* Banner */}
        <Box sx={{
          height: { xs: 130, sm: 160, md: 200 },
          background: profile?.coverImageBase64 
            ? `url(${profile.coverImageBase64}) center/cover no-repeat`
            : isDark
              ? 'linear-gradient(135deg, #1A4222 0%, #0F2916 40%, #1a3a1a 70%, #0d3320 100%)'
              : 'linear-gradient(135deg, #66bb6a 0%, #43a047 40%, #2e7d32 70%, #1b5e20 100%)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Decorative elements */}
          <Box sx={{ position: 'absolute', top: -30, right: -30, width: { xs: 100, md: 200 }, height: { xs: 100, md: 200 }, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.04)' }} />
          <Box sx={{ position: 'absolute', bottom: -30, left: 30, width: { xs: 60, md: 120 }, height: { xs: 60, md: 120 }, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.06)' }} />

          {/* Edit button and cover image button */}
          {isOwnProfile && !editing && (
            <Box sx={{ position: 'absolute', top: { xs: 10, md: 16 }, right: { xs: 10, md: 16 }, display: 'flex', gap: 1 }}>
              <>
                <input
                  type="file"
                  accept="image/*"
                  ref={coverFileInputRef}
                  style={{ display: 'none' }}
                  onChange={handleCoverUpload}
                />
                <Tooltip title="Change cover photo">
                  <IconButton
                    onClick={() => coverFileInputRef.current.click()}
                    disabled={uploadingCover}
                    sx={{
                      bgcolor: 'rgba(255,255,255,0.15)', color: '#fff',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      width: { xs: 36, md: 40 }, height: { xs: 36, md: 40 },
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' },
                    }}
                  >
                    {uploadingCover ? <CircularProgress size={16} color="inherit" /> : <CameraAltIcon sx={{ fontSize: { xs: 18, md: 22 } }} />}
                  </IconButton>
                </Tooltip>
              </>
              <Tooltip title="Edit Profile Details">
                <IconButton
                  onClick={() => setEditing(true)}
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.15)', color: '#fff',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    width: { xs: 36, md: 40 }, height: { xs: 36, md: 40 },
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' },
                  }}
                >
                  <EditIcon sx={{ fontSize: { xs: 18, md: 22 } }} />
                </IconButton>
              </Tooltip>
            </Box>
          )}

          {/* Volunteer Badge on banner */}
          {profile.volunteerBadge && (
            <Box sx={{
              position: 'absolute', top: { xs: 10, md: 16 }, left: { xs: 10, md: 16 },
              display: 'flex', alignItems: 'center', gap: 0.5,
              px: { xs: 1.5, md: 2 }, py: 0.6, borderRadius: '20px',
              background: 'linear-gradient(135deg, #FFD700, #FFA000)',
              boxShadow: '0 4px 15px rgba(255,215,0,0.4)',
            }}>
              <EmojiEventsIcon sx={{ color: '#fff', fontSize: { xs: 16, md: 20 } }} />
              <Typography sx={{ color: '#fff', fontWeight: 'bold', fontSize: { xs: '0.65rem', md: '0.8rem' } }}>
                Volunteer Champion 🏆
              </Typography>
            </Box>
          )}
        </Box>

        <CardContent sx={{ position: 'relative', pt: 0, px: { xs: 2, sm: 3, md: 5 }, pb: { xs: 3, md: 4 } }}>
          {/* Avatar with upload + click to enlarge */}
          <Box sx={{ position: 'relative', width: 'fit-content' }}>
            <Avatar
              src={profile.profileImageBase64 || undefined}
              onClick={() => {
                if (profile.profileImageBase64) setImageModalOpen(true);
              }}
              sx={{
                width: { xs: 80, sm: 100, md: 120 },
                height: { xs: 80, sm: 100, md: 120 },
                border: `4px solid ${theme.palette.background.paper}`,
                boxShadow: isDark ? '0 4px 30px rgba(0,0,0,0.4)' : '0 4px 20px rgba(0,0,0,0.15)',
                mt: { xs: -5, md: -8 },
                bgcolor: '#4caf50',
                fontSize: { xs: '1.8rem', md: '2.8rem' },
                fontWeight: 'bold',
                cursor: profile.profileImageBase64 ? 'pointer' : 'default',
                transition: 'transform 0.2s ease',
                '&:hover': profile.profileImageBase64 ? { transform: 'scale(1.05)' } : {},
              }}
            >
              {profile.fullName ? profile.fullName.charAt(0).toUpperCase() : 'U'}
            </Avatar>
            {/* Camera button for own profile */}
            {isOwnProfile && (
              <>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  onChange={handleImageUpload}
                />
                <Tooltip title="Change profile photo">
                  <IconButton
                    onClick={() => fileInputRef.current.click()}
                    disabled={uploadingImage}
                    sx={{
                      position: 'absolute', bottom: 0, right: -4,
                      bgcolor: '#4caf50', color: '#fff',
                      width: { xs: 28, md: 36 }, height: { xs: 28, md: 36 },
                      border: `3px solid ${theme.palette.background.paper}`,
                      '&:hover': { bgcolor: '#388e3c' },
                    }}
                  >
                    {uploadingImage ? <CircularProgress size={14} color="inherit" /> : <CameraAltIcon sx={{ fontSize: { xs: 14, md: 18 } }} />}
                  </IconButton>
                </Tooltip>
              </>
            )}
            {/* Verified badge on avatar */}
            {profile.volunteerBadge && (
              <Box sx={{
                position: 'absolute', top: { xs: -6, md: -4 }, right: -4,
                width: { xs: 24, md: 32 }, height: { xs: 24, md: 32 }, borderRadius: '50%',
                background: 'linear-gradient(135deg, #FFD700, #FFA000)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: `3px solid ${theme.palette.background.paper}`,
                boxShadow: '0 2px 10px rgba(255,215,0,0.4)',
              }}>
                <VerifiedIcon sx={{ fontSize: { xs: 12, md: 16 }, color: '#fff' }} />
              </Box>
            )}
          </Box>

          {/* Name & Info */}
          <Box sx={{ mt: 1.5 }}>
            {editing ? (
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 2 }}>
                <TextField
                  value={editData.fullName}
                  onChange={(e) => setEditData({ ...editData, fullName: e.target.value })}
                  size="small"
                  label="Full Name"
                  sx={{ flex: 1 }}
                />
              </Box>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
                <Typography sx={{
                  fontWeight: 'bold', color: theme.palette.text.primary,
                  fontSize: { xs: '1.3rem', sm: '1.6rem', md: '2rem' },
                }}>
                  {profile.fullName}
                </Typography>
                {profile.volunteerBadge && (
                  <Tooltip title="Volunteer Champion — Ranked #1 for 7+ days!">
                    <EmojiEventsIcon sx={{ color: '#FFD700', fontSize: { xs: 22, md: 28 }, cursor: 'help' }} />
                  </Tooltip>
                )}
                {isOwnProfile && (
                  <Chip label="You" size="small" sx={{
                    height: 20, fontSize: '0.65rem', fontWeight: 'bold',
                    bgcolor: 'rgba(76,175,80,0.12)', color: '#4caf50',
                    borderRadius: '8px',
                  }} />
                )}
              </Box>
            )}

            {/* Email & Contact */}
            <Box sx={{ display: 'flex', gap: { xs: 1, md: 2 }, flexWrap: 'wrap', mt: 0.3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <EmailIcon sx={{ fontSize: { xs: 14, md: 16 }, color: theme.palette.text.secondary }} />
                <Typography sx={{ color: theme.palette.text.secondary, fontSize: { xs: '0.72rem', md: '0.85rem' } }}>
                  {profile.email}
                </Typography>
              </Box>
              {profile.contactNumber && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <PhoneIcon sx={{ fontSize: { xs: 14, md: 16 }, color: theme.palette.text.secondary }} />
                  <Typography sx={{ color: theme.palette.text.secondary, fontSize: { xs: '0.72rem', md: '0.85rem' } }}>
                    {profile.contactNumber}
                  </Typography>
                </Box>
              )}
            </Box>

            {/* Quick tags */}
            <Box sx={{ display: 'flex', gap: 0.8, mt: 1.2, flexWrap: 'wrap' }}>
              {profile.profession && (
                <Chip icon={<WorkIcon sx={{ fontSize: 13 }} />} label={profile.profession} size="small" variant="outlined" sx={{
                  borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)',
                  color: theme.palette.text.secondary, fontSize: '0.7rem', height: 26,
                }} />
              )}
              {profile.city && (
                <Chip icon={<LocationOnIcon sx={{ fontSize: 13 }} />} label={profile.city} size="small" variant="outlined" sx={{
                  borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)',
                  color: theme.palette.text.secondary, fontSize: '0.7rem', height: 26,
                }} />
              )}
              {profile.age && (
                <Chip icon={<CakeIcon sx={{ fontSize: 13 }} />} label={`${profile.age} yrs`} size="small" variant="outlined" sx={{
                  borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)',
                  color: theme.palette.text.secondary, fontSize: '0.7rem', height: 26,
                }} />
              )}
              {profile.gender && (
                <Chip label={profile.gender} size="small" variant="outlined" sx={{
                  borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)',
                  color: theme.palette.text.secondary, fontSize: '0.7rem', height: 26,
                }} />
              )}
            </Box>
          </Box>

          {/* Stats Row */}
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' },
            gap: { xs: 1, md: 2 },
            mt: 3,
          }}>
            {[
              { label: 'Green Coins', value: profile.greenCoins || 0, emoji: '🪙', color: '#4caf50' },
              { label: 'Approved', value: approvedCount, emoji: '✅', color: '#2196f3' },
              { label: 'Total Reports', value: totalReports, emoji: '📋', color: '#ff9800' },
              { label: 'Rank', value: leaderboardRank === '...' ? '⏳' : (leaderboardRank === '—' ? '—' : `#${leaderboardRank}`), emoji: '🏆', color: '#9c27b0', clickable: true },
            ].map(stat => (
              <Box key={stat.label} sx={{
                px: { xs: 1.5, md: 3 }, py: { xs: 1.5, md: 2.5 },
                borderRadius: { xs: '12px', md: '16px' },
                background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.015)',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'}`,
                textAlign: 'center',
                cursor: stat.clickable ? 'pointer' : 'default',
                transition: 'all 0.3s ease',
                '&:hover': stat.clickable ? {
                  transform: 'translateY(-2px)',
                  boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 15px rgba(0,0,0,0.06)',
                } : {},
              }}
              onClick={() => stat.clickable && navigate('/leaderboard')}
              >
                <Typography sx={{ fontSize: { xs: '1rem', md: '1.3rem' }, mb: 0.3 }}>{stat.emoji}</Typography>
                <Typography sx={{ fontWeight: 'bold', fontSize: { xs: '1.1rem', md: '1.5rem' }, color: stat.color }}>{stat.value}</Typography>
                <Typography sx={{ fontSize: { xs: '0.6rem', md: '0.72rem' }, color: theme.palette.text.secondary, fontWeight: 500 }}>{stat.label}</Typography>
              </Box>
            ))}
          </Box>

          <Divider sx={{ my: { xs: 2.5, md: 3.5 }, borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }} />

          {/* Profile Details */}
          {editing ? (
            <Box>
              <Typography sx={{ fontWeight: 'bold', fontSize: { xs: '1rem', md: '1.1rem' }, mb: 2, color: theme.palette.text.primary }}>
                ✏️ Edit Profile
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth size="small" label="Age" type="number"
                    value={editData.age}
                    onChange={(e) => setEditData({ ...editData, age: e.target.value })}
                    InputProps={{ inputProps: { min: 1, max: 120 } }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Gender</InputLabel>
                    <Select
                      value={editData.gender}
                      onChange={(e) => setEditData({ ...editData, gender: e.target.value })}
                      label="Gender"
                    >
                      <MenuItem value="Male">Male</MenuItem>
                      <MenuItem value="Female">Female</MenuItem>
                      <MenuItem value="Other">Other</MenuItem>
                      <MenuItem value="Prefer not to say">Prefer not to say</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth size="small" label="Profession"
                    value={editData.profession}
                    onChange={(e) => setEditData({ ...editData, profession: e.target.value })}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth size="small" label="City"
                    value={editData.city}
                    onChange={(e) => setEditData({ ...editData, city: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth size="small" label="Bio" multiline rows={3}
                    value={editData.bio}
                    onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                    placeholder="Tell about yourself..."
                    inputProps={{ maxLength: 300 }}
                    helperText={`${(editData.bio || '').length}/300`}
                  />
                </Grid>
              </Grid>
              <Box sx={{ display: 'flex', gap: 1.5, mt: 2.5 }}>
                <Button
                  variant="contained" startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                  onClick={handleSave} disabled={saving}
                  size={isMobile ? "small" : "medium"}
                  sx={{
                    bgcolor: '#4caf50', fontWeight: 'bold', borderRadius: '10px', textTransform: 'none',
                    px: { xs: 2, md: 3 },
                    boxShadow: '0 4px 14px rgba(76,175,80,0.25)',
                    '&:hover': { bgcolor: '#388e3c' },
                  }}
                >
                  {saving ? 'Saving...' : 'Save'}
                </Button>
                <Button
                  variant="outlined" startIcon={<CloseIcon />}
                  onClick={() => setEditing(false)}
                  size={isMobile ? "small" : "medium"}
                  sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 'bold' }}
                >
                  Cancel
                </Button>
              </Box>
            </Box>
          ) : (
            <Box>
              {/* Profile Details */}
              <Typography sx={{ fontWeight: 'bold', fontSize: { xs: '1rem', md: '1.1rem' }, mb: 2, color: theme.palette.text.primary }}>
                📋 Profile Details
              </Typography>
              <Grid container spacing={1.5}>
                {[
                  { icon: <CakeIcon sx={{ fontSize: { xs: 18, md: 20 } }} />, label: 'Age', value: profile.age ? `${profile.age} years` : 'Not set' },
                  { icon: '🧑', label: 'Gender', value: profile.gender || 'Not set', isEmoji: true },
                  { icon: <WorkIcon sx={{ fontSize: { xs: 18, md: 20 } }} />, label: 'Profession', value: profile.profession || 'Not set' },
                  { icon: <LocationOnIcon sx={{ fontSize: { xs: 18, md: 20 } }} />, label: 'City', value: profile.city || 'Not set' },
                ].map(item => (
                  <Grid item xs={6} key={item.label}>
                    <Box sx={{
                      display: 'flex', alignItems: 'center', gap: { xs: 1, md: 1.5 },
                      p: { xs: 1.5, md: 2.5 }, borderRadius: { xs: '10px', md: '14px' },
                      bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.015)',
                      border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'}`,
                    }}>
                      <Box sx={{
                        width: { xs: 32, md: 40 }, height: { xs: 32, md: 40 }, borderRadius: { xs: '8px', md: '12px' },
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        bgcolor: isDark ? 'rgba(76,175,80,0.12)' : 'rgba(76,175,80,0.08)',
                        color: '#4caf50', flexShrink: 0,
                        fontSize: item.isEmoji ? { xs: '0.9rem', md: '1.2rem' } : undefined,
                      }}>
                        {item.icon}
                      </Box>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography sx={{ fontSize: { xs: '0.58rem', md: '0.7rem' }, color: theme.palette.text.secondary, textTransform: 'uppercase', fontWeight: 600, letterSpacing: 0.3 }}>
                          {item.label}
                        </Typography>
                        <Typography sx={{
                          fontWeight: 'bold',
                          color: item.value === 'Not set' ? theme.palette.text.disabled : theme.palette.text.primary,
                          fontSize: { xs: '0.78rem', md: '0.95rem' },
                          fontStyle: item.value === 'Not set' ? 'italic' : 'normal',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {item.value}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                ))}
              </Grid>

              {/* Bio */}
              {profile.bio && (
                <Box sx={{
                  mt: 2, p: { xs: 2, md: 3 }, borderRadius: { xs: '12px', md: '16px' },
                  bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.015)',
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'}`,
                }}>
                  <Typography sx={{ fontSize: '0.7rem', color: theme.palette.text.secondary, textTransform: 'uppercase', fontWeight: 600, letterSpacing: 0.5, mb: 0.8 }}>
                    About
                  </Typography>
                  <Typography sx={{ color: theme.palette.text.primary, lineHeight: 1.7, fontSize: { xs: '0.85rem', md: '0.95rem' } }}>
                    {profile.bio}
                  </Typography>
                </Box>
              )}

              {/* Achievements */}
              <Box sx={{ mt: 2.5 }}>
                <Typography sx={{ fontWeight: 'bold', fontSize: { xs: '1rem', md: '1.1rem' }, mb: 1.5, color: theme.palette.text.primary }}>
                  🏅 Achievements
                </Typography>
                <Box sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' },
                  gap: { xs: 1, md: 2 },
                }}>
                  {[
                    {
                      icon: <EmojiEventsIcon sx={{ fontSize: { xs: 28, md: 36 } }} />,
                      name: 'Volunteer Champion',
                      desc: profile.volunteerBadge ? 'Earned! 🎉' : 'Rank #1 for 7 days',
                      earned: profile.volunteerBadge,
                      color: '#FFD700',
                      gradient: 'rgba(255,215,0,0.12), rgba(255,160,0,0.08)',
                      borderColor: 'rgba(255,215,0,0.3)',
                    },
                    {
                      emoji: '🌱',
                      name: 'First Contribution',
                      desc: approvedCount >= 1 ? 'Earned! 🎉' : '1 approved report',
                      earned: approvedCount >= 1,
                      color: '#4caf50',
                      gradient: 'rgba(76,175,80,0.12), rgba(46,125,50,0.08)',
                      borderColor: 'rgba(76,175,80,0.3)',
                    },
                    {
                      emoji: '🦸',
                      name: 'Eco Warrior',
                      desc: approvedCount >= 10 ? 'Earned! 🎉' : '10+ approved',
                      earned: approvedCount >= 10,
                      color: '#2196f3',
                      gradient: 'rgba(33,150,243,0.12), rgba(21,101,192,0.08)',
                      borderColor: 'rgba(33,150,243,0.3)',
                    },
                    {
                      emoji: '🌍',
                      name: 'Green Legend',
                      desc: approvedCount >= 50 ? 'Earned! 🎉' : '50+ approved',
                      earned: approvedCount >= 50,
                      color: '#9c27b0',
                      gradient: 'rgba(156,39,176,0.12), rgba(123,31,162,0.08)',
                      borderColor: 'rgba(156,39,176,0.3)',
                    },
                  ].map(badge => (
                    <Box key={badge.name} sx={{
                      px: { xs: 1.5, md: 3 }, py: { xs: 2, md: 2.5 },
                      borderRadius: { xs: '12px', md: '16px' },
                      background: badge.earned
                        ? `linear-gradient(135deg, ${badge.gradient})`
                        : (isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)'),
                      border: badge.earned
                        ? `1px solid ${badge.borderColor}`
                        : `1px dashed ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
                      textAlign: 'center',
                      opacity: badge.earned ? 1 : 0.5,
                      transition: 'all 0.3s ease',
                    }}>
                      {badge.icon ? (
                        <Box sx={{ color: badge.earned ? badge.color : (isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)'), mb: 0.3 }}>
                          {badge.icon}
                        </Box>
                      ) : (
                        <Typography sx={{ fontSize: { xs: '1.5rem', md: '2rem' }, mb: 0.3 }}>{badge.emoji}</Typography>
                      )}
                      <Typography sx={{
                        fontWeight: 'bold', fontSize: { xs: '0.68rem', md: '0.85rem' },
                        color: badge.earned ? badge.color : theme.palette.text.disabled,
                      }}>
                        {badge.name}
                      </Typography>
                      <Typography sx={{ fontSize: { xs: '0.58rem', md: '0.7rem' }, color: theme.palette.text.secondary, mt: 0.2 }}>
                        {badge.desc}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>

              {/* CTA for own profile */}
              {isOwnProfile && (
                <Box sx={{
                  mt: 2.5, p: { xs: 2, md: 3 }, borderRadius: { xs: '12px', md: '16px' },
                  background: isDark
                    ? 'linear-gradient(135deg, rgba(76,175,80,0.08), rgba(33,150,243,0.05))'
                    : 'linear-gradient(135deg, rgba(76,175,80,0.06), rgba(33,150,243,0.04))',
                  border: `1px solid ${isDark ? 'rgba(76,175,80,0.15)' : 'rgba(76,175,80,0.1)'}`,
                  display: 'flex', alignItems: 'center', gap: { xs: 1.5, md: 2 }, flexWrap: 'wrap',
                }}>
                  <LeaderboardIcon sx={{ color: '#4caf50', fontSize: { xs: 22, md: 28 } }} />
                  <Box sx={{ flex: 1, minWidth: { xs: 140, md: 200 } }}>
                    <Typography sx={{ fontWeight: 'bold', color: theme.palette.text.primary, fontSize: { xs: '0.82rem', md: '0.95rem' } }}>
                      Climb the Leaderboard! 🚀
                    </Typography>
                    <Typography sx={{ fontSize: { xs: '0.7rem', md: '0.8rem' }, color: theme.palette.text.secondary }}>
                      Report waste to earn the Volunteer Champion badge!
                    </Typography>
                  </Box>
                  <Button
                    variant="contained" size="small"
                    onClick={() => navigate('/leaderboard')}
                    sx={{
                      bgcolor: '#4caf50', fontWeight: 'bold', borderRadius: '10px', textTransform: 'none',
                      fontSize: { xs: '0.75rem', md: '0.85rem' },
                      '&:hover': { bgcolor: '#388e3c' },
                    }}
                  >
                    View Leaderboard
                  </Button>
                </Box>
              )}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* 📸 Profile Photo Fullscreen Modal */}
      <Modal
        open={imageModalOpen}
        onClose={() => setImageModalOpen(false)}
        closeAfterTransition
        slots={{ backdrop: Backdrop }}
        slotProps={{
          backdrop: {
            sx: {
              backgroundColor: 'rgba(0,0,0,0.85)',
              backdropFilter: 'blur(10px)',
            }
          }
        }}
      >
        <Fade in={imageModalOpen}>
          <Box
            onClick={() => setImageModalOpen(false)}
            sx={{
              position: 'fixed',
              top: 0, left: 0, right: 0, bottom: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <Box
              onClick={(e) => e.stopPropagation()}
              sx={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
                maxWidth: '90vw',
                maxHeight: '90vh',
                cursor: 'default',
              }}
            >
              <IconButton
                onClick={() => setImageModalOpen(false)}
                sx={{
                  position: 'absolute', top: -40, right: -10, zIndex: 2,
                  color: '#fff',
                  bgcolor: 'rgba(255,255,255,0.15)',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' },
                }}
              >
                <CloseIcon />
              </IconButton>
              {profile.profileImageBase64 && (
                <img
                  src={profile.profileImageBase64}
                  alt={profile.fullName || 'Profile'}
                  style={{
                    maxWidth: '85vw',
                    maxHeight: '80vh',
                    borderRadius: '16px',
                    objectFit: 'contain',
                    boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
                  }}
                />
              )}
              <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem' }}>
                Tap outside the image or ✕ to close
              </Typography>
            </Box>
          </Box>
        </Fade>
      </Modal>
    </Box>
  );
};

export default UserProfile;
