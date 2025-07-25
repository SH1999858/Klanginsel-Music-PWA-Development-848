import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const KIKunstLogo = () => {
  const [logoLoaded, setLogoLoaded] = useState(false);
  const [logoError, setLogoError] = useState(false);

  useEffect(() => {
    // Check if the logo image exists and can be loaded
    const img = new Image();
    img.onload = () => {
      setLogoLoaded(true);
      setLogoError(false);
    };
    img.onerror = () => {
      setLogoError(true);
    };
    img.src = '/ki-kunst-logo.jpg';
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-6 flex justify-center items-center"
    >
      <div className="text-center">
        {logoLoaded && !logoError ? (
          // Show the actual logo image when successfully loaded
          <div className="bg-[#1a1a1a] rounded-lg p-3 border border-[#333333] shadow-md">
            <img 
              src="/ki-kunst-logo.jpg" 
              alt="KI-KUNST Logo" 
              className="h-16 object-contain"
            />
          </div>
        ) : (
          // Fallback to text logo
          <div className="bg-[#1a1a1a] rounded-lg p-3 border border-[#333333] shadow-md">
            <div className="flex flex-col items-center justify-center">
              {/* KI-KUNST text logo */}
              <div className="text-[#d4a076] font-bold text-3xl tracking-wider">
                KI-KUNST
              </div>
              <div className="text-[#a09a92] text-xs mt-1">
                Stephan Herzhauser
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default KIKunstLogo;