export const AUTH_PROVIDER_ID = "csh";
export const REFRESH_TOKEN_ERROR = "RefreshAccessTokenError";

export const DEFAULT_NO_ACCESS = "You do not have access to this door.";

// Door-specific messages, keyed by door name
export const DOOR_ACCESS_DENIED_MESSAGES: Record<string, string> = {
  "Project Room": "Have you completed the required safety seminar?",
  "Server Room": "Server Room access requires being an active RTP.",
};
