import React, { useState } from "react";
import { toast } from 'react-toastify';
import {
  Modal,
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  InputAdornment,
  CircularProgress,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { BACKEND_URL } from '../config';

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 400,
  bgcolor: "#e8f5e9",
  borderRadius: "12px",
  boxShadow: 24,
  p: 4,
};

const ForgotPasswordModal = ({ open, handleClose }) => {
  const [formData, setFormData] = useState({
    identifier: "",
    newPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { identifier, newPassword } = formData;

    if (!identifier.trim() || !newPassword.trim()) {
      toast.info("Please fill all fields before submitting.");
      return;
    }

    const rawIdentifier = identifier.trim();

    setIsLoading(true);
    try {
      let res = await fetch(`${BACKEND_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: rawIdentifier,
          newPassword: newPassword.trim(),
        }),
      });

      let data = await res.json();

      if (res.ok && data.status) {
        toast.success(data.message || "Password updated successfully!");
        handleClose();
        setFormData({ identifier: "", newPassword: "" });
      } else {
        toast.info(data.message || "Could not update password. Please check your details.");
      }
    } catch (err) {
      toast.info("Server is processing your request. Please try again in a moment.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <Box sx={style}>
        <Typography
          variant="h6"
          mb={1}
          sx={{ color: "#2e7d32", fontWeight: "bold", textAlign: "center" }}
        >
          Reset Your Password
        </Typography>
        <Typography
          variant="body2"
          mb={2}
          sx={{ color: "#555", textAlign: "center", fontSize: '0.8rem' }}
        >
          Enter your registered email to reset your password
        </Typography>

        <form onSubmit={handleSubmit}>
          <TextField
            label="Registered Email"
            name="identifier"
            value={formData.identifier}
            onChange={handleChange}
            fullWidth
            margin="normal"
            placeholder="e.g. user@email.com"
            helperText="Enter the email you registered with"
            sx={{ bgcolor: "white", borderRadius: 1 }}
            InputProps={{ style: { color: '#000' } }}
            InputLabelProps={{ style: { color: '#555' } }}
          />
          <TextField
            label="New Password"
            name="newPassword"
            type={showPassword ? "text" : "password"}
            value={formData.newPassword}
            onChange={handleChange}
            fullWidth
            margin="normal"
            sx={{ bgcolor: "white", borderRadius: 1 }}
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

          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={isLoading}
            sx={{
              mt: 2,
              bgcolor: "#43a047",
              color: "white",
              fontWeight: "bold",
              py: 1.2,
              borderRadius: "10px",
              "&:hover": { bgcolor: "#2e7d32" },
            }}
          >
            {isLoading ? <CircularProgress size={24} sx={{ color: '#fff' }} /> : "Update Password"}
          </Button>
        </form>
      </Box>
    </Modal>
  );
};

export default ForgotPasswordModal;
