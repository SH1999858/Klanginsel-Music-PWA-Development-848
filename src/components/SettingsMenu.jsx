import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiSettings, FiInfo, FiX, FiShuffle } = FiIcons;

const SettingsMenu = ({ isShuffleEnabled, setIsShuffleEnabled }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isMenuOpen]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleAboutClick = () => {
    setShowAbout(true);
    setIsMenuOpen(false);
  };

  const closeAbout = () => {
    setShowAbout(false);
  };

  const toggleShuffle = () => {
    setIsShuffleEnabled(!isShuffleEnabled);
    setIsMenuOpen(false);
  };

  return (
    <>
      {/* Settings Button */}
      <div className="relative" ref={menuRef}>
        <button
          onClick={toggleMenu}
          className="p-2 hover:bg-[#333333] rounded-full transition-colors duration-200"
          title="Settings"
        >
          <SafeIcon icon={FiSettings} className="text-xl text-[#e0d6cc]" />
        </button>

        {/* Dropdown Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 top-full mt-2 w-64 bg-[#252525] border border-[#333333] rounded-lg shadow-lg overflow-hidden z-50"
            >
              <button
                onClick={toggleShuffle}
                className="w-full px-4 py-3 text-left hover:bg-[#333333] transition-colors duration-200 flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <SafeIcon icon={FiShuffle} className={`text-lg ${isShuffleEnabled ? 'text-[#d4a076]' : 'text-[#a09a92]'}`} />
                  <span className="text-[#e0d6cc] font-medium">Zufallswiedergabe aktivieren</span>
                </div>
                <div className={`w-10 h-5 rounded-full relative ${isShuffleEnabled ? 'bg-[#d4a076]' : 'bg-[#444444]'} transition-colors duration-300`}>
                  <div 
                    className={`absolute top-0.5 ${isShuffleEnabled ? 'right-0.5' : 'left-0.5'} w-4 h-4 bg-[#e0d6cc] rounded-full transition-all duration-300`}
                  />
                </div>
              </button>
              
              <button
                onClick={handleAboutClick}
                className="w-full px-4 py-3 text-left hover:bg-[#333333] transition-colors duration-200 flex items-center space-x-3"
              >
                <SafeIcon icon={FiInfo} className="text-lg text-[#d4a076]" />
                <span className="text-[#e0d6cc] font-medium">About</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* About Modal */}
      <AnimatePresence>
        {showAbout && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={closeAbout}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.3 }}
              className="bg-[#252525] border border-[#333333] rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <div className="flex justify-end mb-4">
                <button
                  onClick={closeAbout}
                  className="p-1 hover:bg-[#333333] rounded-full transition-colors duration-200"
                  title="Close"
                >
                  <SafeIcon icon={FiX} className="text-xl text-[#a09a92]" />
                </button>
              </div>

              {/* About Content */}
              <div className="text-center">
                {/* App Icon */}
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#1f1f1f] border-2 border-[#d4a076] flex items-center justify-center">
                  <SafeIcon icon={FiSettings} className="text-2xl text-[#d4a076]" />
                </div>

                {/* App Title and Version */}
                <h2 className="text-xl font-semibold text-[#e0d6cc] mb-1">
                  Klanginsel
                </h2>
                <div className="inline-block px-3 py-1 bg-[#d4a076] text-[#1a1a1a] rounded-full font-bold text-sm mb-4">
                  Version 1.2
                </div>

                {/* About Text */}
                <div className="text-[#a09a92] space-y-2 mb-6">
                  <p className="text-sm leading-relaxed">
                    App erstellt von <span className="text-[#d4a076] font-medium">KI-Kunst</span>
                  </p>
                  <p className="text-sm leading-relaxed">
                    <span className="text-[#e0d6cc] font-medium">Stephan Herzhauser</span>
                  </p>
                  <p className="text-sm leading-relaxed">
                    Stand: <span className="text-[#e0d6cc]">Juli 2025</span>
                  </p>
                </div>

                {/* Close Button */}
                <button
                  onClick={closeAbout}
                  className="w-full py-3 bg-[#d4a076] text-[#1a1a1a] rounded-lg font-medium hover:bg-[#c49968] transition-colors duration-200"
                >
                  OK
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default SettingsMenu;