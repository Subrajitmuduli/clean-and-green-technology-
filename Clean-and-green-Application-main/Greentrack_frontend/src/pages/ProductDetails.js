import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Box, Typography, Button, Rating, Stack, Chip, Snackbar, Alert } from "@mui/material";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useCart } from "../context/CartContext";

const ProductDetails = () => {
  const { state } = useLocation();
  const { product } = state || {};
  const navigate = useNavigate();
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const { addToCart, setCart } = useCart();   // <-- IMPORTANT

  if (!product) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography variant="h6" color="error">
          Product not found.
        </Typography>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/marketplace")}
          sx={{ mt: 2 }}
        >
          Back to Marketplace
        </Button>
      </Box>
    );
  }

  // 🟢 Add to Cart (with quantity = 1)
  const handleAddToCart = () => {
    addToCart({ ...product, quantity: 1 });
    setSnackbarOpen(true);
  };

  // 🟢 Buy Now (override cart with 1 item)
  const handleBuyNow = () => {
    setCart([{ ...product, quantity: 1 }]);
    navigate("/checkout", { state: { product } });
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        p: 4,
        gap: 4,
      }}
    >
      {/* Left Side */}
      <Box sx={{ flex: 1, display: "flex", justifyContent: "center" }}>
        <Box
          component="img"
          src={product.image}
          alt={product.name}
          sx={{ width: "100%", maxWidth: 400, borderRadius: 2, boxShadow: 3 }}
        />
      </Box>

      {/* Right Side */}
      <Box sx={{ flex: 2 }}>
        <Typography variant="h4" sx={{ color: "#2E7D32", mb: 1 }}>
          {product.name}
        </Typography>

        <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
          <Chip label={product.brand} color="success" />
          <Chip label={product.color} color="primary" />
        </Stack>

        <Rating value={product.rating} precision={0.1} readOnly sx={{ mb: 2 }} />

        <Typography variant="h5" sx={{ color: "#2E7D32", mb: 2 }}>
          ₹{product.price}
        </Typography>

        <Typography variant="body1" sx={{ mb: 2 }}>
          {product.description}
        </Typography>

        <Typography variant="body2" sx={{ mb: 2 }}>
          Stock Available: {product.stock}
        </Typography>

        <Stack direction="row" spacing={2}>
          <Button
            variant="contained"
            color="success"
            startIcon={<ShoppingCartIcon />}
            onClick={handleAddToCart}
          >
            Add to Cart
          </Button>

          <Button variant="outlined" color="success" onClick={handleBuyNow}>
            Buy Now
          </Button>

          <Button startIcon={<ArrowBackIcon />} onClick={() => navigate("/marketplace")}>
            Back
          </Button>
        </Stack>
      </Box>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbarOpen(false)} severity="success" sx={{ width: '100%' }}>
          Product added to cart!
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ProductDetails;
