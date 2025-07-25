import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PlaylistSelector from './components/PlaylistSelector';
import MusicPlayer from './components/MusicPlayer';
import Header from './components/Header';
import './App.css';

const playlists = {
  chillout: {
    name: 'Chillout',
    url: 'https://soundcloud.com/stephan-herzhauser/sets/chillout',
    color: '#d4a076'
  },
  reggae: {
    name: 'Reggae',
    url: 'https://soundcloud.com/stephan-herzhauser/sets/reggae',
    color: '#d4a076'
  }
};

function App() {
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [trackList, setTrackList] = useState([]);
  const [isShuffleEnabled, setIsShuffleEnabled] = useState(() => {
    // Load shuffle state from localStorage if available
    const savedShuffle = localStorage.getItem('klanginsel_shuffle');
    return savedShuffle ? JSON.parse(savedShuffle) : false;
  });

  // Save shuffle state to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('klanginsel_shuffle', JSON.stringify(isShuffleEnabled));
  }, [isShuffleEnabled]);

  const handlePlaylistSelect = (playlistKey) => {
    setSelectedPlaylist(playlistKey);
  };

  const handleBack = () => {
    setSelectedPlaylist(null);
    setIsPlaying(false);
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white overflow-hidden">
      <Header 
        showBackButton={!!selectedPlaylist} 
        onBack={handleBack} 
        showLogo={true} 
        isShuffleEnabled={isShuffleEnabled}
        setIsShuffleEnabled={setIsShuffleEnabled}
      />

      {!selectedPlaylist ? (
        <motion.div
          key="selector"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          <PlaylistSelector playlists={playlists} onSelect={handlePlaylistSelect} />
        </motion.div>
      ) : (
        <motion.div
          key="player"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          <MusicPlayer
            playlist={playlists[selectedPlaylist]}
            isPlaying={isPlaying}
            setIsPlaying={setIsPlaying}
            onBack={handleBack}
            setTrackList={setTrackList}
            trackList={trackList}
            isShuffleEnabled={isShuffleEnabled}
          />
        </motion.div>
      )}
    </div>
  );
}

export default App;