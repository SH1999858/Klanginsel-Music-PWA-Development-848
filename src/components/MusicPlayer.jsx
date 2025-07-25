import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { requestWakeLock } from '../registerSW';
import TrackList from './TrackList';

const { FiPlay, FiPause, FiSkipBack, FiSkipForward, FiMusic, FiList } = FiIcons;

const MusicPlayer = ({ playlist, isPlaying, setIsPlaying, onBack, setTrackList, trackList }) => {
  const [currentTrack, setCurrentTrack] = useState(1);
  const [trackTitle, setTrackTitle] = useState('Loading...');
  const [isWidgetReady, setIsWidgetReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showTrackList, setShowTrackList] = useState(false);
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

            // Get all tracks in the playlist
            widgetRef.current.getSounds((sounds) => {
              if (sounds && Array.isArray(sounds)) {
                const tracks = sounds.map((sound, index) => ({
                  id: sound.id,
                  title: sound.title,
                  index: index + 1,
                  duration: sound.duration,
                  artist: sound.user ? sound.user.username : 'Unknown Artist'
                }));
                setTrackList(tracks);
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
                
                // Update current track index
                widgetRef.current.getSounds((sounds) => {
                  const currentIndex = sounds.findIndex(s => s.id === sound.id);
                  if (currentIndex !== -1) {
                    setCurrentTrack(currentIndex + 1);
                  }
                });
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
  }, [playlist.url, playlist.name, setTrackList]);

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
      setCurrentTrack(prev => Math.min(prev + 1, trackList.length));
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

  const handleTrackSelect = (index) => {
    if (!isWidgetReady || !widgetRef.current) {
      return;
    }

    try {
      widgetRef.current.skip(index);
      setCurrentTrack(index + 1);
      setShowTrackList(false);
    } catch (error) {
      console.error('Error selecting track:', error);
    }
  };

  const toggleTrackList = () => {
    setShowTrackList(prev => !prev);
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
      {showTrackList ? (
        <div className="flex-1 flex flex-col">
          <TrackList 
            tracks={trackList} 
            currentTrack={currentTrack - 1} 
            onSelect={handleTrackSelect}
            onClose={toggleTrackList}
            playlistName={playlist.name}
            themeColor={playlist.color}
          />
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="text-center mb-8">
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
              Track {currentTrack} of {trackList.length || '?'}
            </p>
          </div>

          {/* Loading/Status indicator */}
          <div className="mb-6">
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
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="p-6 border-t border-[#333333]">
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

        {/* Track Title and Tracklist Button */}
        <div className="mt-6 text-center px-4">
          <div className="bg-[#252525] p-4 rounded-lg shadow-md border border-[#333333]">
            <div className="flex justify-between items-center mb-1">
              <h4 className="text-sm text-[#a09a92]">Now Playing</h4>
              <button 
                onClick={toggleTrackList}
                className="text-[#a09a92] hover:text-[#e0d6cc] p-1 rounded-full transition-colors duration-200"
                disabled={!isWidgetReady || trackList.length === 0}
              >
                <SafeIcon icon={FiList} className="text-lg" />
              </button>
            </div>
            <p className="text-[#e0d6cc] font-medium text-lg truncate">
              {trackTitle}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MusicPlayer;