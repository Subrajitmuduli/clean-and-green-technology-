import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Box, Typography, Card, CardContent, CardMedia, Button, Grid, useTheme, Chip, CircularProgress, TextField, Tabs, Tab, IconButton, Tooltip } from '@mui/material';
import AssignmentIcon from '@mui/icons-material/Assignment';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';

import { BACKEND_URL } from '../config';

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
      if (attempt === retries) {
        if (error.name === 'AbortError') throw new Error('Request timed out.');
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, Math.min(2000 * Math.pow(2, attempt - 1), 8000)));
    }
  }
};

const CLEANUP_STEPS = [
  { key: 'PROCESSING', label: 'Processing', emoji: '📋', color: '#ff9800' },
  { key: 'ASSIGNED', label: 'Assigned', emoji: '🚛', color: '#2196f3' },
  { key: 'CLEANED', label: 'Cleaned', emoji: '✅', color: '#4caf50' },
];

const getStepIndex = (status) => CLEANUP_STEPS.findIndex(s => s.key === status);

const AdminDashboard = () => {
  const [reports, setReports] = useState([]);
  const [approvedReports, setApprovedReports] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [updatingId, setUpdatingId] = useState(null);
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  useEffect(() => {
    if (isAuthenticated) {
      fetchPendingReports();
      fetchApprovedReports();
      fetchAllUsers();
    }
  }, [isAuthenticated]);

  const fetchPendingReports = async () => {
    try {
      const res = await fetchWithRetry(`${BACKEND_URL}/api/reports/admin/pending`);
      if (res.ok) {
        const data = await res.json();
        setReports(data);
      }
    } catch (error) {
      toast.warning("Server may be waking up. Please wait and try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchApprovedReports = async () => {
    try {
      const res = await fetchWithRetry(`${BACKEND_URL}/api/reports/admin/approved`);
      if (res.ok) {
        const data = await res.json();
        setApprovedReports(data);
      }
    } catch (error) {
    }
  };

  const fetchAllUsers = async () => {
    try {
      const res = await fetchWithRetry(`${BACKEND_URL}/api/auth/admin/users/all`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (error) {
    }
  };

  const handleAction = async (id, action) => {
    try {
      const res = await fetchWithRetry(`${BACKEND_URL}/api/reports/admin/${action}/${id}`, {
        method: "POST"
      });
      if (res.ok) {
        setReports(reports.filter(r => r.id !== id));
        if (action === 'approve') {
          fetchApprovedReports();
        }
      } else {
        toast.warning("Action could not be processed. Try again.");
      }
    } catch (error) {
      toast.warning("Network issue — please try again.");
    }
  };

  const handleCleanupStatusUpdate = async (reportId, newStatus) => {
    setUpdatingId(reportId);
    try {
      const res = await fetchWithRetry(`${BACKEND_URL}/api/reports/admin/cleanup-status/${reportId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cleanupStatus: newStatus })
      });
      if (res.ok) {
        toast.success(`Cleanup status updated to "${newStatus}"`);
        setApprovedReports(prev => prev.map(r =>
          r.id === reportId ? { ...r, cleanupStatus: newStatus } : r
        ));
      } else {
        toast.warning("Could not update cleanup status. Try again.");
      }
    } catch (error) {
      toast.warning("Network issue — please try again.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleAdminDelete = async (reportId) => {
    if (!window.confirm('Are you sure you want to delete this report? This action cannot be undone. Coins will NOT be deducted.')) return;
    setUpdatingId(reportId);
    try {
      const res = await fetchWithRetry(`${BACKEND_URL}/api/reports/admin/${reportId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        toast.success('Report deleted successfully');
        setApprovedReports(prev => prev.filter(r => r.id !== reportId));
      } else {
        toast.warning('Could not delete the report. Try again.');
      }
    } catch (error) {
      toast.warning('Network issue — please try again.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('CRITICAL: Are you sure you want to delete this user? ALL reports, transactions, and progress for this user will be PERMANENTLY removed from the database for optimization.')) return;
    setUpdatingId(userId);
    try {
      const res = await fetchWithRetry(`${BACKEND_URL}/api/auth/admin/users/${userId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        toast.success('User and all data wiped successfully!');
        setUsers(prev => prev.filter(u => u.id !== userId));
        // Refresh reports since they might have been cascadingly deleted
        fetchPendingReports();
        fetchApprovedReports();
      } else {
        toast.error('Failed to delete user.');
      }
    } catch (err) {
      toast.error('Network error during user deletion.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === "022005") {
      setIsAuthenticated(true);
      toast.success("Admin Access Granted");
    } else {
      toast.error("Incorrect Password");
    }
  };

  if (!isAuthenticated) {
    return (
      <Box sx={{ bgcolor: theme.palette.background.default, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3 }}>
        <Card sx={{ p: 4, maxWidth: 400, width: '100%', borderRadius: '16px', boxShadow: theme.palette.mode === 'dark' ? '0 8px 32px rgba(0,0,0,0.4)' : '0 4px 20px rgba(0,0,0,0.1)' }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold', color: theme.palette.primary.main, mb: 3, textAlign: 'center' }}>
            Admin Access Required
          </Typography>
          <form onSubmit={handleLogin}>
            <TextField
              fullWidth
              type="password"
              label="Enter Admin Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              sx={{ mb: 3 }}
            />
            <Button fullWidth variant="contained" type="submit" sx={{ py: 1.5, fontWeight: 'bold', bgcolor: theme.palette.primary.main, '&:hover': { bgcolor: theme.palette.secondary.main } }}>
              Login
            </Button>
          </form>
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: theme.palette.background.default, minHeight: '100vh', py: 5, px: { xs: 2, md: 10 } }}>
      <Typography variant="h3" sx={{ fontWeight: 'bold', color: theme.palette.primary.main, mb: 2, textAlign: 'center' }}>
        Admin Verification Dashboard
      </Typography>
      
      <Typography variant="h6" sx={{ color: theme.palette.text.secondary, mb: 4, textAlign: 'center' }}>
        Approve or Reject pending waste reports to allocate Green Coins securely.
      </Typography>

      {/* Tabs for switching between Pending Reports and Cleanup Workflow */}
      <Box sx={{ 
        display: 'flex', justifyContent: 'center', mb: 4,
      }}>
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          sx={{
            bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
            borderRadius: '14px',
            p: 0.5,
            minHeight: 'auto',
            '& .MuiTab-root': {
              minHeight: 44,
              borderRadius: '10px',
              fontWeight: 'bold',
              textTransform: 'none',
              fontSize: '0.9rem',
              color: theme.palette.text.secondary,
              transition: 'all 0.3s ease',
              px: 3,
            },
            '& .Mui-selected': {
              bgcolor: isDark ? 'rgba(76,175,80,0.2)' : '#e8f5e9',
              color: `${theme.palette.primary.main} !important`,
            },
            '& .MuiTabs-indicator': { display: 'none' },
          }}
        >
          <Tab label={`⏳ Pending Reports (${reports.length})`} />
          <Tab label={`🔄 Cleanup Workflow (${approvedReports.filter(r => !r.hiddenByAdmin).length})`} />
          <Tab label={`👥 User Accounts (${users.length})`} />
        </Tabs>
      </Box>

      {/* TAB 0: Pending Reports (existing functionality) */}
      {activeTab === 0 && (
        <>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
              <CircularProgress />
            </Box>
          ) : reports.length === 0 ? (
            <Typography variant="h5" sx={{ textAlign: 'center', color: theme.palette.text.secondary, mt: 5 }}>
               No pending reports currently in the queue! 🎉
            </Typography>
          ) : (
            <Grid container spacing={4}>
              {reports.map((report) => (
                <Grid item xs={12} sm={6} md={4} key={report.id}>
                  <Card sx={{ 
                    bgcolor: theme.palette.background.paper, 
                    borderRadius: '16px', 
                    boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.4)' : '0 4px 20px rgba(0,0,0,0.1)',
                    overflow: 'hidden'
                  }}>
                    {report.imageBase64 ? (
                      <CardMedia
                        component="img"
                        height="200"
                        image={report.imageBase64}
                        alt="Waste report proof"
                      />
                    ) : (
                      <Box sx={{ height: 200, bgcolor: '#444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Typography color="white">No Image Provided</Typography>
                      </Box>
                    )}
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>
                            {report.wasteType}
                          </Typography>
                          <Typography variant="caption" sx={{ color: theme.palette.primary.main, fontWeight: 'bold', mb: 0.5, display: 'block' }}>
                            👤 Reported by: {report.userName}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {new Date(report.timestamp).toLocaleString()}
                          </Typography>
                        </Box>
                        <Chip 
                          label={report.severity} 
                          size="small" 
                          color={report.severity.toLowerCase().includes('high') ? 'error' : 'warning'} 
                          sx={{ fontWeight: 'bold' }} 
                        />
                      </Box>

                      <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 1, minHeight: 40 }}>
                        {report.description || "No description provided."}
                      </Typography>

                      <Typography variant="caption" sx={{ color: theme.palette.primary.main, display: 'block', mb: 2, fontWeight: 'bold' }}>
                        📍 {report.locationData || "Manual Entry"}
                      </Typography>
                      
                      <Box sx={{ p: 1.5, bgcolor: isDark ? 'rgba(76, 175, 80, 0.1)' : '#e8f5e9', borderRadius: '8px', mb: 3, textAlign: 'center' }}>
                        <Typography sx={{ color: theme.palette.primary.main, fontWeight: 'bold' }}>
                          Potential Reward: {report.coinsEarned} Coins
                        </Typography>
                      </Box>

                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Button 
                            fullWidth 
                            variant="contained" 
                            color="success" 
                            onClick={() => handleAction(report.id, 'approve')}
                          >
                            Approve
                          </Button>
                        </Grid>
                        <Grid item xs={6}>
                          <Button 
                            fullWidth 
                            variant="contained" 
                            color="error" 
                            onClick={() => handleAction(report.id, 'reject')}
                          >
                            Reject
                          </Button>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </>
      )}

      {/* TAB 2: User Account Management */}
      {activeTab === 2 && (
        <Box sx={{ mt: 2 }}>
          {users.length === 0 ? (
            <Typography variant="h5" sx={{ textAlign: 'center', color: theme.palette.text.secondary, mt: 5 }}>
               No user accounts found.
            </Typography>
          ) : (
            <Card sx={{ 
              borderRadius: '16px', 
              bgcolor: theme.palette.background.paper,
              boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.4)' : '0 4px 20px rgba(0,0,0,0.1)',
              overflow: 'hidden'
            }}>
              <Box sx={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', color: theme.palette.text.primary }}>
                  <thead>
                    <tr style={{ background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }}>
                      <th style={{ padding: '16px', textAlign: 'left' }}>User Info</th>
                      <th style={{ padding: '16px', textAlign: 'center' }}>Green Coins</th>
                      <th style={{ padding: '16px', textAlign: 'center' }}>Contact</th>
                      <th style={{ padding: '16px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} style={{ borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}` }}>
                        <td style={{ padding: '16px' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box sx={{ 
                              width: 40, height: 40, borderRadius: '50%', 
                              bgcolor: theme.palette.primary.main, color: '#fff',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontWeight: 'bold', fontSize: '1.2rem'
                            }}>
                              {user.fullName?.charAt(0) || '?'}
                            </Box>
                            <Box>
                              <Typography sx={{ fontWeight: 'bold' }}>{user.fullName}</Typography>
                              <Typography variant="caption" color="text.secondary">{user.email}</Typography>
                            </Box>
                          </Box>
                        </td>
                        <td style={{ padding: '16px', textAlign: 'center' }}>
                          <Chip 
                            label={`${user.greenCoins} Coins`} 
                            size="small" 
                            sx={{ bgcolor: isDark ? 'rgba(76,175,80,0.2)' : '#e8f5e9', color: '#4caf50', fontWeight: 'bold' }} 
                          />
                        </td>
                        <td style={{ padding: '16px', textAlign: 'center' }}>
                          <Typography variant="body2">{user.contactNumber || '—'}</Typography>
                        </td>
                        <td style={{ padding: '16px', textAlign: 'right' }}>
                          <IconButton 
                            color="error" 
                            onClick={() => handleDeleteUser(user.id)}
                            disabled={updatingId === user.id}
                          >
                            {updatingId === user.id ? <CircularProgress size={20} /> : <DeleteOutlineIcon />}
                          </IconButton>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Box>
            </Card>
          )}
        </Box>
      )}
      {activeTab === 1 && (
        <>
          {approvedReports.filter(r => !r.hiddenByAdmin).length === 0 ? (
            <Box sx={{ textAlign: 'center', mt: 5 }}>
              <Typography sx={{ fontSize: '3rem', mb: 1 }}>🧹</Typography>
              <Typography variant="h5" sx={{ color: theme.palette.text.secondary }}>
                No approved reports to manage yet
              </Typography>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mt: 1 }}>
                Approve pending reports first — they'll appear here for cleanup tracking.
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={3}>
              {approvedReports.filter(r => !r.hiddenByAdmin).map((report) => {
                const currentStepIdx = getStepIndex(report.cleanupStatus);
                const isUpdating = updatingId === report.id;
                
                return (
                  <Grid item xs={12} sm={6} md={4} key={report.id}>
                    <Card sx={{
                      bgcolor: theme.palette.background.paper,
                      borderRadius: '16px',
                      boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.4)' : '0 4px 20px rgba(0,0,0,0.1)',
                      overflow: 'hidden',
                      border: report.cleanupStatus === 'CLEANED'
                        ? '2px solid rgba(76,175,80,0.3)'
                        : `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-3px)',
                        boxShadow: isDark ? '0 12px 40px rgba(0,0,0,0.5)' : '0 8px 30px rgba(0,0,0,0.12)',
                      },
                      position: 'relative',
                    }}>
                      {/* Completed badge */}
                      {report.cleanupStatus === 'CLEANED' && (
                        <Box sx={{
                          position: 'absolute', top: 12, right: 12, zIndex: 2,
                          px: 1.5, py: 0.4, borderRadius: '20px',
                          background: 'linear-gradient(135deg, #4caf50, #2e7d32)',
                          color: '#fff', fontSize: '0.7rem', fontWeight: 'bold',
                          boxShadow: '0 2px 10px rgba(76,175,80,0.4)',
                        }}>
                          🎉 Completed
                        </Box>
                      )}

                      {/* Report image */}
                      {report.imageBase64 ? (
                        <CardMedia component="img" height="140" image={report.imageBase64} alt="Waste" sx={{ objectFit: 'cover' }} />
                      ) : (
                        <Box sx={{ height: 80, background: isDark ? 'linear-gradient(135deg, #1a2a1a, #0f1f15)' : 'linear-gradient(135deg, #e8f5e9, #c8e6c9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Typography sx={{ fontSize: '1.5rem' }}>🗑️</Typography>
                        </Box>
                      )}

                      <CardContent>
                        {/* Report info */}
                        <Typography sx={{ fontWeight: 'bold', fontSize: '1rem', color: theme.palette.text.primary, mb: 0.3 }}>
                          {report.wasteType}
                        </Typography>
                        <Typography variant="caption" sx={{ color: theme.palette.primary.main, fontWeight: 'bold', mb: 1, display: 'block' }}>
                          👤 {report.userName}
                        </Typography>
                        <Typography sx={{ fontSize: '0.75rem', color: theme.palette.text.secondary, mb: 2 }}>
                          📅 {new Date(report.timestamp).toLocaleDateString()} • 📍 {(report.locationData || 'Manual Entry').substring(0, 30)}
                        </Typography>

                        {/* Mini stepper */}
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2.5, gap: 0.5 }}>
                          {CLEANUP_STEPS.map((step, idx) => {
                            const isActive = idx <= currentStepIdx;
                            const isCurrent = idx === currentStepIdx;
                            return (
                              <React.Fragment key={step.key}>
                                <Box sx={{
                                  width: 32, height: 32, borderRadius: '50%',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  background: isActive ? `linear-gradient(135deg, ${step.color}, ${step.color}cc)` : isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                                  fontSize: '0.9rem',
                                  transition: 'all 0.4s ease',
                                  boxShadow: isCurrent ? `0 2px 12px ${step.color}50` : 'none',
                                  ...(isCurrent && {
                                    animation: 'admin-pulse 2s ease-in-out infinite',
                                    '@keyframes admin-pulse': {
                                      '0%, 100%': { boxShadow: `0 2px 12px ${step.color}50` },
                                      '50%': { boxShadow: `0 2px 20px ${step.color}80` },
                                    }
                                  }),
                                }}>
                                  {step.emoji}
                                </Box>
                                {idx < CLEANUP_STEPS.length - 1 && (
                                  <Box sx={{
                                    flex: 1, height: 3, borderRadius: '2px',
                                    background: idx < currentStepIdx ? step.color : isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                                    transition: 'all 0.4s ease',
                                  }} />
                                )}
                              </React.Fragment>
                            );
                          })}
                        </Box>

                        {/* Current status label */}
                        <Typography sx={{
                          fontSize: '0.8rem', fontWeight: 'bold', mb: 2,
                          color: CLEANUP_STEPS[currentStepIdx]?.color || '#888',
                        }}>
                          Current: {CLEANUP_STEPS[currentStepIdx]?.label || 'Unknown'}
                        </Typography>

                        {/* Action Buttons — show next step + delete at every stage */}
                        {isUpdating ? (
                          <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
                            <CircularProgress size={28} sx={{ color: theme.palette.primary.main }} />
                          </Box>
                        ) : report.cleanupStatus !== 'CLEANED' ? (
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            {currentStepIdx < 1 && (
                              <Button
                                fullWidth
                                variant="contained"
                                size="small"
                                onClick={() => handleCleanupStatusUpdate(report.id, 'ASSIGNED')}
                                sx={{
                                  textTransform: 'none', fontWeight: 'bold', borderRadius: '10px',
                                  background: 'linear-gradient(135deg, #2196f3, #1976d2)',
                                  '&:hover': { background: 'linear-gradient(135deg, #42a5f5, #1e88e5)' },
                                }}
                              >
                                🚛 Mark as Assigned
                              </Button>
                            )}
                            {currentStepIdx < 2 && currentStepIdx >= 1 && (
                              <Button
                                fullWidth
                                variant="contained"
                                size="small"
                                onClick={() => handleCleanupStatusUpdate(report.id, 'CLEANED')}
                                sx={{
                                  textTransform: 'none', fontWeight: 'bold', borderRadius: '10px',
                                  background: 'linear-gradient(135deg, #4caf50, #2e7d32)',
                                  '&:hover': { background: 'linear-gradient(135deg, #66bb6a, #388e3c)' },
                                }}
                              >
                                ✅ Mark as Cleaned
                              </Button>
                            )}
                            {/* Delete button available at EVERY stage */}
                            <Button
                              fullWidth
                              variant="outlined"
                              size="small"
                              startIcon={<DeleteOutlineIcon />}
                              onClick={() => handleAdminDelete(report.id)}
                              sx={{
                                textTransform: 'none', fontWeight: 'bold', borderRadius: '10px',
                                color: '#f44336',
                                borderColor: 'rgba(244,67,54,0.3)',
                                '&:hover': {
                                  borderColor: '#f44336',
                                  bgcolor: 'rgba(244,67,54,0.08)',
                                },
                              }}
                            >
                              Delete Report
                            </Button>
                          </Box>
                        ) : (
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            <Box sx={{
                              textAlign: 'center', py: 1, borderRadius: '10px',
                              bgcolor: isDark ? 'rgba(76,175,80,0.1)' : 'rgba(76,175,80,0.08)',
                            }}>
                              <Typography sx={{ fontSize: '0.8rem', color: '#4caf50', fontWeight: 'bold' }}>
                                ✨ Cleanup Complete
                              </Typography>
                            </Box>
                            <Button
                              fullWidth
                              variant="outlined"
                              size="small"
                              startIcon={<DeleteOutlineIcon />}
                              onClick={() => handleAdminDelete(report.id)}
                              sx={{
                                textTransform: 'none', fontWeight: 'bold', borderRadius: '10px',
                                color: '#f44336',
                                borderColor: 'rgba(244,67,54,0.3)',
                                '&:hover': {
                                  borderColor: '#f44336',
                                  bgcolor: 'rgba(244,67,54,0.08)',
                                },
                              }}
                            >
                              Delete Report
                            </Button>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </>
      )}
    </Box>
  );
};

export default AdminDashboard;
