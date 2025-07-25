import React from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import KIKunstLogo from './KIKunstLogo';

const { FiMusic, FiWaves } = FiIcons;

const PlaylistSelector = ({ playlists, onSelect }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] p-6 bg-gradient-to-b from-[#1a1a2e] to-[#1a1a1a]">
      <KIKunstLogo />

      <div className="space-y-5 w-full max-w-sm mt-4">
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-center text-[#a0a0c2] text-lg font-light mb-4"
        >
          Choose your sound journey
        </motion.p>

        {Object.entries(playlists).map(([key, playlist], index) => (
          <motion.button
            key={key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
            whileHover={{ scale: 1.02, backgroundColor: '#252535' }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(key)}
            className="w-full h-18 bg-[#212130] rounded-xl border border-[#333345] transition-all duration-300 flex items-center justify-between px-5 group shadow-md"
          >
            <div className="flex items-center space-x-4">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center shadow-inner"
                style={{
                  backgroundColor: '#1f1f2f',
                  border: `2px solid ${key === 'chillout' ? '#366dab40' : '#366dab40'}`
                }}
              >
                <SafeIcon
                  icon={key === 'chillout' ? FiWaves : FiMusic}
                  className="text-lg"
                  style={{ color: key === 'chillout' ? '#366dab' : '#366dab' }}
                />
              </div>
              <span className="text-lg font-light text-[#e0d6cc] group-hover:text-white">
                {playlist.name}
              </span>
            </div>
            <motion.div whileHover={{ x: 5 }} transition={{ duration: 0.2 }}>
              <SafeIcon
                icon={FiIcons.FiChevronRight}
                className="text-[#a0a0c2] group-hover:text-[#e0d6cc] text-lg"
              />
            </motion.div>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default PlaylistSelector;