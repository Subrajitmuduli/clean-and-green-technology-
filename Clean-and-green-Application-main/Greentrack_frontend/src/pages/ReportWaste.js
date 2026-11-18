import React, { useState, useRef } from 'react';
import { toast } from 'react-toastify';
import {
  Box, Typography, TextField, Button, Grid, Card, CardContent, MenuItem, Checkbox, FormControlLabel, CircularProgress, useTheme
} from '@mui/material';
import { motion } from 'framer-motion';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getUser } from '../utils/safeStorage';
import { BACKEND_URL } from '../config';

// Fix Leaflet default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// 🛡️ Resilient fetch with retry + timeout to handle Render cold-starts
const fetchWithRetry = async (url, options = {}, retries = 3, timeoutMs = 60000) => {
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
        if (isLastAttempt) throw new Error('Request timed out. The server may be waking up — please try again in a moment.');
      } else if (isLastAttempt) {
        throw error;
      }

      // Exponential backoff: 2s, 4s before retrying
      const delay = Math.min(2000 * Math.pow(2, attempt - 1), 8000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

const ReportWaste = ({ onClick }) => {
  const [wasteType, setWasteType] = useState('');
  const [severity, setSeverity] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [locationStatus, setLocationStatus] = useState(''); 
  const [locationData, setLocationData] = useState('');
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [imageBase64, setImageBase64] = useState(null);

  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const compressImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 600;
          const scaleSize = MAX_WIDTH / (img.width || 1);
          canvas.width = MAX_WIDTH;
          canvas.height = (img.height || 1) * scaleSize;
          
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          const base64 = canvas.toDataURL('image/jpeg', 0.6);
          resolve(base64);
        };
      };
    });
  };

  const handleCapture = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const timeDiffInSeconds = (Date.now() - file.lastModified) / 1000;
      if (timeDiffInSeconds > 120) {
        toast.error("Security Error: Gallery uploads are strictly prohibited. Please capture a live photo directly from your camera.");
        e.target.value = '';
        return;
      }

      const base64Data = await compressImage(file);
      setImage(file);
      setImageBase64(base64Data);
      setImagePreview(base64Data);
      
      setLocationStatus('detecting');
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            setLatitude(lat);
            setLongitude(lng);
            try {
              const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
              if (res.ok) {
                const data = await res.json();
                setLocationData(data.display_name || `Lat ${lat.toFixed(4)}, Lng ${lng.toFixed(4)}`);
              } else {
                setLocationData(`Lat ${lat.toFixed(4)}, Lng ${lng.toFixed(4)}`);
              }
            } catch (err) {
              setLocationData(`Lat ${lat.toFixed(4)}, Lng ${lng.toFixed(4)}`);
            }
            setLocationStatus('success');
          },
          (error) => {
            setLocationData('Failed to auto-detect location. Please verify device permissions.');
            setLocationStatus('error');
          },
          { enableHighAccuracy: true } 
        );
      } else {
        setLocationData('Geolocation not supported by this browser.');
        setLocationStatus('error');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const user = getUser();
    if (!user) {
      if (onClick) onClick();
      return; 
    }
    const userId = user.id;

    if (!image) {
      toast.error("Please capture an image first.");
      return;
    }

    // Block submission if GPS coordinates were not captured
    if (latitude === null || longitude === null) {
      toast.error("📍 Location not detected yet. Please wait for GPS or tap 'Retry Location'.");
      return;
    }

    setIsLoading(true);
    const payload = {
      wasteType: wasteType,
      severity: severity,
      description: description,
      locationData: locationData,
      imageBase64: imageBase64,
      userId: String(userId),
      latitude: latitude,
      longitude: longitude
    };

    try {
      const response = await fetchWithRetry(`${BACKEND_URL}/api/reports/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }, 3, 60000);

      if (response.ok) {
        const data = await response.json();
        
        toast.success(`📍 Report pinned at your location! Expected reward: ${data.coinsExpected || 0} Green Coins once approved.`);

        setWasteType('');
        setSeverity('');
        setDescription('');
        setImage(null);
        setImagePreview(null);
        setImageBase64(null);
        setLocationStatus('');
        setLocationData('');
        setLatitude(null);
        setLongitude(null);
      } else {
        toast.warning("Server could not process the report right now. Please try again.");
      }
    } catch (error) {
      if (error.message.includes('timed out') || error.message.includes('waking up')) {
        toast.warning("⏳ Server is waking up — please wait a moment and try again.", { autoClose: 6000 });
      } else {
        toast.warning("Could not submit the report. Please check your connection and try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const wasteTypes = ['Plastic', 'Food', 'Medical', 'E-waste', 'Paper', 'Metal', 'Other'];
  const severities = ['Low (Small trash pile)', 'Medium (Moderate waste block)', 'High/Urgent (Dead animal, toxicity)'];

  return (
    <Box sx={{ bgcolor: theme.palette.background.default, minHeight: '90vh', py: 8, px: { xs: 2, md: 10 }, transition: 'all 0.5s ease' }}>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
        <Typography variant="h3" textAlign="center" sx={{ fontWeight: 'bold', color: theme.palette.primary.main, mb: 2 }}>
          Report Waste 🌿
        </Typography>
        <Typography variant="h6" textAlign="center" sx={{ color: theme.palette.text.secondary, mb: 6 }}>
          Snap a live photo to attach GPS coordinates. Your action makes a difference!
        </Typography>
      </motion.div>

      <Grid container spacing={4} justifyContent="center">
        <Grid item xs={12} md={6}>
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8 }}>
            <Card sx={{ 
                borderRadius: '20px', 
                boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.4)' : '0 8px 24px rgba(0,0,0,0.1)', 
                p: 3,
                bgcolor: theme.palette.background.paper 
            }}>
              <CardContent>
                <form onSubmit={handleSubmit}>
                  
                  <Box sx={{ textAlign: 'center', mb: 4 }}>
                    {!imagePreview ? (
                      <Button
                        variant="contained"
                        component="label"
                        size="large"
                        startIcon={<CameraAltIcon sx={{ fontSize: '32px !important' }} />}
                        sx={{ 
                          bgcolor: theme.palette.primary.main, 
                          '&:hover': { bgcolor: theme.palette.secondary.main },
                          borderRadius: '16px',
                          py: 2, px: 4,
                          fontSize: '1.2rem',
                          fontWeight: 'bold',
                          width: '100%',
                          color: '#fff'
                        }}
                      >
                        Open Camera
                        <input
                          type="file"
                          hidden
                          accept="image/*"
                          capture="environment"
                          onChange={handleCapture}
                        />
                      </Button>
                    ) : (
                      <Box>
                        <img 
                          src={imagePreview} 
                          alt="Waste Preview" 
                          style={{ width: '100%', maxHeight: '300px', objectFit: 'cover', borderRadius: '12px', marginBottom: '16px' }} 
                        />
                        <Button
                          variant="outlined"
                          component="label"
                          sx={{ color: theme.palette.primary.main, borderColor: theme.palette.primary.main }}
                        >
                          Retake Photo
                          <input
                            type="file"
                            hidden
                            accept="image/*"
                            capture="environment"
                            onChange={handleCapture}
                          />
                        </Button>
                      </Box>
                    )}
                  </Box>

                  {locationStatus && (
                    <Box sx={{ display: 'flex', alignItems: 'center', bgcolor: isDark ? 'rgba(67, 160, 71, 0.1)' : '#e8f5e9', p: 2, borderRadius: '8px', mb: 4 }}>
                       {locationStatus === 'detecting' ? (
                          <>
                            <CircularProgress size={24} sx={{ color: theme.palette.primary.main, mr: 2 }} />
                            <Typography sx={{ color: theme.palette.primary.main, fontWeight: 'bold' }}>Detecting Location...</Typography>
                          </>
                       ) : (
                          <>
                            <LocationOnIcon sx={{ color: theme.palette.primary.main, mr: 2 }} />
                            <Typography sx={{ color: theme.palette.primary.main, fontWeight: 'bold' }}>
                              {locationData}
                            </Typography>
                          </>
                       )}
                    </Box>
                  )}

                  {/* 🔄 Retry location button if detection failed */}
                  {locationStatus === 'error' && (
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<MyLocationIcon />}
                      onClick={() => {
                        setLocationStatus('detecting');
                        navigator.geolocation.getCurrentPosition(
                          async (position) => {
                            const lat = position.coords.latitude;
                            const lng = position.coords.longitude;
                            setLatitude(lat);
                            setLongitude(lng);
                            try {
                              const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
                              if (res.ok) {
                                const data = await res.json();
                                setLocationData(data.display_name || `Lat ${lat.toFixed(4)}, Lng ${lng.toFixed(4)}`);
                              } else {
                                setLocationData(`Lat ${lat.toFixed(4)}, Lng ${lng.toFixed(4)}`);
                              }
                            } catch {
                              setLocationData(`Lat ${lat.toFixed(4)}, Lng ${lng.toFixed(4)}`);
                            }
                            setLocationStatus('success');
                          },
                          () => {
                            setLocationData('Failed to detect location. Please check permissions.');
                            setLocationStatus('error');
                          },
                          { enableHighAccuracy: true }
                        );
                      }}
                      sx={{ mb: 3, borderRadius: '10px', textTransform: 'none', fontWeight: 'bold', color: theme.palette.primary.main, borderColor: theme.palette.primary.main }}
                    >
                      Retry Location
                    </Button>
                  )}

                  {/* 🗺️ Mini map preview when location is captured */}
                  {latitude !== null && longitude !== null && (
                    <Box sx={{ mb: 3, borderRadius: '12px', overflow: 'hidden', border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, height: 180 }}>
                      <MapContainer
                        center={[latitude, longitude]}
                        zoom={15}
                        style={{ height: '100%', width: '100%' }}
                        scrollWheelZoom={false}
                        dragging={false}
                        zoomControl={false}
                        attributionControl={false}
                      >
                        <TileLayer
                          url={isDark
                            ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                            : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                          }
                        />
                        <Marker position={[latitude, longitude]} />
                      </MapContainer>
                    </Box>
                  )}

                  <TextField
                    select
                    label="Waste Category"
                    value={wasteType}
                    onChange={(e) => setWasteType(e.target.value)}
                    fullWidth
                    required
                    sx={{ mb: 3 }}
                  >
                    {wasteTypes.map((option) => (
                      <MenuItem key={option} value={option}>
                        {option}
                      </MenuItem>
                    ))}
                  </TextField>

                  <TextField
                    select
                    label="Severity Level"
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value)}
                    fullWidth
                    required
                    sx={{ mb: 3 }}
                  >
                    {severities.map((level) => (
                      <MenuItem key={level} value={level}>
                        {level}
                      </MenuItem>
                    ))}
                  </TextField>

                  <TextField
                    label="Short Description (Optional)"
                    placeholder="e.g. Near the big banyan tree"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    fullWidth
                    sx={{ mb: 3 }}
                  />

                  <motion.div whileHover={{ scale: 1.02 }} transition={{ type: 'spring', stiffness: 200 }}>
                    <Button 
                      type="submit" 
                      variant="contained" 
                      fullWidth 
                      size="large"
                      disabled={isLoading}
                      startIcon={isLoading ? <CircularProgress size={24} color="inherit" /> : <EmojiEventsIcon />}
                      sx={{ 
                        bgcolor: theme.palette.primary.main, 
                        '&:hover': { bgcolor: theme.palette.secondary.main }, 
                        borderRadius: '12px', 
                        py: 1.5,
                        fontWeight: 'bold',
                        fontSize: '1.1rem',
                        color: '#fff'
                      }}
                    >
                      {isLoading ? 'Uploading & Processing...' : 'Submit Report'}
                    </Button>
                  </motion.div>

                </form>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ReportWaste;
