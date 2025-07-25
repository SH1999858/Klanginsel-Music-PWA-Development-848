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
    <div className="flex flex-col h-full bg-gradient-to-b from-[#1a1a2e] to-[#1a1a1a]">
      {/* Header */}
      <div className="p-4 border-b border-[#333345] flex items-center bg-[#1a1a2e]">
        <button
          onClick={onClose}
          className="p-2 hover:bg-[#2a2a4a] rounded-full transition-colors duration-200 mr-3"
        >
          <SafeIcon icon={FiChevronLeft} className="text-xl text-[#e0d6cc]" />
        </button>
        <h2 className="text-xl font-medium text-[#e0d6cc]">{playlistName} Tracks</h2>
      </div>

      {/* Track List */}
      <div className="flex-1 overflow-y-auto pb-6">
        {tracks && tracks.length > 0 ? (
          <div className="divide-y divide-[#333345]">
            {tracks.map((track, index) => (
              <motion.button
                key={track.id || index}
                onClick={() => onSelect(index)}
                className={`w-full p-4 flex items-center text-left hover:bg-[#252535] transition-colors duration-200 ${
                  currentTrack === index ? 'bg-[#2a2a4a]' : ''
                }`}
                whileTap={{ scale: 0.98 }}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center mr-4 ${
                    currentTrack === index ? '' : 'opacity-60'
                  }`}
                  style={{
                    backgroundColor: currentTrack === index ? '#366dab' : '#333345',
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
                      currentTrack === index ? 'text-[#e0d6cc]' : 'text-[#a0a0c2]'
                    }`}
                  >
                    {track.title || track.originalTitle || `Track ${index + 1}`}
                  </h3>
                  <p className="text-xs text-[#7777aa] truncate">
                    {track.artist || `${playlistName} Artist`} • {formatDuration(track.duration)}
                  </p>
                </div>
              </motion.button>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-[#252535] flex items-center justify-center mb-4">
              <SafeIcon icon={FiMusic} className="text-2xl text-[#666699]" />
            </div>
            <p className="text-[#a0a0c2]">Loading tracks...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrackList;