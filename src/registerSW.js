// Register the service worker for background audio playback
export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('ServiceWorker registered with scope:', registration.scope);
          
          // Setup periodic messages to keep service worker alive
          setInterval(() => {
            if (registration.active) {
              registration.active.postMessage({type: 'KEEP_ALIVE'});
            }
          }, 25000); // Send message every 25 seconds
        })
        .catch(error => {
          console.error('ServiceWorker registration failed:', error);
        });
    });
  }
}

// Request wake lock to keep CPU active when screen is off
export async function requestWakeLock() {
  if ('wakeLock' in navigator) {
    try {
      const wakeLock = await navigator.wakeLock.request('screen');
      console.log('Wake Lock is active');
      
      // Release wake lock when page becomes hidden
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && wakeLock.released) {
          requestWakeLock(); // Re-acquire when page becomes visible again
        }
      });
      
      return wakeLock;
    } catch (err) {
      console.error(`Wake Lock error: ${err.name}, ${err.message}`);
      return null;
    }
  } else {
    console.warn('Wake Lock API not supported in this browser');
    return null;
  }
}