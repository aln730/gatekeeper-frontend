export const AUTH_PROVIDER_ID = "csh";
export const REFRESH_TOKEN_ERROR = "RefreshAccessTokenError";

// Door-specific 403 messages, keyed by door name
export const DOOR_ACCESS_DENIED_MESSAGES: Record<string, string> = {
  "Project Room": "Access denied. Have you completed the required safety seminar?",
  "Server Room": "Access denied. Server Room access requires being an active RTP.",
};
