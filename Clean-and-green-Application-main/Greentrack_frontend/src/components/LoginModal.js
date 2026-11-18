import React, { useState } from 'react';
import { toast } from 'react-toastify';
import {
  Modal,
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  InputAdornment
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import Logo from '../assets/logo.png'; 
import ForgotPasswordModal from './ForgotPasswordModal';
import { BACKEND_URL } from '../config';
import CircularProgress from '@mui/material/CircularProgress';
import ServerWakeLoader from './ServerWakeLoader';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: '#e8f5e9',
  borderRadius: '12px',
  boxShadow: 24,
  p: 4,
};

const LoginModal = ({ open, handleClose, setUser }) => {
  const [formData, setFormData] = useState({
    emailOrContact: '',
    password: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [openForgot, setOpenForgot] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  const handleSubmit = async (e) => {
  e.preventDefault();

  if (!formData.emailOrContact || !formData.password) {
    toast.error('Please fill in all fields');
    return;
  }

  const rawIdentifier = formData.emailOrContact.trim();
  const payload = {
    identifier: rawIdentifier,
    password: formData.password,
  };

  setIsLoading(true);
  try {
    const res = await fetch(`${BACKEND_URL}/api/auth/login`, { 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });



    const contentType = res.headers.get('content-type') || '';
    let data = null;
    if (contentType.includes('application/json')) {
      data = await res.json();

    } else {
      const text = await res.text();
      throw new Error(`Server returned ${res.status}: ${text}`);
    }

    if (res.ok && data && data.status) {
      const userObj = {
        id: data.id || (data.user && data.user.id) || '',
        fullName: data.user || data.fullName || '',
        email: data.email || '',
        contactNumber: data.contactNumber || '',
      };
      
      localStorage.setItem('user', JSON.stringify(userObj));
      if (setUser) setUser(userObj);
      // Notify Navbar and all same-tab listeners
      window.dispatchEvent(new Event('userChanged'));
      toast.success(data.message || 'Login Successful 🎉');
      handleClose();
    } else {
      // Show server-provided error message if available
      toast.error((data && (data.message || data.error)) || 'Invalid credentials!');
    }
  } catch (err) {
    toast.warning('Server is waking up. Please try again in a moment.');
  } finally {
    setIsLoading(false);
  }
};

  return (
    <Modal open={open} onClose={handleClose}>
      <Box sx={style}>
        {/* Optional Logo */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
          <img src={Logo} alt="GreenTrack Logo" style={{ height: 50, width: 'auto' }} />
        </Box>

        <Typography
          variant="h6"
          mb={2}
          sx={{ color: '#2e7d32', fontWeight: 'bold', textAlign: 'center' }}
        >
          Login to GreenTrack
        </Typography>

        {isLoading ? (
          <ServerWakeLoader />
        ) : (
          <form onSubmit={handleSubmit}>
            <TextField
              label="Email"
              name="emailOrContact"
              value={formData.emailOrContact}
              onChange={handleChange}
              fullWidth
              margin="normal"
              sx={{ bgcolor: 'white', borderRadius: 1 }}
              InputProps={{ style: { color: '#000' } }}
              InputLabelProps={{ style: { color: '#555' } }}
            />

            <TextField
              label="Password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleChange}
              fullWidth
              margin="normal"
              sx={{ bgcolor: 'white', borderRadius: 1 }}
              InputLabelProps={{ style: { color: '#555' } }}
              InputProps={{
                style: { color: '#000' },
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={togglePasswordVisibility} edge="end">
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Typography
              variant="body2"
              sx={{
                textAlign: 'right',
                mt: 0.5,
                color: '#2e7d32',
                cursor: 'pointer',
                '&:hover': { textDecoration: 'underline' },
              }}
              onClick={() => setOpenForgot(true)}
            >
            Forgot Password?
            </Typography>

            {/* Forgot Password Modal */}
            <ForgotPasswordModal open={openForgot} handleClose={() => setOpenForgot(false)} />


            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={isLoading}
              sx={{
                mt: 2,
                bgcolor: '#43a047',
                color: 'white',
                fontWeight: 'bold',
                py: 1.2,
                borderRadius: '10px',
                '&:hover': { bgcolor: '#2e7d32' },
              }}
            >
              Submit
            </Button>
          </form>
        )}
      </Box>
    </Modal>
  );
};

export default LoginModal;
