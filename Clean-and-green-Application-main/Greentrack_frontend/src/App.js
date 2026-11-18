import React, { useState, useEffect, Suspense, lazy, useCallback, useRef } from 'react';
import { Routes, Route } from 'react-router-dom';
import { CircularProgress, Box } from '@mui/material';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Navbar from './components/Navbar';
import LoginModal from './components/LoginModal';
import RegisterModal from './components/RegisterModal';
import InteractionModal from './components/InteractionModal'; 
import { CartProvider } from './context/CartContext';
import ErrorBoundary from './components/ErrorBoundary';
import { getUser } from './utils/safeStorage';
import { BACKEND_URL } from './config';

const Home = lazy(() => import('./pages/Home'));
const ReportWaste = lazy(() => import('./pages/ReportWaste'));
const EarnCoins = lazy(() => import('./pages/EarnCoins'));
const MarketPlace = lazy(() => import('./pages/MarketPlace'));
const Courses = lazy(() => import('./pages/Courses'));
const ProductDetails = lazy(() => import("./pages/ProductDetails"));
const CartPage = lazy(() => import("./pages/CartPage"));
const Checkout = lazy(() => import("./pages/Checkout"));
const OrderSuccess = lazy(() => import("./pages/OrderSuccess"));
const OrderHistory = lazy(() => import("./pages/OrderHistory"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const HelpPage = lazy(() => import("./pages/Help"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const UserProfile = lazy(() => import("./pages/UserProfile"));

// 🌱 Lazy Importing course components
const RecyclingCourse = lazy(() => import("./components/RecyclingCourse"));
const WasteManagementAtHome = lazy(() => import("./components/WasteManagementAtHome"));
const SustainableLiving = lazy(() => import("./components/SustainableLiving"));
const GreenTechInnovation = lazy(() => import("./components/GreenTechInnovations"));
const EWasteAwareness = lazy(() => import("./components/EWasteAwareness"));
const EnvironmentalAwareness = lazy(() => import("./components/EnvironmentalAwareness"));
const EnergyConservation = lazy(() => import("./components/EnergyConservation"));
const EcoFriendlyAgriculture = lazy(() => import("./components/EcoFriendlyAgriculture"));
const CarbonFootprintCourse = lazy(() => import("./components/CarbonFootprintCourse"));

const KEEP_ALIVE_INTERVAL = 2 * 60 * 1000; // 2 minutes — prevents Render cold-start

function App() {
  const [openLogin, setOpenLogin] = useState(false);
  const [openRegister, setOpenRegister] = useState(false);
  const [openInteraction, setOpenInteraction] = useState(false);
  const [user, setUser] = useState(null);
  const keepAliveRef = useRef(null);

  // 🚀 Keep-alive ping: prevents Render free-tier cold sleep
  const pingBackend = useCallback(() => {
    fetch(`${BACKEND_URL}/`, { method: 'HEAD' }).catch(() => {});
  }, []);

  useEffect(() => {
    // Initial wake-up ping
    pingBackend();

    const storedUser = getUser();
    if (storedUser) {
      setUser(storedUser);
    }

    // 🛡️ Keep-alive: ping every 4 minutes ONLY while the tab is visible
    const startKeepAlive = () => {
      if (keepAliveRef.current) clearInterval(keepAliveRef.current);
      keepAliveRef.current = setInterval(pingBackend, KEEP_ALIVE_INTERVAL);
    };

    const stopKeepAlive = () => {
      if (keepAliveRef.current) {
        clearInterval(keepAliveRef.current);
        keepAliveRef.current = null;
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopKeepAlive();
      } else {
        // Tab became visible again — immediate ping + restart interval
        pingBackend();
        startKeepAlive();
      }
    };

    startKeepAlive();
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      stopKeepAlive();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [pingBackend]);


  // Function to handle feature clicks
  const handleFeatureClick = () => {
  if (!user) {
    setOpenInteraction(true); // Only show popup if not logged in
  }
};


  return (
    <ErrorBoundary>
    <CartProvider>
      <Navbar
        setOpenLogin={setOpenLogin}
        setOpenRegister={setOpenRegister}
        onFeatureClick={handleFeatureClick}
      />

      <Suspense fallback={<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}><CircularProgress color="success" /></Box>}>
        <Routes>
        <Route path="/" element={<Home onFeatureClick={handleFeatureClick} />} />
        <Route path="/report-waste" element={<ReportWaste onClick={handleFeatureClick} />} />
        <Route path="/earn-coins" element={<EarnCoins />} />
        <Route path="/courses" element={<Courses onClick={handleFeatureClick} />} />
        <Route path="/marketplace" element={<MarketPlace />} />
        <Route path="/product/:id" element={<ProductDetails />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/order-success" element={<OrderSuccess />} />
        <Route path="/orders" element={<OrderHistory />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/help" element={<HelpPage />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/profile/:id" element={<UserProfile />} />

          {/* 🌱 Courses Pages */}
        <Route path="/recycling-course" element={<RecyclingCourse />} />
        <Route path="/waste-management" element={<WasteManagementAtHome />} />
        <Route path="/sustainable-living" element={<SustainableLiving />} />
        <Route path="/green-tech-innovation" element={<GreenTechInnovation />} /> 
        <Route path="/environmental-awareness" element={<EnvironmentalAwareness />} />
        <Route path="/energy-conservation" element={<EnergyConservation />} />
        <Route path="/eco-friendly-agriculture" element={<EcoFriendlyAgriculture />} />
        <Route path="/carbon-footprint-course" element={<CarbonFootprintCourse />} />
        <Route path="/e-waste-awareness" element={<EWasteAwareness />} />

        </Routes>
      </Suspense>

  {!user && (
      <InteractionModal 
        open={openInteraction} 
        handleClose={() => setOpenInteraction(false)} 
        setOpenLogin={setOpenLogin}
        setOpenRegister={setOpenRegister}
      />
  )}

      <LoginModal open={openLogin} handleClose={() => setOpenLogin(false)} setUser={setUser} />
      <RegisterModal open={openRegister} handleClose={() => setOpenRegister(false)} />
      <ToastContainer 
        position="bottom-right"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
        toastStyle={{ borderRadius: '12px', boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }}
      />
    </CartProvider>
    </ErrorBoundary>
  );
}

export default App;
