// ==========================================
// Phemex API Configuration
// ==========================================

export const PHEMEX_API = {
  BASE_URL: "https://api.phemex.com",
  ENDPOINTS: {
    POSITIONS: "/g-accounts/positions",
  },
  CURRENCY: {
    USDT: "USDT",
    BTC: "BTC",
  },
} as const;

// ==========================================
// Phemex Web URLs
// ==========================================

export const PHEMEX_WEB = {
  BASE_URL: "https://phemex.com",
  TRADE: (symbol: string): string => `https://phemex.com/trade/${symbol}`,
  API_MANAGEMENT: "https://phemex.com/es/account/api-management",
} as const;

// ==========================================
// API Request Configuration
// ==========================================

export const API_CONFIG = {
  EXPIRY_SECONDS: 60,
  HEADERS: {
    ACCESS_TOKEN: "x-phemex-access-token",
    REQUEST_EXPIRY: "x-phemex-request-expiry",
    REQUEST_SIGNATURE: "x-phemex-request-signature",
  },
} as const;

// ==========================================
// Position Side Labels
// ==========================================

export const POSITION_SIDE = {
  LONG: "Buy",
  SHORT: "Sell",
  NONE: "None",
} as const;

// ==========================================
// Storage Keys
// ==========================================

export const STORAGE_KEYS = {
  PHEMEX_API_KEY: "phemexApiKey",
} as const;
