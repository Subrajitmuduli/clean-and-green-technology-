import React, { useState } from "react";
import {
  Box,
  Typography,
  Divider,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Slider,
  Button,
  useTheme,
} from "@mui/material";

const ProductFilters = ({ filters, setFilters }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const categories = ["Bags", "Stationery", "Solar Devices", "Eco-Home", "Organic Foods", "Gadgets", "Bottles"];
  const brands = ["GreenCo", "EcoNote", "SunBright", "BeeGreen", "HydroEco", "EcoFurnish"];

  const handleCategoryChange = (category) => {
    const newCategories = filters.categories.includes(category)
      ? filters.categories.filter((c) => c !== category)
      : [...filters.categories, category];
    setFilters({ ...filters, categories: newCategories });
  };

  const handleBrandChange = (brand) => {
    const newBrands = filters.brands.includes(brand)
      ? filters.brands.filter((b) => b !== brand)
      : [...filters.brands, brand];
    setFilters({ ...filters, brands: newBrands });
  };

  const handlePriceChange = (_, newValue) => {
    setFilters({ ...filters, priceRange: newValue });
  };

  const clearFilters = () => {
    setFilters({
      categories: [],
      brands: [],
      priceRange: [0, 3000],
    });
  };

  return (
    <Box
      sx={{
        width: 250,
        pr: 2,
        borderRight: `1px solid ${theme.palette.divider}`,
        mr: 3,
        height: "100%",
      }}
    >
      <Typography variant="h6" sx={{ color: theme.palette.success.main, mb: 2, fontWeight: 'bold' }}>
        Filters
      </Typography>
      <Divider sx={{ mb: 2 }} />

      {/* Category Filter */}
      <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 1, color: theme.palette.text.primary }}>
        Category
      </Typography>
      <FormGroup>
        {categories.map((cat) => (
          <FormControlLabel
            key={cat}
            control={
              <Checkbox
                checked={filters.categories.includes(cat)}
                onChange={() => handleCategoryChange(cat)}
                color="success"
              />
            }
            label={<Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>{cat}</Typography>}
          />
        ))}
      </FormGroup>

      <Divider sx={{ my: 2 }} />

      {/* Brand Filter */}
      <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 1, color: theme.palette.text.primary }}>
        Brand
      </Typography>
      <FormGroup>
        {brands.map((brand) => (
          <FormControlLabel
            key={brand}
            control={
              <Checkbox
                checked={filters.brands.includes(brand)}
                onChange={() => handleBrandChange(brand)}
                color="success"
              />
            }
            label={<Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>{brand}</Typography>}
          />
        ))}
      </FormGroup>

      <Divider sx={{ my: 2 }} />

      {/* Price Range Filter */}
      <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 1, color: theme.palette.text.primary }}>
        Price Range
      </Typography>
      <Slider
        value={filters.priceRange}
        onChange={handlePriceChange}
        valueLabelDisplay="auto"
        min={0}
        max={3000}
        sx={{ 
          color: theme.palette.success.main,
          '& .MuiSlider-valueLabel': {
            bgcolor: theme.palette.success.main,
          }
        }}
      />
      <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
        ₹{filters.priceRange[0]} – ₹{filters.priceRange[1]}
      </Typography>

      <Button
        variant="outlined"
        color="success"
        onClick={clearFilters}
        sx={{ mt: 3, width: "100%", borderRadius: '8px', textTransform: 'none', fontWeight: 'bold' }}
      >
        Clear Filters
      </Button>
    </Box>
  );
};

export default ProductFilters;

