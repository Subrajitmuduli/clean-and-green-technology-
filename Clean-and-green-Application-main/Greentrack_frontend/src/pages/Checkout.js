import React, { useState } from "react";
import { toast } from 'react-toastify';
import { useLocation, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { BACKEND_URL } from "../config";
import {
  Box,
  Typography,
  Card,
  Button,
  Divider,
  TextField,
  Grid,
  Paper,
  RadioGroup,
  FormControlLabel,
  Radio,
  Checkbox,
  useTheme
} from "@mui/material";

const Checkout = () => {
  const { cart, clearCart } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  const product = location.state?.product;
  const fromCart = location.state?.fromCart;

  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [useCoins, setUseCoins] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [deliveryDetails, setDeliveryDetails] = useState({ fullName: '', phone: '', address: '', city: '', state: '', pincode: '' });
  const user = JSON.parse(localStorage.getItem('user'));
  const theme = useTheme();

  // If nothing to checkout
  if (!product && (!cart || cart.length === 0)) {
    return (
      <Box sx={{ textAlign: "center", mt: 10 }}>
        <Typography variant="h5" color="error">
          ⚠️ No products selected
        </Typography>
        <Button
          variant="contained"
          color="success"
          sx={{ mt: 3 }}
          onClick={() => navigate("/marketplace")}
        >
          Back to Marketplace
        </Button>
      </Box>
    );
  }

  const greenCoins = user?.greenCoins || 0;

  // Calculate subtotal, tax & total (works for both single or multiple)
  const subtotal = fromCart
    ? cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
    : product?.price * 1 || 0;

  const tax = Math.round(subtotal * 0.05);
  const rawTotal = subtotal + tax;
  
  // 10 Coins = 1 Rupee discount
  const maxDiscount = Math.floor(greenCoins / 10);
  const appliedDiscount = useCoins ? Math.min(rawTotal, maxDiscount) : 0;
  const total = rawTotal - appliedDiscount;
  const coinsToDeduct = appliedDiscount * 10;

  const handleConfirmOrder = async () => {
    // Delivery Validation
    if (!deliveryDetails.fullName || !deliveryDetails.phone || !deliveryDetails.address || !deliveryDetails.city || !deliveryDetails.state || !deliveryDetails.pincode) {
        toast.error("Please fill all the delivery information fields before placing the order.");
        return;
    }

    setIsProcessing(true);
    let orderSuccess = true;
    
    if (useCoins && coinsToDeduct > 0 && user) {
        try {
            const res = await fetch(`${BACKEND_URL}/api/coins/deduct/${user.id}/${coinsToDeduct}`, {
                method: 'POST'
            });
            if (res.ok) {
                const data = await res.json();
                user.greenCoins = data.newBalance;
                localStorage.setItem('user', JSON.stringify(user));
            } else {
                toast.warning("Could not redeem Green Coins. Proceeding without discount.");
            }
        } catch (error) {
        }
    }

    // Save order history to backend
    if (user) {
        try {
            const orderItems = fromCart ? cart : (product ? [{...product, quantity: 1}] : []);
            // Using localhost as the newly added OrderController is running locally
            const orderRes = await fetch(`${BACKEND_URL}/api/orders/create`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: user.id,
                    orderItemsJson: JSON.stringify(orderItems),
                    totalAmount: rawTotal,
                    coinsUsed: coinsToDeduct,
                    discountApplied: appliedDiscount
                })
            });
            if (!orderRes.ok) {
                toast.warning("Order may not have been saved. Please check your order history.");
                orderSuccess = false;
            }
        } catch (error) {
            toast.warning("Server is processing your order. Please check your order history in a moment.");
            orderSuccess = false;
        }
    }
    
    setIsProcessing(false);
    if (orderSuccess) {
      if (fromCart) clearCart();
      navigate("/order-success", { state: { fromCart, cart, product } });
    }
  };

  return (
    <Box
      sx={{
        p: { xs: 2, md: 5 },
        bgcolor: theme.palette.background.default,
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Typography
        variant="h4"
        sx={{
          color: theme.palette.primary.main,
          mb: 4,
          fontWeight: "800",
          textAlign: "center",
          letterSpacing: "-0.5px"
        }}
      >
        Checkout
      </Typography>

      <Grid container spacing={4} sx={{ flex: 1 }}>
        {/* Left Side — Delivery Info */}
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: { xs: 3, md: 4 }, borderRadius: '24px', boxShadow: theme.palette.mode === 'light' ? '0 10px 40px -10px rgba(0,0,0,0.06)' : '0 10px 40px -10px rgba(0,0,0,0.3)' }}>
            <Typography
              variant="h6"
              sx={{ mb: 3, color: theme.palette.primary.main, fontWeight: "700" }}
            >
              Delivery Information
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField label="Full Name" fullWidth variant="outlined" value={deliveryDetails.fullName} onChange={e => setDeliveryDetails({...deliveryDetails, fullName: e.target.value})} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Phone Number" fullWidth variant="outlined" value={deliveryDetails.phone} onChange={e => setDeliveryDetails({...deliveryDetails, phone: e.target.value})} />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Address"
                  fullWidth
                  multiline
                  rows={3}
                  variant="outlined"
                  value={deliveryDetails.address} 
                  onChange={e => setDeliveryDetails({...deliveryDetails, address: e.target.value})}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="City" fullWidth variant="outlined" value={deliveryDetails.city} onChange={e => setDeliveryDetails({...deliveryDetails, city: e.target.value})} />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField label="State" fullWidth variant="outlined" value={deliveryDetails.state} onChange={e => setDeliveryDetails({...deliveryDetails, state: e.target.value})} />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField label="Pincode" fullWidth variant="outlined" value={deliveryDetails.pincode} onChange={e => setDeliveryDetails({...deliveryDetails, pincode: e.target.value})} />
              </Grid>
            </Grid>

            <Typography
              variant="h6"
              sx={{ mt: 4, mb: 2, color: theme.palette.primary.main, fontWeight: "700" }}
            >
              Payment Method
            </Typography>
            <RadioGroup
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
            >
              <FormControlLabel
                value="cod"
                control={<Radio color="success" />}
                label="Cash on Delivery (COD)"
              />
              </RadioGroup>

              {user && greenCoins >= 10 && (
                <Box sx={{ mt: 3, p: 2, bgcolor: theme.palette.mode === 'dark' ? 'rgba(16, 185, 129, 0.1)' : '#e8f5e9', borderRadius: '16px', border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(16, 185, 129, 0.2)' : '#c8e6c9'}` }}>
                    <FormControlLabel
                        control={<Checkbox color="success" checked={useCoins} onChange={(e) => setUseCoins(e.target.checked)} />}
                        label={<Typography sx={{ fontWeight: 'bold', color: theme.palette.primary.main }}>Redeem Green Coins (Balance: {greenCoins})</Typography>}
                    />
                    <Typography variant="body2" sx={{ ml: 4, color: 'text.secondary' }}>
                        Use {Math.min(rawTotal * 10, greenCoins - (greenCoins % 10))} coins to save ₹{Math.min(rawTotal, maxDiscount)}!
                    </Typography>
                </Box>
              )}
          </Paper>
        </Grid>

        {/* Right Side — Order Summary */}
        <Grid item xs={12} md={5}>
          <Card sx={{ p: { xs: 3, md: 4 }, borderRadius: '24px', boxShadow: theme.palette.mode === 'light' ? '0 10px 40px -10px rgba(0,0,0,0.06)' : '0 10px 40px -10px rgba(0,0,0,0.3)' }}>
            <Typography
              variant="h6"
              sx={{ color: theme.palette.primary.main, fontWeight: "700", mb: 3 }}
            >
              Order Summary
            </Typography>

            <Divider sx={{ mb: 2 }} />

            {/* Show single or multiple products */}
            {fromCart
              ? cart.map((item, index) => (
                  <Box
                    key={index}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                      mb: 2,
                    }}
                  >
                    <Box
                      component="img"
                      src={item.image}
                      alt={item.name}
                      sx={{
                        width: 80,
                        height: 80,
                        borderRadius: 2,
                        objectFit: "cover",
                      }}
                    />
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                        {item.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {item.brand}
                      </Typography>
                      <Typography variant="body2" sx={{ color: "#2E7D32" }}>
                        ₹{item.price} × {item.quantity} = ₹{item.price * item.quantity}
                      </Typography>
                    </Box>
                  </Box>
                ))
              : product && (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                      mb: 2,
                    }}
                  >
                    <Box
                      component="img"
                      src={product.image}
                      alt={product.name}
                      sx={{
                        width: 80,
                        height: 80,
                        borderRadius: 2,
                        objectFit: "cover",
                      }}
                    />
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                        {product.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {product.brand}
                      </Typography>
                      <Typography variant="body2" sx={{ color: "#2E7D32" }}>
                        ₹{product.price}
                      </Typography>
                    </Box>
                  </Box>
                )}

            <Divider sx={{ my: 2 }} />

            {/* Totals */}
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
              <Typography>Subtotal</Typography>
              <Typography>₹{subtotal}</Typography>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
              <Typography>Tax (5%)</Typography>
              <Typography>₹{tax}</Typography>
            </Box>

            {useCoins && appliedDiscount > 0 && (
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1, color: '#d32f2f', fontWeight: 'bold' }}>
                <Typography>Coin Discount</Typography>
                <Typography>-₹{appliedDiscount}</Typography>
              </Box>
            )}

            <Divider sx={{ my: 2 }} />

            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                Total
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: "bold", color: "#2E7D32" }}>
                ₹{total}
              </Typography>
            </Box>

            <Button
              variant="contained"
              color="success"
              fullWidth
              sx={{
                mt: 1,
                fontWeight: "bold",
                py: 1.2,
                borderRadius: 2,
                fontSize: "1rem",
              }}
              disabled={isProcessing}
              onClick={handleConfirmOrder}
            >
              {isProcessing ? "Processing..." : "Confirm Order"}
            </Button>
          </Card>
        </Grid>
      </Grid>

      {/* Footer Section */}
      <Box
        sx={{
          mt: 5,
          textAlign: "center",
          color: "#4E342E",
          borderTop: "1px solid #C8E6C9",
          pt: 2,
        }}
      >
        <Typography variant="body2">
          © {new Date().getFullYear()} EcoMart — Sustainable Shopping for a Greener Planet 🌱
        </Typography>
        <Button
          variant="text"
          color="success"
          onClick={() => navigate("/marketplace")}
          sx={{ mt: 1 }}
        >
          ← Back to Marketplace
        </Button>
      </Box>
    </Box>
  );
};

export default Checkout;

