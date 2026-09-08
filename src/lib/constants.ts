const envApiUrl =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
export const API_BASE_URL = (
  envApiUrl.endsWith("/api") ? envApiUrl : `${envApiUrl}/api`
).replace(/\/$/, "");
export const WS_BASE_URL =
  process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000";
