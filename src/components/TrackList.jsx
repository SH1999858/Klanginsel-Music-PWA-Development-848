import React from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiChevronLeft, FiPlay, FiMusic } = FiIcons;

const formatDuration = (ms) => {
  if (!ms) return '0:00';
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const TrackList = ({ tracks, currentTrack, onSelect, onClose, playlistName, themeColor }) => {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-[#333333] flex items-center">
        <button
          onClick={onClose}
          className="p-2 hover:bg-[#333333] rounded-full transition-colors duration-200 mr-3"
        >
          <SafeIcon icon={FiChevronLeft} className="text-xl text-[#e0d6cc]" />
        </button>
        <h2 className="text-xl font-medium text-[#e0d6cc]">{playlistName} Tracks</h2>
      </div>
      
      {/* Track List */}
      <div className="flex-1 overflow-y-auto pb-6">
        {tracks && tracks.length > 0 ? (
          <div className="divide-y divide-[#333333]">
            {tracks.map((track, index) => (
              <motion.button
                key={track.id || index}
                onClick={() => onSelect(index)}
                className={`w-full p-4 flex items-center text-left hover:bg-[#252525] transition-colors duration-200 ${
                  currentTrack === index ? 'bg-[#2a2a2a]' : ''
                }`}
                whileTap={{ scale: 0.98 }}
              >
                <div 
                  className={`w-8 h-8 rounded-full flex items-center justify-center mr-4 ${
                    currentTrack === index ? '' : 'opacity-60'
                  }`}
                  style={{ 
                    backgroundColor: currentTrack === index ? themeColor : '#333333',
                  }}
                >
                  {currentTrack === index ? (
                    <SafeIcon icon={FiPlay} className="text-sm text-[#1a1a1a]" />
                  ) : (
                    <span className="text-sm text-[#e0d6cc]">{index + 1}</span>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 
                    className={`text-base font-medium truncate ${
                      currentTrack === index ? 'text-[#e0d6cc]' : 'text-[#a09a92]'
                    }`}
                  >
                    {track.title}
                  </h3>
                  <p className="text-xs text-[#777777] truncate">
                    {track.artist || "Unknown"} • {formatDuration(track.duration)}
                  </p>
                </div>
              </motion.button>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-[#252525] flex items-center justify-center mb-4">
              <SafeIcon icon={FiMusic} className="text-2xl text-[#666666]" />
            </div>
            <p className="text-[#a09a92]">Loading tracks...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrackList;