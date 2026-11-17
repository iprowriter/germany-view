/**
 * Port the backend listens on when PORT isn't set. Must match the frontend's default API_URL
 * (src/config/api.ts) so `npm run startDev` works without any .env file (tests/config.test.ts
 * checks this). Not 5000: macOS AirPlay answers every request on it with 403. Not 5001 either:
 * that's Berlin Visualized, so both apps can run side by side.
 */
export const DEFAULT_PORT = 5002;
