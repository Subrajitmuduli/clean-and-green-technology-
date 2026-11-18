import React from 'react'; 
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  TextField,
  useTheme
} from '@mui/material';
import { motion } from 'framer-motion';
import RecyclingIcon from '@mui/icons-material/Recycling';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import StorefrontIcon from '@mui/icons-material/Storefront';
import SchoolIcon from '@mui/icons-material/School';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import FacebookIcon from '@mui/icons-material/Facebook';
import TwitterIcon from '@mui/icons-material/Twitter';
import InstagramIcon from '@mui/icons-material/Instagram';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import NatureIcon from '@mui/icons-material/Nature';
import VerifiedIcon from '@mui/icons-material/Verified';
import VolunteerActivismIcon from '@mui/icons-material/VolunteerActivism';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import greentrackLogo from '../assets/greentrack-logo.png';
import { useNavigate } from 'react-router-dom';
import FAQSection from '../components/FAQSection';
import { toast } from 'react-toastify';

const Home = ({ onFeatureClick }) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [subscribeEmail, setSubscribeEmail] = React.useState('');
  const [mousePos, setMousePos] = React.useState({ x: 0, y: 0 });
  const heroRef = React.useRef(null);

  const handleMouseMove = (e) => {
    if (heroRef.current) {
      const rect = heroRef.current.getBoundingClientRect();
      setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }
  };

  const isDark = theme.palette.mode === 'dark';

  const features = [
    { icon: <RecyclingIcon sx={{ fontSize: 50, color: theme.palette.primary.main }} />, title: 'AI Waste Segregation', desc: 'Automatically detect and classify waste using AI-powered image recognition.' },
    { icon: <EmojiEventsIcon sx={{ fontSize: 50, color: theme.palette.primary.main }} />, title: 'Earn Green Coins', desc: 'Earn coins for every eco-friendly action and redeem them for rewards.' },
    { icon: <StorefrontIcon sx={{ fontSize: 50, color: theme.palette.primary.main }} />, title: 'Eco Marketplace', desc: 'Buy and sell recycled products directly through our digital marketplace.' },
    { icon: <SchoolIcon sx={{ fontSize: 50, color: theme.palette.primary.main }} />, title: 'Sustainability Courses', desc: 'Learn eco-living through engaging, expert-curated courses and tutorials.' },
  ];

  const missionPoints = [
    { icon: <NatureIcon sx={{ fontSize: 40, color: theme.palette.primary.main }} />, title: 'Our Mission', text: 'To create a smarter, cleaner, and greener planet using AI and community participation.' },
    { icon: <VerifiedIcon sx={{ fontSize: 40, color: theme.palette.primary.main }} />, title: 'Our Vision', text: 'To make waste segregation an effortless, transparent, and rewarding habit worldwide.' },
    { icon: <VolunteerActivismIcon sx={{ fontSize: 40, color: theme.palette.primary.main }} />, title: 'Our Impact', text: 'Thousands of users are already making a positive change for the environment every day.' },
  ];

  const quickLinks = [
    { name: 'Home', path: '/' },
    { name: 'Report Waste', path: '/report-waste' },
    { name: 'Earn Coins', path: '/earn-coins' },
    { name: 'Marketplace', path: '/marketplace' },
    { name: 'Courses', path: '/courses' }
  ];

  const handleSubscribe = async () => {
    if (!subscribeEmail.trim()) {
      toast.warning("Please enter your email first!");
      return;
    }

    try {
      await fetch("https://formsubmit.co/ajax/patnaiksreyas@gmail.com", {
          method: "POST",
          headers: { 
              'Content-Type': 'application/json',
              'Accept': 'application/json'
          },
          body: JSON.stringify({
              _subject: "New Newsletter Subscriber! 🌍",
              email: subscribeEmail,
              message: `New subscription request from: ${subscribeEmail}`
          })
      });
      toast.success("You are successfully subscribed to this website! 🌱");
      setSubscribeEmail('');
    } catch (err) {
      toast.warning("Subscription failed. Please try again later.");
    }
  };

  const floatingAnimation = { y: [0, -15, 0], transition: { duration: 4, repeat: Infinity, ease: 'easeInOut' } };

  // Glassmorphism card style
  const glassCardStyle = {
    background: isDark ? 'rgba(30, 30, 30, 0.7)' : 'rgba(255, 255, 255, 0.8)',
    backdropFilter: 'blur(16px)',
    borderRadius: '24px',
    boxShadow: isDark ? '0 8px 32px rgba(0, 0, 0, 0.4)' : '0 8px 32px rgba(31, 38, 135, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.18)',
    textAlign: 'center',
    p: { xs: 2, md: 4 },
    height: '100%',
    transition: 'transform 0.3s ease'
  };
  const Counter = ({ icon, label, value }) => (
    <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} style={{ textAlign: 'center', padding: '15px' }}>
      {icon}
      <Typography variant="h4" sx={{ color: theme.palette.primary.main, fontWeight: '900', mt: 1, letterSpacing: '-1px' }}>{value}+</Typography>
      <Typography variant="body1" sx={{ color: theme.palette.text.secondary, fontWeight: '500' }}>{label}</Typography>
    </motion.div>
  );

  return (
    <Box sx={{ bgcolor: theme.palette.background.default, minHeight: '100vh', overflowX: 'hidden', transition: 'background-color 0.5s ease' }}>
      
      {/* Background Floating Elements (Hidden on extra small screens for performance) */}
      <Box sx={{ display: { xs: 'none', md: 'block' } }}>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: isDark ? 0.05 : 0.15 }} style={{ position: 'absolute', top: '10%', left: '5%', zIndex: 0 }}>
          <motion.div animate={floatingAnimation}><RecyclingIcon sx={{ fontSize: 150, color: theme.palette.primary.main }} /></motion.div>
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: isDark ? 0.05 : 0.15 }} style={{ position: 'absolute', top: '40%', right: '5%', zIndex: 0 }}>
          <motion.div animate={{ ...floatingAnimation, transition: { ...floatingAnimation.transition, delay: 1 } }}><EmojiEventsIcon sx={{ fontSize: 120, color: theme.palette.secondary.main }} /></motion.div>
        </motion.div>
      </Box>

      {/* HERO SECTION */}
      <Box sx={{ p: { xs: 2, md: 5 } }}>
        <motion.div initial={{ opacity: 0, scale: 0.95, y: -40 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.8, ease: "easeOut" }}>
          <motion.div 
            style={{ 
              textAlign: 'center', 
              paddingTop: '96px', 
              paddingBottom: '96px', 
              paddingLeft: '32px',
              paddingRight: '32px',
              background: isDark 
                ? 'linear-gradient(270deg, #064e3b, #022c22, #047857, #064e3b)' 
                : 'linear-gradient(270deg, #10b981, #059669, #34d399, #10b981)', 
              backgroundSize: '400% 400%',
              borderRadius: '40px', 
              color: '#fff',
              boxShadow: isDark ? '0 20px 40px rgba(0,0,0,0.5)' : '0 20px 40px rgba(16,185,129,0.3)',
              position: 'relative', 
              overflow: 'hidden',
              cursor: 'none'
            }}
            animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
            transition={{ duration: 15, ease: 'easeInOut', repeat: Infinity }}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setMousePos({ x: -200, y: -200 })}
            ref={heroRef}
          >
            {/* Custom Mouse Cursor Effect */}
            <motion.div
              style={{
                position: 'absolute',
                width: '120px',
                height: '120px',
                background: isDark ? 'radial-gradient(circle, rgba(16,185,129,0.5) 0%, rgba(16,185,129,0) 70%)' : 'radial-gradient(circle, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0) 70%)',
                borderRadius: '50%',
                pointerEvents: 'none',
                zIndex: 1,
                transform: 'translate(-50%, -50%)',
              }}
              animate={{ x: mousePos.x, y: mousePos.y }}
              transition={{ type: 'spring', damping: 25, stiffness: 200, mass: 0.5 }}
            />
            {/* Sparkles / Particles */}
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={`sparkle-${i}`}
                style={{
                  position: 'absolute',
                  width: Math.random() * 6 + 4 + 'px',
                  height: Math.random() * 6 + 4 + 'px',
                  background: 'rgba(255,255,255,0.8)',
                  borderRadius: '50%',
                  top: Math.random() * 100 + '%',
                  left: Math.random() * 100 + '%',
                  zIndex: 1,
                }}
                animate={{
                  y: [0, -30, 0],
                  x: [0, (Math.random() - 0.5) * 30, 0],
                  opacity: [0, 1, 0],
                  scale: [0.5, 1.5, 0.5],
                }}
                transition={{ duration: Math.random() * 2 + 2, repeat: Infinity, ease: 'easeInOut', delay: Math.random() }}
              />
            ))}

            <img 
              src={greentrackLogo} 
              alt="GreenTrack Logo" 
              style={{ width: 140, height: 140, marginBottom: 24, position: 'relative', zIndex: 2 }} 
            />

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.8 }} style={{ position: 'relative', zIndex: 2 }}>
              <Typography variant="h2" sx={{ fontWeight: '800', mb: 2, fontSize: { xs: '2.5rem', md: '4.5rem' }, letterSpacing: '-1px' }}>
                Welcome to GreenTrack
              </Typography>
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6, duration: 1 }} style={{ position: 'relative', zIndex: 2 }}>
              <Typography variant="h6" sx={{ mb: 5, fontWeight: '400', maxWidth: '800px', mx: 'auto', opacity: 0.9, fontSize: { xs: '1rem', md: '1.25rem' } }}>
                Revolutionizing Waste Management with digitalized waste locating for a Greener Future
              </Typography>
            </motion.div>

            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} transition={{ type: 'spring', stiffness: 400 }} style={{ position: 'relative', zIndex: 2 }}>
              <Button 
                variant="contained" 
                size="large" 
                onClick={onFeatureClick}
                sx={{ 
                  bgcolor: isDark ? '#10b981' : '#ffffff', 
                  color: isDark ? '#fff' : '#047857',
                  '&:hover': { bgcolor: isDark ? '#34d399' : '#f8fafc', boxShadow: '0 0 25px rgba(255,255,255,0.4)' }, 
                  px: { xs: 4, md: 6 }, 
                  py: 1.5, 
                  borderRadius: '50px', 
                  fontWeight: '700',
                  fontSize: '1.1rem'
                }} 
              >
                Get Started <ArrowForwardIosIcon sx={{ ml: 1, fontSize: '1rem' }} />
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      </Box>

      {/* COUNTERS */}
      <Box sx={{ px: { xs: 2, md: 5 }, mt: 4, mb: 10 }}>
        <Grid container spacing={3} justifyContent="center" alignItems="center">
          <Grid item xs={12} sm={4} md={3}><Counter icon={<PeopleAltIcon sx={{ fontSize: 50, color: theme.palette.secondary.main }} />} label="Active Users" value="5,000" /></Grid>
          <Grid item xs={12} sm={4} md={3}><Counter icon={<DeleteSweepIcon sx={{ fontSize: 50, color: theme.palette.secondary.main }} />} label="Waste Segregated (Kg)" value="12,400" /></Grid>
          <Grid item xs={12} sm={4} md={3}><Counter icon={<WorkspacePremiumIcon sx={{ fontSize: 50, color: theme.palette.secondary.main }} />} label="Rewards Redeemed" value="3,200" /></Grid>
        </Grid>
      </Box>

      {/* FEATURES */}
      <Box sx={{ px: { xs: 2, md: 10 }, mb: 12 }}>
        <Typography variant="h3" textAlign="center" sx={{ fontWeight: '900', color: theme.palette.text.primary, mb: 6, fontSize: { xs: '2rem', md: '3rem' } }}>
          Key Features
        </Typography>
        <Grid container spacing={4} justifyContent="center">
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.6, delay: index * 0.15 }} whileHover={{ y: -10 }}>
                <Card sx={{ ...glassCardStyle }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ bgcolor: isDark ? 'rgba(67, 160, 71, 0.1)' : 'rgba(67, 160, 71, 0.05)', display: 'inline-block', p: 2, borderRadius: '50%', mb: 2 }}>
                      {feature.icon}
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: theme.palette.text.primary, mb: 1 }}>{feature.title}</Typography>
                    <Typography variant="body2" sx={{ color: theme.palette.text.secondary, lineHeight: 1.6 }}>{feature.desc}</Typography>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* MISSION */}
      <Box sx={{ px: { xs: 2, md: 5 }, mb: 12 }}>
        <Box sx={{ py: 10, px: { xs: 3, md: 8 }, background: isDark ? 'linear-gradient(135deg, #222, #111)' : 'linear-gradient(135deg, #e8f5e9, #c8e6c9)', borderRadius: '40px', boxShadow: 'inset 0 0 20px rgba(0,0,0,0.05)' }}>
          <Typography textAlign="center" variant="h3" sx={{ color: theme.palette.primary.main, fontWeight: '900', mb: 8, fontSize: { xs: '2rem', md: '3rem' } }}>
            Our Mission & Vision 🌏
          </Typography>
          <Grid container spacing={4} justifyContent="center">
            {missionPoints.map((point, i) => (
              <Grid item xs={12} sm={6} md={4} key={i}>
                <motion.div whileHover={{ scale: 1.03 }} transition={{ duration: 0.3 }} style={{ background: theme.palette.background.paper, borderRadius: '24px', padding: '35px', boxShadow: isDark ? '0 10px 30px rgba(0,0,0,0.5)' : '0 10px 30px rgba(0,0,0,0.08)', textAlign: 'center', height: '100%' }}>
                  <Box sx={{ mb: 2 }}>{point.icon}</Box>
                  <Typography variant="h5" sx={{ color: theme.palette.text.primary, fontWeight: 'bold', mb: 2 }}>{point.title}</Typography>
                  <Typography variant="body1" sx={{ color: theme.palette.text.secondary, lineHeight: 1.7 }}>{point.text}</Typography>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Box>

      {/* CTA */}
      <Box sx={{ textAlign: 'center', my: 12, px: { xs: 2, md: 10 } }}>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} transition={{ type: 'spring', stiffness: 300 }}>
          <Button 
            variant="contained" 
            size="large" 
            component="a"
            href="https://chat.whatsapp.com/HNkOmURaeIK8c5zHvRfjcW?mode=gi_t"
            target="_blank"
            rel="noopener noreferrer"
            sx={{ 
              background: 'linear-gradient(90deg, #25D366 0%, #128C7E 100%)', 
              boxShadow: '0 10px 30px rgba(37, 211, 102, 0.4)',
              px: { xs: 4, md: 8 }, 
              py: { xs: 2, md: 2.5 }, 
              borderRadius: '50px', 
              fontWeight: 'bold', 
              fontSize: { xs: '1.2rem', md: '1.5rem' },
              color: 'white',
              textTransform: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 1,
              '&:hover': {
                background: 'linear-gradient(90deg, #128C7E 0%, #075E54 100%)',
                boxShadow: '0 14px 40px rgba(37, 211, 102, 0.5)',
              }
            }} 
          >
            💬 Join the Green Movement ♻️
          </Button>
        </motion.div>
      </Box>

      {/* FAQ Section */}
      <Box sx={{ px: { xs: 2, md: 10 }, mb: 10 }}>
        <FAQSection />
      </Box>

      {/* FOOTER */}
      <Box sx={{ mt: 8, background: isDark ? '#0a190f' : 'linear-gradient(135deg, #2E7D32, #1B5E20)', color: 'white', borderTopLeftRadius: '40px', borderTopRightRadius: '40px', px: { xs: 3, md: 10 }, py: { xs: 6, md: 8 } }}>
        <Grid container spacing={6} justifyContent="space-between">
          <Grid item xs={12} md={4}>
            <Typography variant="h4" sx={{ color: '#C8E6C9', mb: 2, fontWeight: 'bold', letterSpacing: '-1px' }}>🌱 GreenTrack</Typography>
            <Typography variant="body1" sx={{ lineHeight: 1.8, opacity: 0.9, mb: 3 }}>
              Empowering citizens to report, recycle, and earn rewards for a cleaner and greener future. Let’s make our cities sustainable, one action at a time.
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, opacity: 0.9 }}>
              <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center' }}><EmailIcon sx={{ fontSize: 20, mr: 1.5 }} /> patnaiksreyas@gmail.com</Typography>
              <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center' }}><PhoneIcon sx={{ fontSize: 20, mr: 1.5 }} /> +91 6372919158</Typography>
              <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center' }}><LocationOnIcon sx={{ fontSize: 20, mr: 1.5 }} /> GreenTrack HQ, Bangalore, Karnataka, India</Typography>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <Typography variant="h6" sx={{ color: '#C8E6C9', mb: 3, fontWeight: 'bold' }}>Quick Links</Typography>
            {quickLinks.map((link, index) => (
              <motion.div key={index} whileHover={{ x: 5 }} transition={{ type: 'spring', stiffness: 300 }}>
                <Typography sx={{ mb: 1.5, fontSize: '1.1rem', cursor: 'pointer', opacity: 0.8, '&:hover': { opacity: 1, color: '#A5D6A7' } }} 
                  onClick={() => navigate(link.path)}>
                  {link.name}
                </Typography>
              </motion.div>
            ))}
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="h6" sx={{ color: '#C8E6C9', mb: 3, fontWeight: 'bold' }}>Stay Connected</Typography>
            <Typography variant="body1" sx={{ mb: 2, opacity: 0.9 }}>Subscribe for updates and tips!</Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 4 }}>
              <TextField 
                placeholder="Enter your email" 
                variant="outlined" 
                size="small" 
                value={subscribeEmail}
                onChange={(e) => setSubscribeEmail(e.target.value)}
                sx={{ 
                  bgcolor: 'rgba(255,255,255,0.1)', 
                  borderRadius: '8px', 
                  width: '100%',
                  '& .MuiOutlinedInput-root': { color: 'white', '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' } }
                }} 
              />
              <Button onClick={handleSubscribe} variant="contained" sx={{ bgcolor: '#43a047', '&:hover': { bgcolor: '#66bb6a' }, textTransform: 'none', px: 3, fontWeight: 'bold' }}>Subscribe</Button>
            </Box>
            <Box sx={{ display: 'flex', gap: 2.5 }}>
              {[FacebookIcon, TwitterIcon, InstagramIcon].map((Icon, idx) => (
                <motion.div key={idx} whileHover={{ scale: 1.2, rotate: 5, color: '#A5D6A7' }} transition={{ duration: 0.2 }}>
                  <Icon sx={{ fontSize: 30, color: 'white', cursor: 'pointer', opacity: 0.8 }} />
                </motion.div>
              ))}
              <motion.div whileHover={{ scale: 1.2, rotate: 5, color: '#A5D6A7' }} transition={{ duration: 0.2 }}>
                <a href="https://clean-and-green.netlify.app" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit' }}>
                  <LinkedInIcon sx={{ fontSize: 30, color: 'white', cursor: 'pointer', opacity: 0.8 }} />
                </a>
              </motion.div>
            </Box>
          </Grid>
        </Grid>
        
        <Box sx={{ textAlign: 'center', mt: 8, pt: 3, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <Typography variant="body2" sx={{ opacity: 0.6 }}>© {new Date().getFullYear()} GreenTrack Application. All Rights Reserved.</Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default Home;
