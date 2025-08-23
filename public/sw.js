// Minimal Service Worker untuk Logyai
console.log('Service Worker loaded');

// Install event - no caching for now
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  // Skip waiting to activate immediately
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  // Claim all clients
  event.waitUntil(self.clients.claim());
});

// Fetch event - pass through all requests
self.addEventListener('fetch', (event) => {
  // Let all requests pass through to network
  // No caching for now to avoid errors
  return;
});

// Handle message events
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
