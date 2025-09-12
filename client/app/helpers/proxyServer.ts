// Primary development URL - supports both localhost and ngrok
export const NGROK_BASE_URL: string =
  process.env.EXPO_PUBLIC_API_BASE_URL || `http://localhost:8080`;

// Fallback ngrok URL with HTTP (for when ngrok is needed)
export const NGROK_BASE_URL_FALLBACK: string =
  process.env.EXPO_PUBLIC_API_BASE_URL_FALLBACK || `http://localhost:8080`;

// Function to get the appropriate URL based on environment
export const getSocketURL = (): string => {
  // Use environment variable if available, otherwise force HTTP for ngrok to avoid SSL issues
  if (process.env.EXPO_PUBLIC_SOCKET_URL) {
    return process.env.EXPO_PUBLIC_SOCKET_URL;
  }
  const USE_HTTP_FOR_NGROK: boolean = true; // Set to false to try HTTPS first
  return USE_HTTP_FOR_NGROK ? NGROK_BASE_URL_FALLBACK : NGROK_BASE_URL;
};

// For development with ngrok, use HTTP to avoid SSL issues
export const SOCKET_URL: string = getSocketURL();

// Helper function to create headers for API requests (includes ngrok bypass)
export const createApiHeaders = (
  additionalHeaders: Record<string, string> = {}
): Record<string, string> => {
  return {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true",
    ...additionalHeaders,
  };
};
