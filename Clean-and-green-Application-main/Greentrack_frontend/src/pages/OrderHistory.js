import React, { useState, useEffect } from "react";
import { toast } from 'react-toastify';
import { Box, Typography, Card, CircularProgress, Grid, Divider, Button, Chip, useTheme } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { BACKEND_URL } from "../config";

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem('user'));
  const navigate = useNavigate();
  const theme = useTheme();

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }
    
    const fetchOrders = async () => {
      try {
        // Using localhost since the new OrderController is running locally
        const response = await fetch(`${BACKEND_URL}/api/orders/user/${user.id}`);
        if (response.ok) {
          const data = await response.json();
          setOrders(data);
        } else {
          toast.warning("Could not load order history. Please try again in a moment.");
        }
      } catch (error) {
        toast.warning("Server is waking up. Please try again in a moment.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user, navigate]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10, minHeight: "100vh" }}>
        <CircularProgress color="success" />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 5 }, bgcolor: theme.palette.background.default, minHeight: "100vh", display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h4" sx={{ color: theme.palette.primary.main, mb: 4, fontWeight: "800", textAlign: "center", letterSpacing: "-0.5px" }}>
        Your Order History
      </Typography>

      {orders.length === 0 ? (
        <Box sx={{ textAlign: "center", mt: 5 }}>
          <Typography variant="h6" color="text.secondary" mb={3}>You haven't placed any orders yet.</Typography>
          <Button variant="contained" color="success" onClick={() => navigate("/marketplace")}>
            Go to Marketplace
          </Button>
        </Box>
      ) : (
        <Grid container spacing={4} justifyContent="center" sx={{ flex: 1 }}>
          <Grid item xs={12} md={8}>
            {orders.map((order) => {
              let items = [];
              try {
                items = JSON.parse(order.orderItemsJson || "[]");
              } catch (e) {
                console.error("Failed to parse items for order:", order.id);
              }

              return (
                <Card key={order.id} sx={{ mb: 4, p: 3, borderRadius: '24px', boxShadow: theme.palette.mode === 'light' ? '0 10px 40px -10px rgba(0,0,0,0.06)' : '0 10px 40px -10px rgba(0,0,0,0.3)', bgcolor: theme.palette.background.paper }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      Order #{order.id}
                    </Typography>
                    <Typography variant="subtitle1" color="text.secondary">
                      {new Date(order.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Chip label={order.status || "CONFIRMED"} color="success" size="small" sx={{ fontWeight: 'bold' }} />
                  </Box>

                  <Divider sx={{ mb: 2 }} />

                  {items.map((item, idx) => (
                    <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Box
                        component="img"
                        src={item.image}
                        alt={item.name}
                        sx={{ width: 60, height: 60, borderRadius: 2, objectFit: "cover", border: '1px solid #eee' }}
                      />
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>{item.name}</Typography>
                        <Typography variant="body2" color="text.secondary">{item.brand}</Typography>
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>₹{item.price}</Typography>
                        <Typography variant="body2" color="text.secondary">Qty: {item.quantity}</Typography>
                      </Box>
                    </Box>
                  ))}

                  <Divider sx={{ my: 2 }} />

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">Total Amount</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>₹{order.totalAmount}</Typography>
                  </Box>
                  
                  {(order.discountApplied > 0) && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="success.main">Discount (Coins: {order.coinsUsed})</Typography>
                      <Typography variant="body2" color="success.main" sx={{ fontWeight: 'bold' }}>-₹{order.discountApplied}</Typography>
                    </Box>
                  )}

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2, pt: 2, borderTop: '1px dashed', borderColor: 'divider' }}>
                    <Typography variant="h6" sx={{ color: theme.palette.primary.main, fontWeight: '800' }}>Final Total</Typography>
                    <Typography variant="h6" sx={{ color: theme.palette.primary.main, fontWeight: '800' }}>
                      ₹{(order.totalAmount - (order.discountApplied || 0))}
                    </Typography>
                  </Box>
                </Card>
              );
            })}
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default OrderHistory;
