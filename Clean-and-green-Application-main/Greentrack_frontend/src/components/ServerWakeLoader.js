import React, { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import EnergySavingsLeafIcon from '@mui/icons-material/EnergySavingsLeaf';

const ecoFacts = [
  "Did you know? Recycling one aluminum can saves enough energy to run a TV for three hours.",
  "Fun Fact: Over 1 million seabirds and 100,000 sea mammals are killed by pollution every year.",
  "Did you know? A glass bottle takes 4,000 years to decompose naturally.",
  "Fun Fact: Only 1% of the earth's water is drinkable.",
  "Did you know? Trees in forests talk and share nutrients through an underground internet of fungi.",
  "Fun Fact: If everyone recycled just one newspaper, 250 million trees could be saved each year.",
  "Did you know? Producing recycled paper causes 74% less air pollution than making new paper."
];

const ServerWakeLoader = () => {
  const [factIndex, setFactIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setFactIndex((prev) => (prev + 1) % ecoFacts.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 4, textAlign: 'center', minHeight: '300px', justifyContent: 'center' }}>
      <motion.div
        animate={{ 
          scale: [1, 1.2, 1],
          y: [0, -10, 0]
        }}
        transition={{ 
          duration: 2, 
          repeat: Infinity,
          ease: "easeInOut" 
        }}
      >
        <EnergySavingsLeafIcon sx={{ fontSize: 80, color: '#10b981', mb: 2 }} />
      </motion.div>

      <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#059669', mb: 1 }}>
        Powering up the Servers...
      </Typography>
      
      <Typography variant="body2" sx={{ color: '#475569', mb: 2 }}>
        Our free servers sleep to save energy! Please wait ~50 seconds.
      </Typography>

      <Box sx={{ height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={factIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5 }}
          >
            <Typography variant="body1" sx={{ color: '#1e293b', fontStyle: 'italic', fontWeight: 500 }}>
              {ecoFacts[factIndex]}
            </Typography>
          </motion.div>
        </AnimatePresence>
      </Box>

      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
      >
        <AutorenewIcon sx={{ fontSize: 40, color: '#3b82f6' }} />
      </motion.div>
    </Box>
  );
};

export default ServerWakeLoader;
