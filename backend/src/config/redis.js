// Fast in-memory cache layer replacing heavy external Redis dependency
const memoryStore = new Map();
const expiryStore = new Map();

const redis = {
  setex: async (key, seconds, value) => {
    memoryStore.set(key, value);
    if (seconds > 0) {
      expiryStore.set(key, Date.now() + (seconds * 1000));
    }
    return 'OK';
  },
  get: async (key) => {
    if (!memoryStore.has(key)) return null;
    const expiry = expiryStore.get(key);
    if (expiry && Date.now() > expiry) {
      memoryStore.delete(key);
      expiryStore.delete(key);
      return null;
    }
    return memoryStore.get(key);
  },
  del: async (key) => {
    memoryStore.delete(key);
    expiryStore.delete(key);
    return 1;
  },
  quit: async () => 'OK',
  on: () => {}
};

module.exports = redis;
