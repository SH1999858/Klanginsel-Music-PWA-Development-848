import React from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import { FiArrowLeft, FiHome } from 'react-icons/fi';
import SettingsMenu from './SettingsMenu';

const Header = ({ showBackButton, onBack, showLogo, isShuffleEnabled, setIsShuffleEnabled }) => {
  return (
    <motion.header
      className="w-full flex items-center justify-between p-4 border-b border-[#333333]"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Left Side - Back Button */}
      <div className="flex items-center">
        {showBackButton && (
          <motion.button
            onClick={onBack}
            className="p-2 hover:bg-[#333333] rounded-full transition-colors duration-200 shadow-sm"
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            title="Zurück zur Startseite"
          >
            <SafeIcon icon={FiHome} className="text-xl text-[#e0d6cc]" />
          </motion.button>
        )}
      </div>

      {/* Center - Logo */}
      {showLogo && (
        <div className="logo-container flex-1 flex justify-center">
          <div className="flex flex-col items-center">
            {/* KI Kunst Logo */}
            <div className="ki-kunst-logo mb-1">
              <svg width="120" height="30" viewBox="0 0 120 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                <text x="10" y="20" fontFamily="Arial" fontSize="16" fontWeight="700" fill="#e0d6cc">KI KUNST</text>
              </svg>
            </div>

            {/* Klanginsel Logo */}
            <div className="klanginsel-logo">
              <svg width="180" height="40" viewBox="0 0 240 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M30 15C21.716 15 15 21.716 15 30C15 38.284 21.716 45 30 45C38.284 45 45 38.284 45 30C45 21.716 38.284 15 30 15ZM30 40C24.477 40 20 35.523 20 30C20 24.477 24.477 20 30 20C35.523 20 40 24.477 40 30C40 35.523 35.523 40 30 40Z"
                  fill="#d4a076"
                />
                <text x="55" y="35" fontFamily="Arial" fontSize="22" fontWeight="700" fill="#e0d6cc">KLANGINSEL</text>
              </svg>
            </div>
          </div>
        </div>
      )}

      {/* Right Side - Settings Menu */}
      <div className="flex items-center">
        <SettingsMenu isShuffleEnabled={isShuffleEnabled} setIsShuffleEnabled={setIsShuffleEnabled} />
      </div>
    </motion.header>
  );
};

export default Header;