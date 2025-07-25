import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { requestWakeLock } from '../registerSW';

const { FiPlay, FiPause, FiSkipBack, FiSkipForward, FiMusic } = FiIcons;

const MusicPlayer = ({ playlist, isPlaying, setIsPlaying, onBack }) => {
  const [currentTrack, setCurrentTrack] = useState(1);
  const [trackTitle, setTrackTitle] = useState('Loading...');
  const [isWidgetReady, setIsWidgetReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const widgetRef = useRef(null);
  const wakeLockRef = useRef(null);

  // Initialize SoundCloud Widget
  useEffect(() => {
    const loadWidgetAPI = () => {
      if (window.SC && window.SC.Widget) {
        return Promise.resolve();
      }
      
      return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://w.soundcloud.com/player/api.js';
        script.onload = resolve;
        script.onerror = resolve; // Continue even if script fails
        document.body.appendChild(script);
      });
    };

    const initializeWidget = async () => {
      try {
        await loadWidgetAPI();
        
        const iframe = document.getElementById('soundcloud-iframe');
        if (iframe && window.SC && window.SC.Widget) {
          widgetRef.current = window.SC.Widget(iframe);
          
          // Set up event listeners
          widgetRef.current.bind(window.SC.Widget.Events.READY, () => {
            console.log('SoundCloud widget ready');
            setIsWidgetReady(true);
            setIsLoading(false);
            
            // Get initial track info
            widgetRef.current.getCurrentSound((sound) => {
              if (sound) {
                setTrackTitle(sound.title);
              } else {
                setTrackTitle(`${playlist.name} Playlist`);
              }
            });
          });

          widgetRef.current.bind(window.SC.Widget.Events.PLAY, () => {
            console.log('SoundCloud widget playing');
            setIsPlaying(true);
            
            // Get current track info
            widgetRef.current.getCurrentSound((sound) => {
              if (sound) {
                setTrackTitle(sound.title);
              }
            });
            
            // Request wake lock
            requestWakeLock().then(wakeLock => {
              wakeLockRef.current = wakeLock;
            });
          });

          widgetRef.current.bind(window.SC.Widget.Events.PAUSE, () => {
            console.log('SoundCloud widget paused');
            setIsPlaying(false);
            
            // Release wake lock
            if (wakeLockRef.current && !wakeLockRef.current.released) {
              wakeLockRef.current.release();
              wakeLockRef.current = null;
            }
          });

          widgetRef.current.bind(window.SC.Widget.Events.FINISH, () => {
            console.log('Track finished, playing next');
            handleNext();
          });

          widgetRef.current.bind(window.SC.Widget.Events.PLAY_PROGRESS, (data) => {
            // Update track info periodically
            if (data.currentPosition === 0) {
              widgetRef.current.getCurrentSound((sound) => {
                if (sound && sound.title !== trackTitle) {
                  setTrackTitle(sound.title);
                }
              });
            }
          });
        }
      } catch (error) {
        console.error('Error initializing SoundCloud widget:', error);
        setIsLoading(false);
      }
    };

    initializeWidget();

    // Cleanup
    return () => {
      if (wakeLockRef.current && !wakeLockRef.current.released) {
        wakeLockRef.current.release();
        wakeLockRef.current = null;
      }
    };
  }, [playlist.url, playlist.name]);

  // Setup Media Session API
  useEffect(() => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: trackTitle,
        artist: 'Klanginsel',
        album: `${playlist.name} Playlist`,
        artwork: [
          { src: '/icon-96.png', sizes: '96x96', type: 'image/png' },
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
        ]
      });
      
      navigator.mediaSession.setActionHandler('play', handlePlayPause);
      navigator.mediaSession.setActionHandler('pause', handlePlayPause);
      navigator.mediaSession.setActionHandler('previoustrack', handlePrevious);
      navigator.mediaSession.setActionHandler('nexttrack', handleNext);
    }
  }, [trackTitle, playlist.name]);

  const handlePlayPause = () => {
    if (!isWidgetReady || !widgetRef.current) {
      console.log('Widget not ready yet');
      return;
    }

    try {
      if (isPlaying) {
        console.log('Pausing...');
        widgetRef.current.pause();
      } else {
        console.log('Playing...');
        widgetRef.current.play();
      }
    } catch (error) {
      console.error('Error controlling playback:', error);
    }
  };

  const handleNext = () => {
    if (!isWidgetReady || !widgetRef.current) {
      console.log('Widget not ready for next');
      return;
    }

    try {
      widgetRef.current.next();
      setCurrentTrack(prev => prev + 1);
    } catch (error) {
      console.error('Error skipping to next track:', error);
    }
  };

  const handlePrevious = () => {
    if (!isWidgetReady || !widgetRef.current) {
      console.log('Widget not ready for previous');
      return;
    }

    try {
      widgetRef.current.prev();
      setCurrentTrack(prev => Math.max(1, prev - 1));
    } catch (error) {
      console.error('Error skipping to previous track:', error);
    }
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-80px)]">
      {/* SoundCloud iframe */}
      <div style={{ position: 'absolute', top: '-9999px', left: '-9999px' }}>
        <iframe
          id="soundcloud-iframe"
          title="SoundCloud Player"
          width="100%"
          height="300"
          scrolling="no"
          frameBorder="no"
          allow="autoplay"
          src={`https://w.soundcloud.com/player/?url=${playlist.url}&color=%23d4a076&auto_play=false&hide_related=true&show_comments=false&show_user=false&show_reposts=false&show_teaser=false&visual=false`}
        ></iframe>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-center mb-8"
        >
          <div
            className="w-32 h-32 mx-auto mb-6 rounded-full flex items-center justify-center border-4 shadow-lg"
            style={{ backgroundColor: `#1f1f1f`, borderColor: `${playlist.color}80` }}
          >
            <SafeIcon icon={FiMusic} className="text-5xl" style={{ color: playlist.color }} />
          </div>
          <h3 className="text-2xl font-light text-[#e0d6cc] mb-2">
            {playlist.name} Vibes
          </h3>
          <p className="text-[#a09a92] text-sm">
            Track {currentTrack}
          </p>
        </motion.div>

        {/* Loading/Status indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mb-6"
        >
          <div className="flex items-center space-x-2">
            <div
              className={`w-2 h-2 rounded-full ${
                isLoading ? 'animate-pulse' : isPlaying ? 'animate-pulse' : ''
              }`}
              style={{ 
                backgroundColor: isLoading ? '#6b7280' : isPlaying ? playlist.color : '#6b7280' 
              }}
            />
            <span className="text-sm text-[#a09a92]">
              {isLoading ? 'Loading...' : isPlaying ? 'Playing' : 'Paused'}
            </span>
          </div>
        </motion.div>
      </div>

      {/* Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="p-6 border-t border-[#333333]"
      >
        <div className="flex items-center justify-center space-x-6">
          <button
            onClick={handlePrevious}
            disabled={!isWidgetReady}
            className={`p-3 rounded-full transition-colors duration-200 active:scale-95 shadow-md ${
              isWidgetReady 
                ? 'hover:bg-[#333333] text-[#e0d6cc]' 
                : 'text-[#666666] cursor-not-allowed'
            }`}
          >
            <SafeIcon icon={FiSkipBack} className="text-2xl" />
          </button>
          
          <button
            onClick={handlePlayPause}
            disabled={!isWidgetReady}
            className={`p-5 rounded-full transition-all duration-200 shadow-lg ${
              isWidgetReady 
                ? 'hover:scale-105 active:scale-95' 
                : 'opacity-50 cursor-not-allowed'
            }`}
            style={{ backgroundColor: isWidgetReady ? playlist.color : '#666666' }}
          >
            {isLoading ? (
              <div className="w-6 h-6 border-2 border-[#1a1a1a] border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <SafeIcon icon={isPlaying ? FiPause : FiPlay} className="text-3xl text-[#1a1a1a]" />
            )}
          </button>
          
          <button
            onClick={handleNext}
            disabled={!isWidgetReady}
            className={`p-3 rounded-full transition-colors duration-200 active:scale-95 shadow-md ${
              isWidgetReady 
                ? 'hover:bg-[#333333] text-[#e0d6cc]' 
                : 'text-[#666666] cursor-not-allowed'
            }`}
          >
            <SafeIcon icon={FiSkipForward} className="text-2xl" />
          </button>
        </div>

        {/* Track Title Display */}
        <motion.div 
          className="mt-6 text-center px-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          <div className="bg-[#252525] p-4 rounded-lg shadow-md border border-[#333333]">
            <h4 className="text-sm text-[#a09a92] mb-1">Now Playing</h4>
            <p className="text-[#e0d6cc] font-medium text-lg truncate">
              {trackTitle}
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default MusicPlayer;