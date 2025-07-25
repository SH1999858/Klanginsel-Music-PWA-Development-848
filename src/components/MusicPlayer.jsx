import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { requestWakeLock } from '../registerSW';
import TrackList from './TrackList';

const { FiPlay, FiPause, FiSkipBack, FiSkipForward, FiMusic, FiList, FiShuffle } = FiIcons;

const MusicPlayer = ({ playlist, isPlaying, setIsPlaying, onBack, setTrackList, trackList, isShuffleEnabled }) => {
  const [currentTrack, setCurrentTrack] = useState(1);
  const [trackTitle, setTrackTitle] = useState('Loading...');
  const [isWidgetReady, setIsWidgetReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showTrackList, setShowTrackList] = useState(false);
  const [shuffleHistory, setShuffleHistory] = useState([]);
  const [currentShuffleIndex, setCurrentShuffleIndex] = useState(0);
  const [processedTracks, setProcessedTracks] = useState([]);
  const widgetRef = useRef(null);
  const wakeLockRef = useRef(null);

  // Generate shuffle order for tracks
  const generateShuffleOrder = (trackCount) => {
    const indices = Array.from({ length: trackCount }, (_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    return indices;
  };

  // Get next track index based on shuffle mode
  const getNextTrackIndex = (currentIndex, trackCount) => {
    if (!isShuffleEnabled) {
      return (currentIndex + 1) % trackCount;
    }

    if (shuffleHistory.length === 0 || shuffleHistory.length !== trackCount) {
      const newOrder = generateShuffleOrder(trackCount);
      setShuffleHistory(newOrder);
      setCurrentShuffleIndex(0);
      return newOrder[0];
    }

    const nextIndex = (currentShuffleIndex + 1) % shuffleHistory.length;
    setCurrentShuffleIndex(nextIndex);
    return shuffleHistory[nextIndex];
  };

  // Get previous track index based on shuffle mode
  const getPreviousTrackIndex = (currentIndex, trackCount) => {
    if (!isShuffleEnabled) {
      return currentIndex === 0 ? trackCount - 1 : currentIndex - 1;
    }

    if (shuffleHistory.length === 0 || shuffleHistory.length !== trackCount) {
      const newOrder = generateShuffleOrder(trackCount);
      setShuffleHistory(newOrder);
      setCurrentShuffleIndex(0);
      return newOrder[0];
    }

    const prevIndex = currentShuffleIndex === 0 ? shuffleHistory.length - 1 : currentShuffleIndex - 1;
    setCurrentShuffleIndex(prevIndex);
    return shuffleHistory[prevIndex];
  };

  // Enhanced track processing with better fallback handling
  const processTracksWithFallback = (sounds) => {
    if (!sounds || !Array.isArray(sounds) || sounds.length === 0) {
      console.log('No sounds data available');
      return [];
    }

    console.log('Processing tracks:', sounds.length, 'sounds');

    // Create tracks with enhanced fallback strategy
    const tracks = sounds.map((sound, index) => {
      let title = `Track ${index + 1}`;
      let artist = `${playlist.name} Artist`;
      
      // Extract title and artist information
      if (sound && typeof sound === 'object') {
        // Try to get title
        if (sound.title && typeof sound.title === 'string' && sound.title.trim()) {
          title = sound.title.trim();
        }
        
        // Try to get artist from various sources
        if (sound.user) {
          if (sound.user.username && typeof sound.user.username === 'string' && sound.user.username.trim()) {
            artist = sound.user.username.trim();
          } else if (sound.user.full_name && typeof sound.user.full_name === 'string' && sound.user.full_name.trim()) {
            artist = sound.user.full_name.trim();
          } else if (sound.user.permalink && typeof sound.user.permalink === 'string' && sound.user.permalink.trim()) {
            artist = sound.user.permalink.replace(/[-_]/g, ' ').trim();
          }
        }
        
        // If no artist found and title contains " - ", try to extract artist from title
        if (artist === `${playlist.name} Artist` && title.includes(' - ')) {
          const parts = title.split(' - ');
          if (parts.length >= 2 && parts[0].trim()) {
            artist = parts[0].trim();
            title = parts.slice(1).join(' - ').trim() || title;
          }
        }
      }

      // Clean up title if it starts with artist name
      if (artist !== `${playlist.name} Artist` && title.toLowerCase().startsWith(artist.toLowerCase())) {
        const cleanedTitle = title.substring(artist.length).replace(/^[\s\-–—]+/, '').trim();
        if (cleanedTitle) {
          title = cleanedTitle;
        }
      }

      const track = {
        id: sound && sound.id ? sound.id : `track-${index}`,
        title: title,
        artist: artist,
        index: index + 1,
        duration: sound && sound.duration ? sound.duration : 0,
        originalTitle: sound && sound.title ? sound.title : title,
        user: sound && sound.user ? sound.user : {},
        description: sound && sound.description ? sound.description : ''
      };

      console.log(`Track ${index + 1}:`, {
        title: track.title,
        artist: track.artist,
        originalTitle: track.originalTitle,
        hasSound: !!sound,
        soundId: sound ? sound.id : 'none'
      });

      return track;
    });

    return tracks;
  };

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
        script.onerror = resolve;
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

            // Get all tracks in the playlist
            widgetRef.current.getSounds((sounds) => {
              console.log('Raw sounds received:', sounds);
              
              if (sounds && Array.isArray(sounds) && sounds.length > 0) {
                const tracks = processTracksWithFallback(sounds);
                console.log('Final processed tracks:', tracks);
                
                setProcessedTracks(tracks);
                setTrackList(tracks);

                // Initialize shuffle order if enabled
                if (isShuffleEnabled) {
                  const shuffleOrder = generateShuffleOrder(tracks.length);
                  setShuffleHistory(shuffleOrder);
                  setCurrentShuffleIndex(0);
                  const firstTrack = shuffleOrder[0];
                  
                  if (firstTrack < tracks.length) {
                    widgetRef.current.skip(firstTrack);
                    setCurrentTrack(firstTrack + 1);
                    setTrackTitle(tracks[firstTrack].title);
                  }
                } else {
                  // Get current track info for normal mode
                  widgetRef.current.getCurrentSound((sound) => {
                    if (sound) {
                      const currentIndex = sounds.findIndex(s => s.id === sound.id);
                      if (currentIndex !== -1 && tracks[currentIndex]) {
                        setTrackTitle(tracks[currentIndex].title);
                        setCurrentTrack(currentIndex + 1);
                      } else {
                        setTrackTitle(tracks[0].title);
                        setCurrentTrack(1);
                      }
                    } else {
                      setTrackTitle(tracks[0].title);
                      setCurrentTrack(1);
                    }
                  });
                }
                setIsLoading(false);
              } else {
                console.log('No valid sounds data, creating fallback tracks');
                // Create fallback tracks if no sounds data
                const fallbackTracks = Array.from({ length: 10 }, (_, index) => ({
                  id: `fallback-${index}`,
                  title: `${playlist.name} Track ${index + 1}`,
                  artist: `${playlist.name} Artist`,
                  index: index + 1,
                  duration: 0,
                  originalTitle: `${playlist.name} Track ${index + 1}`,
                  user: {},
                  description: ''
                }));
                
                setProcessedTracks(fallbackTracks);
                setTrackList(fallbackTracks);
                setTrackTitle(fallbackTracks[0].title);
                setCurrentTrack(1);
                setIsLoading(false);
              }
            });
          });

          widgetRef.current.bind(window.SC.Widget.Events.PLAY, () => {
            console.log('SoundCloud widget playing');
            setIsPlaying(true);
            
            // Get current track info
            widgetRef.current.getCurrentSound((sound) => {
              if (sound && processedTracks.length > 0) {
                const currentIndex = processedTracks.findIndex(track => track.id === sound.id);
                
                if (currentIndex !== -1) {
                  setCurrentTrack(currentIndex + 1);
                  setTrackTitle(processedTracks[currentIndex].title);
                  
                  // Update shuffle index if in shuffle mode
                  if (isShuffleEnabled && shuffleHistory.length > 0) {
                    const shuffleIndex = shuffleHistory.indexOf(currentIndex);
                    if (shuffleIndex !== -1) {
                      setCurrentShuffleIndex(shuffleIndex);
                    }
                  }
                }
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
            if (data.currentPosition === 0) {
              widgetRef.current.getCurrentSound((sound) => {
                if (sound && processedTracks.length > 0) {
                  const currentIndex = processedTracks.findIndex(track => track.id === sound.id);
                  if (currentIndex !== -1) {
                    setTrackTitle(processedTracks[currentIndex].title);
                  }
                }
              });
            }
          });

          widgetRef.current.bind(window.SC.Widget.Events.ERROR, () => {
            console.error('SoundCloud widget error');
            setIsLoading(false);
            setTrackTitle(`${playlist.name} Playlist`);
          });
        } else {
          console.error('SoundCloud widget not available');
          setIsLoading(false);
          setTrackTitle(`${playlist.name} Playlist`);
        }
      } catch (error) {
        console.error('Error initializing SoundCloud widget:', error);
        setIsLoading(false);
        setTrackTitle(`${playlist.name} Playlist`);
        setCurrentTrack(1);
      }
    };

    // Reset state when playlist changes
    setCurrentTrack(1);
    setTrackTitle('Loading...');
    setIsWidgetReady(false);
    setIsLoading(true);
    setShuffleHistory([]);
    setCurrentShuffleIndex(0);
    setProcessedTracks([]);

    initializeWidget();

    return () => {
      if (wakeLockRef.current && !wakeLockRef.current.released) {
        wakeLockRef.current.release();
        wakeLockRef.current = null;
      }
    };
  }, [playlist.url, playlist.name, setTrackList, isShuffleEnabled]);

  // Update shuffle order when shuffle mode changes
  useEffect(() => {
    if (isWidgetReady && widgetRef.current && processedTracks.length > 0) {
      if (isShuffleEnabled) {
        const shuffleOrder = generateShuffleOrder(processedTracks.length);
        setShuffleHistory(shuffleOrder);
        setCurrentShuffleIndex(0);
        const firstTrack = shuffleOrder[0];
        
        if (!isLoading && firstTrack < processedTracks.length) {
          try {
            widgetRef.current.skip(firstTrack);
            setCurrentTrack(firstTrack + 1);
            setTrackTitle(processedTracks[firstTrack].title);
          } catch (error) {
            console.error('Error setting first shuffle track:', error);
          }
        }
        console.log('Shuffle mode enabled, new order:', shuffleOrder);
      } else {
        setShuffleHistory([]);
        setCurrentShuffleIndex(0);
        console.log('Shuffle mode disabled');
      }
    }
  }, [isShuffleEnabled, isWidgetReady, processedTracks.length, isLoading]);

  // Setup Media Session API
  useEffect(() => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: trackTitle || `${playlist.name} Playlist`,
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

    if (processedTracks.length === 0) {
      console.log('No tracks available, cannot skip');
      return;
    }

    try {
      const currentIndex = currentTrack - 1;
      const nextIndex = getNextTrackIndex(currentIndex, processedTracks.length);
      console.log('Next track:', nextIndex + 1, 'of', processedTracks.length);
      
      widgetRef.current.skip(nextIndex);
      setCurrentTrack(nextIndex + 1);
      
      if (processedTracks[nextIndex]) {
        setTrackTitle(processedTracks[nextIndex].title);
      } else {
        setTrackTitle(`${playlist.name} Playlist`);
      }
    } catch (error) {
      console.error('Error skipping to next track:', error);
      try {
        widgetRef.current.skip(0);
        setCurrentTrack(1);
        if (processedTracks[0]) {
          setTrackTitle(processedTracks[0].title);
        } else {
          setTrackTitle(`${playlist.name} Playlist`);
        }
      } catch (e) {
        console.error('Error in fallback skip:', e);
      }
    }
  };

  const handlePrevious = () => {
    if (!isWidgetReady || !widgetRef.current) {
      console.log('Widget not ready for previous');
      return;
    }

    if (processedTracks.length === 0) {
      console.log('No tracks available, cannot go to previous');
      return;
    }

    try {
      const currentIndex = currentTrack - 1;
      const prevIndex = getPreviousTrackIndex(currentIndex, processedTracks.length);
      console.log('Previous track:', prevIndex + 1, 'of', processedTracks.length);
      
      widgetRef.current.skip(prevIndex);
      setCurrentTrack(prevIndex + 1);
      
      if (processedTracks[prevIndex]) {
        setTrackTitle(processedTracks[prevIndex].title);
      } else {
        setTrackTitle(`${playlist.name} Playlist`);
      }
    } catch (error) {
      console.error('Error skipping to previous track:', error);
      try {
        widgetRef.current.skip(0);
        setCurrentTrack(1);
        if (processedTracks[0]) {
          setTrackTitle(processedTracks[0].title);
        } else {
          setTrackTitle(`${playlist.name} Playlist`);
        }
      } catch (e) {
        console.error('Error in fallback skip:', e);
      }
    }
  };

  const handleTrackSelect = (index) => {
    if (!isWidgetReady || !widgetRef.current) {
      return;
    }

    if (!processedTracks[index]) {
      console.error('Invalid track index:', index);
      return;
    }

    try {
      widgetRef.current.skip(index);
      setCurrentTrack(index + 1);
      setTrackTitle(processedTracks[index].title);
      setShowTrackList(false);

      if (isShuffleEnabled) {
        const currentPos = shuffleHistory.indexOf(index);
        if (currentPos !== -1) {
          setCurrentShuffleIndex(currentPos);
        } else {
          const newHistory = [...shuffleHistory];
          newHistory[currentShuffleIndex] = index;
          setShuffleHistory(newHistory);
        }
      }
    } catch (error) {
      console.error('Error selecting track:', error);
    }
  };

  const toggleTrackList = () => {
    setShowTrackList(prev => !prev);
  };

  const displayTitle = trackTitle || `${playlist.name} Playlist`;
  const displayTrackNumber = Math.max(1, Math.min(currentTrack, processedTracks.length || 1));

  return (
    <div className="flex flex-col min-h-[calc(100vh-80px)]">
      <div style={{ position: 'absolute', top: '-9999px', left: '-9999px' }}>
        <iframe
          id="soundcloud-iframe"
          title="SoundCloud Player"
          width="100%"
          height="300"
          scrolling="no"
          frameBorder="no"
          allow="autoplay"
          src={`https://w.soundcloud.com/player/?url=${playlist.url}&color=%23366dab&auto_play=false&hide_related=true&show_comments=false&show_user=false&show_reposts=false&show_teaser=false&visual=false`}
        ></iframe>
      </div>

      {showTrackList ? (
        <div className="flex-1 flex flex-col">
          <TrackList
            tracks={processedTracks}
            currentTrack={currentTrack - 1}
            onSelect={handleTrackSelect}
            onClose={toggleTrackList}
            playlistName={playlist.name}
            themeColor={playlist.color}
          />
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-6 bg-gradient-to-b from-[#1a1a2e] to-[#1a1a1a]">
          <div className="text-center mb-8">
            <div
              className="w-32 h-32 mx-auto mb-6 rounded-full flex items-center justify-center border-4 shadow-lg"
              style={{
                backgroundColor: `#1f1f2f`,
                borderColor: `${playlist.color}80`
              }}
            >
              <SafeIcon
                icon={FiMusic}
                className="text-5xl"
                style={{ color: playlist.color }}
              />
            </div>

            <h3 className="text-2xl font-light text-[#e0d6cc] mb-2">
              {playlist.name} Vibes
            </h3>
            <p className="text-[#a09a92] text-sm">
              Track {displayTrackNumber} of {processedTracks.length || '...'}
            </p>

            {isShuffleEnabled && (
              <div className="mt-2 flex items-center justify-center">
                <SafeIcon icon={FiShuffle} className="text-sm text-[#366dab] mr-1" />
                <span className="text-xs text-[#a09a92]">Zufallswiedergabe</span>
              </div>
            )}
          </div>

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

      <div className="p-6 border-t border-[#2a2a3a] bg-[#1a1a2e]">
        <div className="flex items-center justify-center space-x-6">
          <button
            onClick={handlePrevious}
            disabled={!isWidgetReady || processedTracks.length === 0}
            className={`p-3 rounded-full transition-colors duration-200 active:scale-95 shadow-md ${
              isWidgetReady && processedTracks.length > 0
                ? 'hover:bg-[#2a2a4a] text-[#e0d6cc]'
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
            style={{ backgroundColor: isWidgetReady ? '#366dab' : '#666666' }}
          >
            {isLoading ? (
              <div className="w-6 h-6 border-2 border-[#1a1a1a] border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <SafeIcon
                icon={isPlaying ? FiPause : FiPlay}
                className="text-3xl text-[#1a1a1a]"
              />
            )}
          </button>

          <button
            onClick={handleNext}
            disabled={!isWidgetReady || processedTracks.length === 0}
            className={`p-3 rounded-full transition-colors duration-200 active:scale-95 shadow-md ${
              isWidgetReady && processedTracks.length > 0
                ? 'hover:bg-[#2a2a4a] text-[#e0d6cc]'
                : 'text-[#666666] cursor-not-allowed'
            }`}
          >
            <SafeIcon icon={FiSkipForward} className="text-2xl" />
          </button>
        </div>

        <div className="mt-6 text-center px-4">
          <div className="bg-[#252535] p-4 rounded-lg shadow-md border border-[#333345]">
            <div className="flex justify-between items-center mb-1">
              <h4 className="text-sm text-[#a0a0c2]">Now Playing</h4>
              <button
                onClick={toggleTrackList}
                className="text-[#a0a0c2] hover:text-[#e0d6cc] p-1 rounded-full transition-colors duration-200"
                disabled={!isWidgetReady || processedTracks.length === 0}
              >
                <SafeIcon icon={FiList} className="text-lg" />
              </button>
            </div>
            <p className="text-[#e0d6cc] font-medium text-lg truncate">
              {displayTitle}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MusicPlayer;