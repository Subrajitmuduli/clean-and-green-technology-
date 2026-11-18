
import { Drawer, IconButton, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import FilterListIcon from "@mui/icons-material/FilterList";
import React, { useState } from "react";
import {
  Grid,
  Box,
  TextField,
  Button,
  Pagination,
  Select,
  FormControl,
  InputLabel,
  Snackbar,
  Alert,
  MenuItem,
} from "@mui/material";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import productsData from "../data/productsData";
import ProductCard from "../components/ProductCard";
import ProductFilters from "../components/ProductFilters";

const MarketPlace = () => {
  const navigate = useNavigate();
  const { cart, setCart } = useCart();

  const theme = useTheme();
  const [search, setSearch] = useState("");
  const [openFilter, setOpenFilter] = useState(false);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState("");
  const [filters, setFilters] = useState({
    categories: [],
    brands: [],
    priceRange: [0, 3000],
  });
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const productsPerPage = 8;

  //  Filter and search logic
  let filteredProducts = productsData.filter((p) => {
    const matchCategory =
      filters.categories.length === 0 || filters.categories.includes(p.category);
    const matchBrand =
      filters.brands.length === 0 || filters.brands.includes(p.brand);
    const matchPrice =
      p.price >= filters.priceRange[0] && p.price <= filters.priceRange[1];
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    return matchCategory && matchBrand && matchPrice && matchSearch;
  });

  // Sort logic
  if (sort === "priceLowHigh") {
    filteredProducts.sort((a, b) => a.price - b.price);
  } else if (sort === "priceHighLow") {
    filteredProducts.sort((a, b) => b.price - a.price);
  } else if (sort === "rating") {
    filteredProducts.sort((a, b) => b.rating - a.rating);
  }

  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
  const displayedProducts = filteredProducts.slice(
    (page - 1) * productsPerPage,
    page * productsPerPage
  );

  const handleAddToCart = (product) => {
      setCart([...cart, product]);
      setSnackbarOpen(true);
  };
  const handleBuyNow = (product) =>
    navigate("/checkout", { state: { product } });
  const handleViewDetails = (product) =>
    navigate(`/product/${product.id}`, { state: { product } });

  return (
    <Box
      sx={{
        bgcolor: theme.palette.background.default,
        color: theme.palette.text.primary,
        minHeight: "100vh",
      }}
    >
      {/* 🔥 Sticky Header */}
      <Box
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 1000,
          bgcolor: theme.palette.mode === 'dark' ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(0,0,0,0.05)',
          p: 2,
          boxShadow: '0 4px 30px rgba(0, 0, 0, 0.05)',
        }}
      >
        <Box
          sx={{
            display: "flex",
            gap: 1,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          {/* Mobile Filter Button */}
          <IconButton
            sx={{ display: { xs: "flex", md: "none" } }}
            onClick={() => setOpenFilter(true)}
          >
            <FilterListIcon />
          </IconButton>

          <TextField
            placeholder="Search products..."
            size="small"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ flex: 1 }}
          />

          <FormControl sx={{ minWidth: 140 }} size="small">
            <Select
              value={sort}
              displayEmpty
              onChange={(e) => setSort(e.target.value)}
            >
              <MenuItem value="">Sort</MenuItem>
              <MenuItem value="priceLowHigh">Low → High</MenuItem>
              <MenuItem value="priceHighLow">High → Low</MenuItem>
              <MenuItem value="rating">Rating</MenuItem>
            </Select>
          </FormControl>

          <Button
            variant="contained"
            color="success"
            startIcon={<ShoppingCartIcon />}
            onClick={() => navigate("/cart")}
            sx={{ whiteSpace: "nowrap" }}
          >
            ({cart.length})
          </Button>
        </Box>
      </Box>

      {/* 🔥 Main Layout */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          p: 2,
          gap: 2,
        }}
      >
        {/* Sidebar (Desktop) */}
        <Box
          sx={{
            width: 260,
            display: { xs: "none", md: "block" },
            bgcolor: theme.palette.background.paper,
            p: 2,
            borderRadius: 2,
            boxShadow: 1,
          }}
        >
          <Typography variant="h6" mb={2}>
            Filters
          </Typography>
          <ProductFilters filters={filters} setFilters={setFilters} />
        </Box>

        {/* Products */}
        <Box sx={{ flexGrow: 1 }}>
          <Grid container spacing={2}>
            {displayedProducts.map((product) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={product.id}>
                <Box
                  sx={{
                    bgcolor: theme.palette.background.paper,
                    borderRadius: 2,
                    p: 1,
                    boxShadow: 1,
                    transition: "0.3s",
                    "&:hover": {
                      boxShadow: 4,
                      transform: "translateY(-4px)",
                    },
                  }}
                >
                  <ProductCard
                    product={product}
                    onAddToCart={handleAddToCart}
                    onBuyNow={handleBuyNow}
                    onViewDetails={handleViewDetails}
                  />
                </Box>
              </Grid>
            ))}
          </Grid>

          {/* Pagination */}
          {filteredProducts.length > productsPerPage && (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                mt: 4,
              }}
            >
              <Pagination
                count={totalPages}
                page={page}
                onChange={(_, val) => setPage(val)}
                color="success"
                size="small"
              />
            </Box>
          )}
        </Box>
      </Box>

      {/* 🔥 Mobile Drawer */}
      <Drawer
        anchor="left"
        open={openFilter}
        onClose={() => setOpenFilter(false)}
      >
        <Box
          sx={{
            width: 260,
            p: 2,
            bgcolor: theme.palette.background.paper,
          }}
        >
          <Typography variant="h6" mb={2}>
            Filters
          </Typography>
          <ProductFilters filters={filters} setFilters={setFilters} />
        </Box>
      </Drawer>

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

export default MarketPlace;
