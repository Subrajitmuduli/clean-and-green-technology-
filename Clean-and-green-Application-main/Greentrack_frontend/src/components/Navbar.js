import React, { useState, useEffect, useContext } from 'react';
import { ColorModeContext } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { getUser, removeUser } from '../utils/safeStorage';
import { BACKEND_URL } from '../config';
import Avatar from '@mui/material/Avatar';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Box,
  Tooltip,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import ForestIcon from '@mui/icons-material/Forest'; // Fixed icon

const navItems = [
  { name: 'Home', path: '/' },
  { name: 'Report Waste', path: '/report-waste' },
  { name: 'Earn Coins', path: '/earn-coins' },
  { name: 'Market Place', path: '/marketplace' },
  { name: 'Leaderboard', path: '/leaderboard' },
  { name: 'Courses', path: '/courses' },
  { name: 'Help', path: '/help' },
];

const Navbar = ({ setOpenLogin, setOpenRegister, onFeatureClick }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const colorMode = useContext(ColorModeContext);
  const darkMode = colorMode.mode === 'dark';
  const [anchorEl, setAnchorEl] = useState(null);
  const [user, setUser] = useState(null);
  const [profileImage, setProfileImage] = useState(null);

useEffect(() => {
  const syncUser = () => {
    const u = getUser();
    setUser(u);
    if (u) {
      fetch(`${BACKEND_URL}/api/auth/profile/${u.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.status && data.profileImageBase64) {
            setProfileImage(data.profileImageBase64);
          } else {
            setProfileImage(null);
          }
        })
        .catch(() => {});
    } else {
      setProfileImage(null);
    }
  };

  // Run immediately on mount
  syncUser();

  // Listen to custom same-tab event fired on login/logout
  window.addEventListener('userChanged', syncUser);
  // Also listen to cross-tab storage events
  window.addEventListener('storage', syncUser);

  return () => {
    window.removeEventListener('userChanged', syncUser);
    window.removeEventListener('storage', syncUser);
  };
}, []);

const navigate = useNavigate();

const handleAvatarClick = (e) => {
  if (e) e.stopPropagation();
  setAnchorEl(e.currentTarget);
};
const handleMenuClose = () => setAnchorEl(null);
const handleLogout = () => {
  removeUser();
  setUser(null);
  setProfileImage(null);
  handleMenuClose();
  window.dispatchEvent(new Event('userChanged'));
  navigate('/');
  // Force page reload so all protected state is cleared
  window.location.href = '/';
};

const toggleDrawer = () => {
  setMobileOpen(!mobileOpen);
};

const toggleDarkMode = () => {
  colorMode.toggleColorMode();
};

const drawer = (
  <Box
    onClick={toggleDrawer}
    sx={{
      textAlign: 'center',
      width: 280,
      backgroundColor: 'transparent',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
    }}
  >
  <motion.div
    initial={{ x: -100, opacity: 0 }}
    animate={{ x: 0, opacity: 1 }}
    transition={{ duration: 0.5 }}
  >
    <Typography
      variant="h5"
        sx={{
          my: 3,
          color: darkMode ? '#10b981' : '#059669',
          fontWeight: '800',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1,
        }}
    >
      <ForestIcon sx={{ fontSize: 32 }} /> GreenTrack
    </Typography>
  </motion.div>

      <List>
        {navItems.map((item, index) => (
          <motion.div
            key={item.name}
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1 * index }}
          >
            <ListItem disablePadding sx={{ mb: 1, pr: 2 }}>
              <ListItemText sx={{ m: 0 }}>
                <Button
                  component={Link}
                  to={item.path}
                  onClick={toggleDrawer}
                  sx={{
                    color: darkMode ? '#f8fafc' : '#0f172a',
                    width: '100%',
                    justifyContent: 'flex-start',
                    pl: 4,
                    py: 1.2,
                    fontWeight: 600,
                    borderRadius: '0 24px 24px 0',
                    '&:hover': { 
                      bgcolor: darkMode ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.08)',
                      color: '#10b981',
                      transform: 'translateX(6px)'
                    },
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                  onClickCapture={(e) => {
                    if (item.name === 'Home') {
                    navigate('/');
                    } else if (!user) {
                    e.preventDefault();
                    onFeatureClick();
                    } else {
                      navigate(item.path);
                    }
                  }}
                >
                  {item.name}
                </Button>
              </ListItemText>
            </ListItem>
          </motion.div>
        ))}


      {user ? (
  <>
    <ListItem disablePadding sx={{ mt: 3, mb: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <Avatar
        src={profileImage || undefined}
        sx={{ bgcolor: '#10b981', mb: 1, width: 50, height: 50, cursor: 'pointer' }}
        onClick={(e) => { e.stopPropagation(); setMobileOpen(false); navigate(`/profile/${user.id}`); }}
      >
        {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
      </Avatar>
      <Typography variant="body1" sx={{ fontWeight: '800', color: darkMode ? '#f8fafc' : '#0f172a' }}>
        {user.fullName}
      </Typography>
    </ListItem>
    <ListItem disablePadding sx={{ mb: 1, px: 3 }}>
      <Button
        component={Link}
        to={`/profile/${user.id}`}
        onClick={toggleDrawer}
        sx={{
          color: darkMode ? '#f8fafc' : '#0f172a',
          bgcolor: darkMode ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.08)',
          width: '100%',
          fontWeight: 700,
          borderRadius: '50px',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          '&:hover': { bgcolor: 'rgba(16, 185, 129, 0.2)', transform: 'translateY(-2px)' },
          transition: 'all 0.3s ease',
        }}
      >
        👤 My Profile
      </Button>
    </ListItem>
    <ListItem disablePadding sx={{ mb: 1, px: 3 }}>
      <Button
        component={Link}
        to="/orders"
        onClick={toggleDrawer}
        sx={{
          color: 'white',
          bgcolor: '#10b981',
          width: '100%',
          fontWeight: 700,
          borderRadius: '50px',
          boxShadow: '0 4px 14px 0 rgba(16, 185, 129, 0.2)',
          '&:hover': { bgcolor: '#059669', transform: 'translateY(-2px)', boxShadow: '0 6px 20px rgba(16, 185, 129, 0.3)' },
          transition: 'all 0.3s ease',
        }}
      >
        Order History
      </Button>
    </ListItem>
    <ListItem disablePadding sx={{ mb: 3, px: 3 }}>
      <Button
        onClick={handleLogout}
        sx={{
          color: 'white',
          bgcolor: '#ef4444',
          width: '100%',
          fontWeight: 700,
          borderRadius: '50px',
          boxShadow: '0 4px 14px 0 rgba(239, 68, 68, 0.2)',
          '&:hover': { bgcolor: '#dc2626', transform: 'translateY(-2px)', boxShadow: '0 6px 20px rgba(239, 68, 68, 0.3)' },
          transition: 'all 0.3s ease',
        }}
      >
        Logout
      </Button>
    </ListItem>
  </>
) : (
  <ListItem disablePadding sx={{ px: 3, pb: 2 }}>
    <Button
      onClick={() => { setOpenRegister(true); toggleDrawer(); }}
      sx={{
        color: 'white',
        bgcolor: '#10b981',
        width: '100%',
        mt: 2,
        fontWeight: 700,
        borderRadius: '50px',
        boxShadow: '0 4px 14px 0 rgba(16, 185, 129, 0.2)',
        '&:hover': { bgcolor: '#059669', transform: 'translateY(-2px)', boxShadow: '0 6px 20px rgba(16, 185, 129, 0.3)' },
        transition: 'all 0.3s ease',
      }}
    >
      Register
    </Button>
  </ListItem>
)}

        <ListItem disablePadding>
          <Tooltip title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
            <IconButton
              onClick={toggleDarkMode}
              sx={{
                width: '100%',
                color: darkMode ? '#fff' : '#000',
                mt: 1,
                transition: 'all 0.3s ease',
              }}
            >
              {darkMode ? <Brightness7Icon /> : <Brightness4Icon />}
            </IconButton>
          </Tooltip>
        </ListItem>
      </List>
    </Box>
  );

  return (
    <>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          top: 0,
          zIndex: 1100,
          bgcolor: darkMode ? 'rgba(15, 23, 42, 0.7)' : 'rgba(255, 255, 255, 0.7)',
          backdropFilter: 'blur(16px)',
          borderBottom: darkMode ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(0, 0, 0, 0.05)',
          color: darkMode ? '#f8fafc' : '#0f172a',
          transition: 'all 0.4s ease',
        }}
      >
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between', px: { xs: 2, md: 4 } }}>
          {/* Logo with Animation */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, type: 'spring' }}
            style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer' }}
          >
            <ForestIcon sx={{ fontSize: 32, color: '#10b981' }} />
            <Typography variant="h6" sx={{ fontWeight: '800', letterSpacing: '-0.5px' }}>
              GreenTrack
            </Typography>
          </motion.div>

          {/* Desktop Menu */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1 }}>
            {navItems.map((item, index) => (
              <motion.div
                key={item.name}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  component={Link}
                  to={item.path}
                  sx={{
                    color: darkMode ? '#f8fafc' : '#0f172a',
                    fontWeight: 600,
                    borderRadius: '20px',
                    px: 2,
                    '&:hover': { bgcolor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' },
                    transition: 'all 0.2s ease',
                  }}
                  onClick={(e) => {
                    if (item.name === 'Home') {
                    navigate('/');
                    } else if (!user) {
                    e.preventDefault();
                    onFeatureClick();
                    } else {
                      navigate(item.path);
                    }
                  }}
                >
                  {item.name}
                </Button>
              </motion.div>
            ))}

{user ? (
  <>
    <Avatar
      src={profileImage || undefined}
      onClick={handleAvatarClick}
      sx={{ bgcolor: '#10b981', cursor: 'pointer', ml: 2, width: 36, height: 36, transition: 'transform 0.2s', '&:hover': { transform: 'scale(1.1)' } }}
    >
      {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
    </Avatar>

    <Menu
      anchorEl={anchorEl}
      open={Boolean(anchorEl)}
      onClose={handleMenuClose}
    >
      <MenuItem disabled>{user.fullName}</MenuItem>
      <MenuItem onClick={() => { handleMenuClose(); navigate(`/profile/${user.id}`); }}>My Profile</MenuItem>
      <MenuItem onClick={() => { handleMenuClose(); navigate('/orders'); }}>Order History</MenuItem>
      <MenuItem onClick={handleLogout}>Logout</MenuItem>
    </Menu>
  </>
) : (
  <Button
    variant="contained"
    onClick={() => setOpenRegister(true)}
    sx={{
      bgcolor: '#10b981',
      color: '#fff',
      borderRadius: '50px',
      ml: 2,
      px: 3,
      py: 1,
      boxShadow: '0 4px 14px 0 rgba(16, 185, 129, 0.39)',
      '&:hover': { bgcolor: '#059669', boxShadow: '0 6px 20px rgba(16, 185, 129, 0.23)' }
    }}
  >
    Register
  </Button>
)}


            {/* Dark Mode Toggle */}
            <Tooltip title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
              <IconButton onClick={toggleDarkMode} sx={{ ml: 1, color: darkMode ? '#f8fafc' : '#0f172a' }}>
                {darkMode ? <Brightness7Icon /> : <Brightness4Icon />}
              </IconButton>
            </Tooltip>
          </Box>

          {/* Mobile Menu Icon */}
          <IconButton
            color="inherit"
            edge="start"
            sx={{ display: { md: 'none' } }}
            onClick={toggleDrawer}
          >
            <MenuIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer
        anchor="left"
        open={mobileOpen}
        onClose={toggleDrawer}
        transitionDuration={{ enter: 400, exit: 300 }}
        PaperProps={{
          sx: {
            backgroundColor: darkMode ? 'rgba(15, 23, 42, 0.75)' : 'rgba(255, 255, 255, 0.75)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderRight: darkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.05)',
            boxShadow: '4px 0 24px rgba(0,0,0,0.1)',
          }
        }}
        ModalProps={{
          keepMounted: true, 
          BackdropProps: {
            sx: {
              backgroundColor: darkMode ? 'rgba(0, 0, 0, 0.4)' : 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(4px)',
            }
          }
        }}
      >
        {drawer}
      </Drawer>
    </>
  );
};

export default Navbar;
