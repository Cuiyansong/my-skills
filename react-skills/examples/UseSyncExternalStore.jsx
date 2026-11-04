import { useSyncExternalStore } from 'react';

function subscribe(callback) {
  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);
  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
  };
}

function getSnapshot() {
  return navigator.onLine;
}

function getServerSnapshot() {
  return true;
}

function NetworkStatus() {
  const isOnline = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return (
    <div>
      <h3>useSyncExternalStore Example</h3>
      <p>
        Status: <strong>{isOnline ? 'Online' : 'Offline'}</strong>
      </p>
      <p style={{ color: isOnline ? 'green' : 'red' }}>
        {isOnline ? 'You are connected to the internet' : 'You are offline'}
      </p>
    </div>
  );
}

function MediaQuery({ query }) {
  const subscribeMediaQuery = (callback) => {
    const mediaQuery = window.matchMedia(query);
    mediaQuery.addEventListener('change', callback);
    return () => mediaQuery.removeEventListener('change', callback);
  };

  const getMediaSnapshot = () => {
    return window.matchMedia(query).matches;
  };

  const getMediaServerSnapshot = () => {
    return false;
  };

  const matches = useSyncExternalStore(
    subscribeMediaQuery,
    getMediaSnapshot,
    getMediaServerSnapshot
  );

  return (
    <div>
      <p>
        Media query "{query}": <strong>{matches ? 'Matches' : 'Does not match'}</strong>
      </p>
    </div>
  );
}

function SyncExternalStoreExample() {
  return (
    <div>
      <NetworkStatus />
      <MediaQuery query="(min-width: 768px)" />
    </div>
  );
}

export default SyncExternalStoreExample;
