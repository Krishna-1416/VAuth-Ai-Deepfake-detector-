export const getApiUrl = () => {
  // If we're on localhost, use the Vite proxy (/api)
  // If we're on Render/Vercel, we can also use /api (rewritten by vercel.json)
  return import.meta.env.VITE_API_URL || '/api';
};

export const getWsUrl = () => {
  // If we're on localhost, use local WS
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'ws://localhost:8000';
  }
  
  // Otherwise, use the production Render URL (wss for security)
  return 'wss://vauth-ai-deepfake-detector.onrender.com';
};
