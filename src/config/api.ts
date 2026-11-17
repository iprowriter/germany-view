// Base URL for the backend API. Override with VITE_API_URL in .env.
// The default must match DEFAULT_PORT in server/config/server.ts (server/tests/config.test.ts checks it).
export const API_URL: string = import.meta.env.VITE_API_URL ?? "http://localhost:5002";
