import React, { useState, useEffect, useRef } from "react";
import { toast } from 'react-toastify';
import { 
  Box, Typography, Card, CardContent, Table, TableBody, TableCell, TableHead, TableRow, 
  useTheme, Grid, CircularProgress, Button, Modal, IconButton, Fade, Backdrop, Dialog,
  DialogTitle, DialogContent, DialogContentText, DialogActions
} from "@mui/material";
import MapIcon from '@mui/icons-material/Map';
import TrackChangesIcon from '@mui/icons-material/TrackChanges';
import CloseIcon from '@mui/icons-material/Close';
import AssignmentIcon from '@mui/icons-material/Assignment';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import RefreshIcon from '@mui/icons-material/Refresh';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getUser, setUser as saveUser } from '../utils/safeStorage';

import { BACKEND_URL } from '../config';

// Fix default Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

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

// Custom marker icons
const createCustomIcon = (color) => new L.DivIcon({
  className: 'custom-marker',
  html: `<div style="
    width: 28px; height: 28px; border-radius: 50% 50% 50% 0;
    background: ${color}; transform: rotate(-45deg);
    border: 3px solid #fff; box-shadow: 0 3px 10px rgba(0,0,0,0.3);
    display: flex; align-items: center; justify-content: center;
  "><div style="
    width: 10px; height: 10px; border-radius: 50%;
    background: #fff; transform: rotate(45deg);
  "></div></div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -28],
});

const pendingIcon = createCustomIcon('#ff9800');
const approvedIcon = createCustomIcon('#4caf50');
const rejectedIcon = createCustomIcon('#f44336');

// Helper to parse coordinates from locationData string
const parseCoordinates = (locationData) => {
  if (!locationData) return null;
  const latLngMatch = locationData.match(/Lat\s*([-\d.]+),?\s*Lng\s*([-\d.]+)/i);
  if (latLngMatch) {
    const lat = parseFloat(latLngMatch[1]);
    const lng = parseFloat(latLngMatch[2]);
    if (!isNaN(lat) && !isNaN(lng)) return [lat, lng];
  }
  return null;
};

// Map auto-fit component
const MapAutoFit = ({ markers, mapRef }) => {
  useEffect(() => {
    if (mapRef.current && markers.length > 0) {
      const bounds = L.latLngBounds(markers.map(m => [m.lat, m.lng]));
      mapRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }, [markers, mapRef]);
  return null;
};

/* ─────────────── CLEANUP WORKFLOW STEPPER ─────────────── */
const CLEANUP_STEPS = [
  { key: 'PROCESSING', label: 'Processing the Report', icon: <AssignmentIcon />, emoji: '📋', description: 'Your report has been received and is being processed by our team.' },
  { key: 'ASSIGNED',   label: 'Assigned to Clear the Waste', icon: <LocalShippingIcon />, emoji: '🚛', description: 'A cleanup crew has been assigned to your reported location.' },
  { key: 'CLEANED',    label: 'Waste is Cleaned', icon: <CheckCircleOutlineIcon />, emoji: '✅', description: 'The waste has been successfully cleaned! Thank you for your contribution.' },
];

const getStepIndex = (cleanupStatus) => {
  const idx = CLEANUP_STEPS.findIndex(s => s.key === cleanupStatus);
  return idx >= 0 ? idx : -1;
};

const WorkflowStepper = ({ report, isDark, onDelete }) => {
  const currentStep = getStepIndex(report.cleanupStatus);
  const isCompleted = currentStep === 2; // CLEANED

  return (
    <Box sx={{
      p: 3,
      mb: 2.5,
      borderRadius: '16px',
      background: isDark
        ? 'linear-gradient(135deg, rgba(30,40,30,0.9), rgba(20,30,40,0.9))'
        : 'linear-gradient(135deg, #f0fdf4, #ecfeff)',
      border: `1px solid ${isDark ? 'rgba(76,175,80,0.2)' : 'rgba(76,175,80,0.15)'}`,
      position: 'relative',
      overflow: 'hidden',
      transition: 'all 0.4s ease',
      '&:hover': {
        boxShadow: isDark ? '0 8px 30px rgba(76,175,80,0.15)' : '0 8px 30px rgba(76,175,80,0.1)',
        transform: 'translateY(-2px)',
      }
    }}>
      {/* Celebration glow for completed */}
      {isCompleted && (
        <Box sx={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          background: 'radial-gradient(circle at center, rgba(76,175,80,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
          animation: 'pulse-glow 2s ease-in-out infinite',
          '@keyframes pulse-glow': {
            '0%, 100%': { opacity: 0.5 },
            '50%': { opacity: 1 },
          }
        }} />
      )}

      {/* Report Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2.5, position: 'relative', zIndex: 1 }}>
        <Box>
          <Typography sx={{ fontWeight: 'bold', fontSize: '1.05rem', color: isDark ? '#fff' : '#1a1a1a' }}>
            {report.wasteType || 'Waste Report'}
          </Typography>
          <Typography sx={{ fontSize: '0.8rem', color: isDark ? 'rgba(255,255,255,0.5)' : '#888', mt: 0.3 }}>
            📅 {report.timestamp ? new Date(report.timestamp).toLocaleDateString() : 'N/A'}
            {report.locationData && ` • 📍 ${report.locationData.substring(0, 40)}${report.locationData.length > 40 ? '...' : ''}`}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {isCompleted && (
            <Box sx={{
              px: 1.5, py: 0.5, borderRadius: '20px',
              background: 'linear-gradient(135deg, #4caf50, #2e7d32)',
              color: '#fff', fontSize: '0.75rem', fontWeight: 'bold',
              display: 'flex', alignItems: 'center', gap: 0.5,
              animation: 'badge-pop 0.5s ease-out',
              '@keyframes badge-pop': {
                '0%': { transform: 'scale(0)' },
                '60%': { transform: 'scale(1.15)' },
                '100%': { transform: 'scale(1)' },
              }
            }}>
              🎉 Complete
            </Box>
          )}
          {/* 🗑️ Delete button for ALL cleanup reports (not just completed) */}
          {onDelete && (
            <IconButton
              onClick={() => onDelete(report)}
              size="small"
              sx={{
                color: isDark ? 'rgba(255,255,255,0.4)' : '#bbb',
                transition: 'all 0.3s ease',
                '&:hover': {
                  color: '#f44336',
                  bgcolor: 'rgba(244,67,54,0.1)',
                  transform: 'scale(1.1)',
                },
              }}
            >
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
      </Box>

      {/* Stepper */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
        {CLEANUP_STEPS.map((step, index) => {
          const isActive = index <= currentStep;
          const isCurrent = index === currentStep;

          return (
            <React.Fragment key={step.key}>
              {/* Step Circle + Label */}
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, position: 'relative' }}>
                {/* Circle */}
                <Box sx={{
                  width: 48, height: 48,
                  borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: isActive
                    ? 'linear-gradient(135deg, #4caf50, #66bb6a)'
                    : isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                  color: isActive ? '#fff' : isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.25)',
                  transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: isActive ? '0 4px 15px rgba(76,175,80,0.4)' : 'none',
                  fontSize: '1.4rem',
                  ...(isCurrent && {
                    animation: 'step-pulse 2s ease-in-out infinite',
                    '@keyframes step-pulse': {
                      '0%, 100%': { boxShadow: '0 4px 15px rgba(76,175,80,0.4)' },
                      '50%': { boxShadow: '0 4px 25px rgba(76,175,80,0.7)' },
                    }
                  }),
                }}>
                  {step.emoji}
                </Box>

                {/* Label */}
                <Typography sx={{
                  mt: 1, fontSize: '0.72rem', fontWeight: isActive ? 'bold' : 500,
                  color: isActive
                    ? (isDark ? '#66bb6a' : '#2e7d32')
                    : (isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.35)'),
                  textAlign: 'center',
                  transition: 'all 0.4s ease',
                  maxWidth: 100,
                  lineHeight: 1.3,
                }}>
                  {step.label}
                </Typography>

                {/* Description for current step */}
                {isCurrent && (
                  <Typography sx={{
                    mt: 0.5, fontSize: '0.65rem',
                    color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
                    textAlign: 'center', maxWidth: 120, lineHeight: 1.3,
                    animation: 'fade-in 0.5s ease-out',
                    '@keyframes fade-in': {
                      '0%': { opacity: 0, transform: 'translateY(4px)' },
                      '100%': { opacity: 1, transform: 'translateY(0)' },
                    }
                  }}>
                    {step.description}
                  </Typography>
                )}
              </Box>

              {/* Connector line between steps */}
              {index < CLEANUP_STEPS.length - 1 && (
                <Box sx={{
                  flex: '0 0 auto', width: { xs: 30, sm: 60 }, height: 4,
                  mt: '22px',
                  borderRadius: '2px',
                  background: index < currentStep
                    ? 'linear-gradient(90deg, #4caf50, #66bb6a)'
                    : isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                  transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  overflow: 'hidden',
                  ...(index < currentStep && {
                    '&::after': {
                      content: '""', position: 'absolute', top: 0, left: 0,
                      width: '100%', height: '100%',
                      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
                      animation: 'shimmer 2s infinite',
                      '@keyframes shimmer': {
                        '0%': { transform: 'translateX(-100%)' },
                        '100%': { transform: 'translateX(100%)' },
                      }
                    }
                  })
                }} />
              )}
            </React.Fragment>
          );
        })}
      </Box>
    </Box>
  );
};

const EarnCoins = () => {
  const [totalCoins, setTotalCoins] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mapMarkers, setMapMarkers] = useState([]);
  const [workflowOpen, setWorkflowOpen] = useState(false);
  const [workflowRefreshing, setWorkflowRefreshing] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reportToDelete, setReportToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const mapRef = useRef(null);

  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const fetchData = async (preserveCoins = false) => {
    const user = getUser();
    if (!user) {
      setLoading(false);
      return;
    }
    const savedCoins = totalCoins; // preserve current coins
    try {
      const response = await fetchWithRetry(`${BACKEND_URL}/api/coins/history/${user.id}`);
      if (response.ok) {
        const data = await response.json();
        // If preserveCoins flag is set (after delete), keep the higher of saved vs fetched
        const newCoins = preserveCoins ? Math.max(savedCoins, data.totalCoins) : data.totalCoins;
        setTotalCoins(newCoins);
        setTransactions(data.history);
        
        user.greenCoins = newCoins;
        saveUser(user);
      }

      const reportsRes = await fetchWithRetry(`${BACKEND_URL}/api/reports/user/${user.id}`);
      if (reportsRes.ok) {
        const reportsData = await reportsRes.json();
        setReports(reportsData);

        // Build map markers from reports
        const markers = [];
        for (const report of reportsData) {
          if (report.latitude && report.longitude) {
            markers.push({ lat: report.latitude, lng: report.longitude, report });
          } else {
            const coords = parseCoordinates(report.locationData);
            if (coords) {
              markers.push({ lat: coords[0], lng: coords[1], report });
            }
          }
        }
        setMapMarkers(markers);
      }
    } catch (error) {
      if (error.message.includes('timed out')) {
        toast.warning("⏳ Server is waking up — data will load shortly. Please refresh.", { autoClose: 6000 });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Auto-refresh every 10 seconds to keep data fresh without overwhelming server
    const refreshInterval = setInterval(() => {
      fetchData();
    }, 10 * 1000);
    return () => clearInterval(refreshInterval);
  }, []);

  const handleRefreshWorkflow = async () => {
    setWorkflowRefreshing(true);
    await fetchData();
    setTimeout(() => setWorkflowRefreshing(false), 600);
  };

  // 🗑️ Delete report handler
  const handleDeleteClick = (report) => {
    setReportToDelete(report);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!reportToDelete) return;
    setDeleting(true);

    const user = getUser();
    if (!user) {
      toast.error("Please log in again.");
      setDeleting(false);
      setDeleteDialogOpen(false);
      return;
    }

    try {
      const response = await fetchWithRetry(
        `${BACKEND_URL}/api/reports/${reportToDelete.id}?userId=${user.id}`,
        { method: 'DELETE' },
        2,
        30000
      );

      if (response.ok) {
        const data = await response.json();
        toast.success('✅ Report deleted successfully! Your coins are safe.');
        // Refresh data but preserve coins (they should NOT be deducted)
        await fetchData(true);
      } else {
        const errData = await response.json().catch(() => ({}));
        toast.warning(errData.message || "Could not delete report. Try again.");
      }
    } catch (error) {
      toast.warning("Network issue — please try again.");
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setReportToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setReportToDelete(null);
  };

  const approvedReports = reports.filter(r => r.status === 'APPROVED' && r.cleanupStatus);

  const glassCardStyle = {
    background: isDark ? 'rgba(30,30,30,0.8)' : '#ffffff',
    borderRadius: '16px',
    boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 2px 10px rgba(0,0,0,0.06)',
    mb: 3
  };

  const getStatusBadge = (status) => {
    const styles = {
      APPROVED: { bg: 'rgba(76, 175, 80, 0.15)', color: '#4caf50', label: '✅ Approved' },
      REJECTED: { bg: 'rgba(244, 67, 54, 0.15)', color: '#f44336', label: '❌ Rejected' },
      PENDING: { bg: 'rgba(255, 152, 0, 0.15)', color: '#ff9800', label: '⏳ Pending' },
    };
    const s = styles[status] || styles.PENDING;
    return (
      <Box sx={{
        display: 'inline-block', px: 1, py: 0.3, borderRadius: '6px',
        fontSize: '0.75rem', fontWeight: 'bold', bgcolor: s.bg, color: s.color
      }}>
        {s.label}
      </Box>
    );
  };

  const getMarkerIcon = (status) => {
    if (status === 'APPROVED') return approvedIcon;
    if (status === 'REJECTED') return rejectedIcon;
    return pendingIcon;
  };

  const defaultCenter = mapMarkers.length > 0
    ? [mapMarkers[0].lat, mapMarkers[0].lng]
    : [20.5937, 78.9629];

  return (
    <Box sx={{ bgcolor: theme.palette.background.default, minHeight: '100vh', py: 5, px: { xs: 2, md: 10 }, transition: 'all 0.5s ease' }}>

      {/* HEADER SECTION */}
      <Box sx={{ 
        background: isDark ? 'linear-gradient(135deg, #1A4222, #0F2916)' : 'linear-gradient(135deg, #d6ffe0, #e9f7ff)', 
        borderRadius: '20px', 
        p: 4, 
        mb: 5,
        boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.4)' : 'none'
      }}>
        <Typography variant="h3" sx={{ fontWeight: 'bold', color: isDark ? '#fff' : '#146b35', mb: 3 }}>
          Green Coins 💚
        </Typography>

        <Card sx={{ bgcolor: theme.palette.background.paper, borderRadius: '12px', p: 2 }}>
          <CardContent sx={{ pb: '16px !important' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="h6" color="text.secondary">Current Balance</Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: theme.palette.primary.main }}>
                {loading ? "..." : totalCoins}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary">Pending Verifications</Typography>
              <Typography variant="body2" sx={{ color: '#f57c00', fontWeight: 'bold' }}>
                {reports.filter(r => r.status === 'PENDING').length}
              </Typography>
            </Box>
          </CardContent>
        </Card>

        {/* TRACK CLEANUP PROGRESS BUTTON */}
        <Button
          id="track-cleanup-btn"
          variant="contained"
          startIcon={<TrackChangesIcon />}
          onClick={() => setWorkflowOpen(true)}
          sx={{
            mt: 3,
            py: 1.5,
            px: 4,
            fontWeight: 'bold',
            fontSize: '1rem',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #4caf50, #2e7d32)',
            color: '#fff',
            textTransform: 'none',
            boxShadow: '0 6px 24px rgba(76,175,80,0.35)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0, left: '-100%',
              width: '200%', height: '100%',
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)',
              animation: 'btn-shimmer 3s infinite',
              '@keyframes btn-shimmer': {
                '0%': { left: '-100%' },
                '100%': { left: '100%' },
              }
            },
            '&:hover': {
              background: 'linear-gradient(135deg, #66bb6a, #388e3c)',
              boxShadow: '0 8px 30px rgba(76,175,80,0.5)',
              transform: 'translateY(-2px)',
            },
          }}
        >
          🌿 Track Cleanup Progress
        </Button>
      </Box>

      {/* WORKFLOW MODAL */}
      <Modal
        open={workflowOpen}
        onClose={() => setWorkflowOpen(false)}
        closeAfterTransition
        slots={{ backdrop: Backdrop }}
        slotProps={{
          backdrop: {
            sx: {
              backgroundColor: isDark ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.5)',
              backdropFilter: 'blur(8px)',
            }
          }
        }}
      >
        <Fade in={workflowOpen}>
          <Box sx={{
            position: 'absolute',
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: { xs: '95%', sm: '85%', md: '70%', lg: '60%' },
            maxHeight: '85vh',
            overflowY: 'auto',
            borderRadius: '24px',
            background: isDark
              ? 'linear-gradient(145deg, rgba(25,30,25,0.98), rgba(15,20,20,0.98))'
              : 'linear-gradient(145deg, #ffffff, #f8fdf8)',
            border: `1px solid ${isDark ? 'rgba(76,175,80,0.2)' : 'rgba(76,175,80,0.15)'}`,
            boxShadow: isDark
              ? '0 24px 80px rgba(0,0,0,0.6), 0 0 40px rgba(76,175,80,0.1)'
              : '0 24px 80px rgba(0,0,0,0.15), 0 0 40px rgba(76,175,80,0.05)',
            p: { xs: 2.5, sm: 4 },
            outline: 'none',
            '&::-webkit-scrollbar': { width: '6px' },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)',
              borderRadius: '3px',
            },
          }}>
            {/* Modal Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{
                  width: 44, height: 44, borderRadius: '12px',
                  background: 'linear-gradient(135deg, #4caf50, #2e7d32)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 4px 15px rgba(76,175,80,0.3)',
                }}>
                  <TrackChangesIcon sx={{ color: '#fff', fontSize: 24 }} />
                </Box>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', color: isDark ? '#fff' : '#1a1a1a', lineHeight: 1.2 }}>
                    Cleanup Progress
                  </Typography>
                  <Typography variant="caption" sx={{ color: isDark ? 'rgba(255,255,255,0.5)' : '#888' }}>
                    Track how your reports are making a difference
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <IconButton
                  onClick={handleRefreshWorkflow}
                  sx={{
                    color: isDark ? 'rgba(255,255,255,0.5)' : '#888',
                    animation: workflowRefreshing ? 'spin 0.6s linear' : 'none',
                    '@keyframes spin': { '0%': { transform: 'rotate(0deg)' }, '100%': { transform: 'rotate(360deg)' } },
                    '&:hover': { color: '#4caf50' },
                  }}
                >
                  <RefreshIcon />
                </IconButton>
                <IconButton
                  onClick={() => setWorkflowOpen(false)}
                  sx={{
                    color: isDark ? 'rgba(255,255,255,0.5)' : '#888',
                    '&:hover': { color: '#f44336', bgcolor: 'rgba(244,67,54,0.1)' },
                  }}
                >
                  <CloseIcon />
                </IconButton>
              </Box>
            </Box>

            {/* Quick Stats */}
            <Box sx={{
              display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap',
            }}>
              {[
                { label: 'Processing', count: approvedReports.filter(r => r.cleanupStatus === 'PROCESSING').length, color: '#ff9800', emoji: '📋' },
                { label: 'Assigned', count: approvedReports.filter(r => r.cleanupStatus === 'ASSIGNED').length, color: '#2196f3', emoji: '🚛' },
                { label: 'Cleaned', count: approvedReports.filter(r => r.cleanupStatus === 'CLEANED').length, color: '#4caf50', emoji: '✅' },
              ].map(stat => (
                <Box key={stat.label} sx={{
                  flex: 1, minWidth: 100,
                  p: 1.5, borderRadius: '12px',
                  background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'}`,
                  textAlign: 'center',
                }}>
                  <Typography sx={{ fontSize: '1.5rem', mb: 0.3 }}>{stat.emoji}</Typography>
                  <Typography sx={{ fontWeight: 'bold', fontSize: '1.2rem', color: stat.color }}>{stat.count}</Typography>
                  <Typography sx={{ fontSize: '0.7rem', color: isDark ? 'rgba(255,255,255,0.4)' : '#888' }}>{stat.label}</Typography>
                </Box>
              ))}
            </Box>

            {/* Reports with Steppers */}
            {approvedReports.filter(r => !r.hiddenByUser).length > 0 ? (
              approvedReports.filter(r => !r.hiddenByUser).map((report) => (
                <WorkflowStepper key={report.id} report={report} isDark={isDark} onDelete={handleDeleteClick} />
              ))
            ) : (
              <Box sx={{
                textAlign: 'center', py: 6,
                background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                borderRadius: '16px',
              }}>
                <Typography sx={{ fontSize: '3rem', mb: 1 }}>🌱</Typography>
                <Typography sx={{ fontWeight: 'bold', fontSize: '1.1rem', color: isDark ? '#fff' : '#1a1a1a', mb: 0.5 }}>
                  No Active Cleanup Workflows
                </Typography>
                <Typography sx={{ fontSize: '0.85rem', color: isDark ? 'rgba(255,255,255,0.4)' : '#888', maxWidth: 320, mx: 'auto' }}>
                  Once your waste reports are approved, you'll see the cleanup progress here. Keep reporting waste to make a difference!
                </Typography>
              </Box>
            )}

            {/* Footer note */}
            <Box sx={{
              mt: 3, pt: 2,
              borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
              display: 'flex', alignItems: 'center', gap: 1,
            }}>
              <Typography sx={{ fontSize: '0.75rem', color: isDark ? 'rgba(255,255,255,0.35)' : '#aaa' }}>
                💡 Your contributions help keep the environment clean. The cleanup team reviews and acts on every approved report. Use the 🗑️ icon on completed reports to remove them.
              </Typography>
            </Box>
          </Box>
        </Fade>
      </Modal>

      {/* DELETE CONFIRMATION DIALOG */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        PaperProps={{
          sx: {
            borderRadius: '16px',
            background: isDark
              ? 'linear-gradient(145deg, rgba(30,30,30,0.98), rgba(20,20,20,0.98))'
              : '#fff',
            boxShadow: '0 24px 60px rgba(0,0,0,0.3)',
            border: `1px solid ${isDark ? 'rgba(244,67,54,0.2)' : 'rgba(244,67,54,0.1)'}`,
            p: 1,
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 'bold', color: isDark ? '#fff' : '#1a1a1a', pb: 1 }}>
          🗑️ Delete Cleanup Report?
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: isDark ? 'rgba(255,255,255,0.6)' : '#666', fontSize: '0.9rem' }}>
            {reportToDelete && (
              <>
                This will permanently delete the <strong>"{reportToDelete.wasteType}"</strong> report from your cleanup history.
                <br /><br />
                <strong style={{ color: '#4caf50' }}>Your Green Coins will NOT be deducted.</strong>
                <br /><br />
                This action cannot be undone.
              </>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={handleDeleteCancel}
            disabled={deleting}
            sx={{
              textTransform: 'none',
              fontWeight: 'bold',
              color: isDark ? 'rgba(255,255,255,0.6)' : '#888',
              borderRadius: '10px',
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            disabled={deleting}
            variant="contained"
            startIcon={deleting ? <CircularProgress size={18} color="inherit" /> : <DeleteOutlineIcon />}
            sx={{
              textTransform: 'none',
              fontWeight: 'bold',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #f44336, #c62828)',
              color: '#fff',
              '&:hover': {
                background: 'linear-gradient(135deg, #ef5350, #d32f2f)',
              },
            }}
          >
            {deleting ? 'Deleting...' : 'Delete Report'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* YOUR REPORTS */}
      <Card sx={glassCardStyle}>
        <CardContent>
          <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3, color: theme.palette.text.primary }}>
            Your Reports & Verification Status
          </Typography>
          {loading ? (
               <Typography color="text.secondary">Loading reports...</Typography>
          ) : reports.length > 0 ? (
            <Box sx={{ overflowX: 'auto' }}>
              <Table>
                <TableHead sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.05)' : '#f8f9fa' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>Category</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>Severity</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>Potential Reward</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>Cleanup</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reports.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell sx={{ color: theme.palette.text.secondary }}>{new Date(r.timestamp).toLocaleDateString()}</TableCell>
                      <TableCell sx={{ color: theme.palette.text.secondary }}>{r.wasteType}</TableCell>
                      <TableCell sx={{ color: theme.palette.text.secondary }}>{r.severity}</TableCell>
                      <TableCell sx={{ color: theme.palette.primary.main, fontWeight: 'bold' }}>+{r.coinsEarned}</TableCell>
                      <TableCell>
                        <Box sx={{
                          display: 'inline-block', px: 1.5, py: 0.5, borderRadius: '8px', fontSize: '0.85rem', fontWeight: 'bold',
                          bgcolor: r.status === 'APPROVED' ? 'rgba(76, 175, 80, 0.1)' : r.status === 'REJECTED' ? 'rgba(244, 67, 54, 0.1)' : 'rgba(255, 152, 0, 0.1)',
                          color: r.status === 'APPROVED' ? '#4caf50' : r.status === 'REJECTED' ? '#f44336' : '#ff9800'
                        }}>
                          {r.status === 'PENDING' ? '⏳ Pending' : r.status === 'APPROVED' ? '✅ Approved' : '❌ Rejected'}
                        </Box>
                      </TableCell>
                      <TableCell>
                        {r.cleanupStatus ? (
                          <Box sx={{
                            display: 'inline-flex', alignItems: 'center', gap: 0.5,
                            px: 1.5, py: 0.5, borderRadius: '8px', fontSize: '0.8rem', fontWeight: 'bold',
                            bgcolor: r.cleanupStatus === 'CLEANED' ? 'rgba(76,175,80,0.12)' : r.cleanupStatus === 'ASSIGNED' ? 'rgba(33,150,243,0.12)' : 'rgba(255,152,0,0.12)',
                            color: r.cleanupStatus === 'CLEANED' ? '#4caf50' : r.cleanupStatus === 'ASSIGNED' ? '#2196f3' : '#ff9800',
                          }}>
                            {r.cleanupStatus === 'PROCESSING' && '📋'}
                            {r.cleanupStatus === 'ASSIGNED' && '🚛'}
                            {r.cleanupStatus === 'CLEANED' && '✅'}
                            {r.cleanupStatus === 'PROCESSING' ? 'Processing' : r.cleanupStatus === 'ASSIGNED' ? 'Assigned' : 'Cleaned'}
                          </Box>
                        ) : (
                          <Typography sx={{ fontSize: '0.8rem', color: isDark ? 'rgba(255,255,255,0.3)' : '#ccc' }}>—</Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          ) : (
            <Typography color="text.secondary">No reports found. Start reporting waste!</Typography>
          )}
        </CardContent>
      </Card>

      {/* TRANSACTION HISTORY */}
      <Card sx={glassCardStyle}>
        <CardContent>
          <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3, color: theme.palette.text.primary }}>
            Your Coin History
          </Typography>
          {loading ? (
               <Typography color="text.secondary">Loading history...</Typography>
          ) : transactions.length > 0 ? (
            <Box sx={{ overflowX: 'auto' }}>
              <Table>
                <TableHead sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.05)' : '#f8f9fa' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>Date & Time</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>Task / Reason</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>Amount Earned</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {transactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell sx={{ color: theme.palette.text.secondary }}>{new Date(tx.timestamp).toLocaleString()}</TableCell>
                      <TableCell sx={{ color: theme.palette.text.secondary }}>{tx.reason}</TableCell>
                      <TableCell sx={{ color: theme.palette.primary.main, fontWeight: 'bold' }}>+{tx.amount} 🌿</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          ) : (
            <Typography color="text.secondary">No transactions found. Start reporting waste to earn coins!</Typography>
          )}
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          {/* HOW TO EARN */}
          <Card sx={{ ...glassCardStyle, height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: theme.palette.text.primary }}>Earn Coins</Typography>
              <Typography color="text.secondary" mb={2}>Earn Green Coins whenever you report waste responsibly.</Typography>
              <Box component="ul" sx={{ color: theme.palette.text.secondary, pl: 2, lineHeight: 1.8 }}>
                <li>Earn Dynamic Coins based on severity of your report</li>
                <li>Coins valid for 365 days</li>
                <li>Use Coins to get discounts on eco-products</li>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          {/* WHAT ARE COINS */}
          <Card sx={{ ...glassCardStyle, height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: theme.palette.text.primary }}>What are Green Coins?</Typography>
              <Typography color="text.secondary" lineHeight={1.8}>
                Green Coins are reward points you earn for contributing to cleaner
                surroundings. You can redeem them to get eco-friendly product
                discounts or other benefits.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* HOW DO I EARN */}
      <Card sx={{ ...glassCardStyle, mt: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: theme.palette.text.primary }}>How do I earn Coins?</Typography>
          <Typography color="text.secondary" mb={2}>You earn Coins when you submit reports about waste or pollution.</Typography>
          
          <Box sx={{ overflowX: 'auto' }}>
            <Table>
              <TableHead sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.05)' : '#f8f9fa' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>Report Type</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>Coins Earned</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow><TableCell sx={{ color: theme.palette.text.secondary }}>Plastic Waste Report</TableCell><TableCell sx={{ color: theme.palette.primary.main, fontWeight: 'bold' }}>+ 30</TableCell></TableRow>
                <TableRow><TableCell sx={{ color: theme.palette.text.secondary }}>Medical / E-Waste Report</TableCell><TableCell sx={{ color: theme.palette.primary.main, fontWeight: 'bold' }}>+ 50</TableCell></TableRow>
                <TableRow><TableCell sx={{ color: theme.palette.text.secondary }}>High Severity / Dumping</TableCell><TableCell sx={{ color: theme.palette.primary.main, fontWeight: 'bold' }}>+ 75</TableCell></TableRow>
                <TableRow><TableCell sx={{ color: theme.palette.text.secondary }}>Standard Reports</TableCell><TableCell sx={{ color: theme.palette.primary.main, fontWeight: 'bold' }}>+ 20</TableCell></TableRow>
              </TableBody>
            </Table>
          </Box>
        </CardContent>
      </Card>

      <Grid container spacing={3} mt={1}>
        <Grid item xs={12} md={6}>
          {/* WHEN DO I GET COINS */}
          <Card sx={{ ...glassCardStyle, height: '100%', mb: 0 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: theme.palette.text.primary }}>When do I get my Coins?</Typography>
              <Typography color="text.secondary">
                Coins from your reports are instantly deposited into your wallet once processed!
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          {/* HOW TO USE COINS */}
          <Card sx={{ ...glassCardStyle, height: '100%', mb: 0 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: theme.palette.text.primary }}>How do I use my Coins?</Typography>
              <Box component="ul" sx={{ color: theme.palette.text.secondary, pl: 2, lineHeight: 1.8 }}>
                <li>Redeem Coins for discounts on eco-products</li>
                <li>10 Coins = ₹1 Discount</li>
                <li>Use Coins during checkout in the Marketplace</li>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* WASTE REPORT MAP — replaces the old FAQ section */}
      <Card sx={{ ...glassCardStyle, mt: 4, overflow: 'hidden' }}>
        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
          {/* Map Header */}
          <Box sx={{ 
            p: 2.5, 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1.5,
            background: isDark 
              ? 'linear-gradient(135deg, rgba(76,175,80,0.15), rgba(33,150,243,0.1))' 
              : 'linear-gradient(135deg, #e8f5e9, #e3f2fd)',
            borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`
          }}>
            <MapIcon sx={{ color: theme.palette.primary.main, fontSize: 28 }} />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: theme.palette.text.primary, lineHeight: 1.2 }}>
                Your Waste Report Map
              </Typography>
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                {loading ? 'Loading...' : `${mapMarkers.length} location${mapMarkers.length !== 1 ? 's' : ''} pinned across all your reports`}
              </Typography>
            </Box>
          </Box>

          {/* Map Legend */}
          <Box sx={{ 
            px: 2.5, py: 1.5, 
            display: 'flex', 
            gap: 2.5, 
            flexWrap: 'wrap',
            borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}`
          }}>
            {[
              { color: '#ff9800', label: 'Pending' },
              { color: '#4caf50', label: 'Approved' },
              { color: '#f44336', label: 'Rejected' },
            ].map(item => (
              <Box key={item.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Box sx={{ 
                  width: 10, height: 10, borderRadius: '50%', 
                  bgcolor: item.color, 
                  boxShadow: `0 0 6px ${item.color}60`
                }} />
                <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: 500 }}>
                  {item.label}
                </Typography>
              </Box>
            ))}
          </Box>

          {/* Leaflet Map */}
          <Box sx={{ height: 420, position: 'relative' }}>
            {loading ? (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <CircularProgress sx={{ color: theme.palette.primary.main }} />
              </Box>
            ) : (
              <MapContainer
                center={defaultCenter}
                zoom={mapMarkers.length > 0 ? 12 : 5}
                style={{ height: '100%', width: '100%' }}
                ref={mapRef}
                scrollWheelZoom={true}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url={isDark 
                    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  }
                />
                <MapAutoFit markers={mapMarkers} mapRef={mapRef} />

                {mapMarkers.map((marker, index) => (
                  <Marker
                    key={`report-${marker.report?.id || index}`}
                    position={[marker.lat, marker.lng]}
                    icon={getMarkerIcon(marker.report?.status)}
                  >
                    <Popup>
                      <Box sx={{ minWidth: 180, p: 0.5 }}>
                        <Typography sx={{ fontWeight: 'bold', fontSize: '0.95rem', color: '#1a1a1a', mb: 0.5 }}>
                          {marker.report?.wasteType || 'Waste Report'}
                        </Typography>
                        {getStatusBadge(marker.report?.status)}
                        <Typography sx={{ fontSize: '0.8rem', color: '#666', mt: 1 }}>
                          📅 {marker.report?.timestamp ? new Date(marker.report.timestamp).toLocaleDateString() : 'N/A'}
                        </Typography>
                        <Typography sx={{ fontSize: '0.8rem', color: '#666' }}>
                          ⚠️ {marker.report?.severity || 'Unknown'}
                        </Typography>
                        {marker.report?.description && (
                          <Typography sx={{ fontSize: '0.8rem', color: '#888', mt: 0.5, fontStyle: 'italic' }}>
                            "{marker.report.description}"
                          </Typography>
                        )}
                        {marker.report?.coinsEarned > 0 && (
                          <Typography sx={{ fontSize: '0.8rem', color: '#4caf50', fontWeight: 'bold', mt: 0.5 }}>
                            🪙 +{marker.report.coinsEarned} Green Coins
                          </Typography>
                        )}
                      </Box>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            )}
          </Box>

          {/* Reports count footer */}
          <Box sx={{ 
            px: 2.5, py: 1.5,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}`,
            background: isDark ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.02)'
          }}>
            <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
              Total Reports: <strong>{reports.length}</strong>
            </Typography>
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <Typography variant="caption" sx={{ color: '#4caf50', fontWeight: 'bold' }}>
                ✅ {reports.filter(r => r.status === 'APPROVED').length}
              </Typography>
              <Typography variant="caption" sx={{ color: '#ff9800', fontWeight: 'bold' }}>
                ⏳ {reports.filter(r => r.status === 'PENDING').length}
              </Typography>
              <Typography variant="caption" sx={{ color: '#f44336', fontWeight: 'bold' }}>
                ❌ {reports.filter(r => r.status === 'REJECTED').length}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Box sx={{ height: 40 }} />
    </Box>
  );
};

export default EarnCoins;
