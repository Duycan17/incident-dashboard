// API Configuration
// Centralized configuration for all API endpoints

export const API_CONFIG = {
  // External Services
  UPSTREAM_SERVICES: {
    REVIEWS: process.env.REVIEWS_UPSTREAM_URL || "http://128.199.96.56:8005/reviews",
    ML_EXPLAIN: process.env.ML_EXPLAIN_SERVICE_URL || "http://202.44.47.12:5000/explain",
  },
  
  // Data Storage
  DATA: {
    VOLUME_PATH: process.env.DATA_VOLUME_PATH || "/app/data",
    RESULTS_FILE: "verification_results.json",
    BACKUP_FILE: "verification_results_backup.json", 
    LOG_FILE: "verification_log.txt",
  },
  
  // API Settings
  SETTINGS: {
    DEFAULT_PAGE_SIZE: 5,
    CACHE_CONTROL: "no-store",
    REQUEST_TIMEOUT: 10000, // 10 seconds
  },
  
  // ML Service Configuration
  ML: {
    DEFAULT_MAX_LENGTH: 128,
    DEFAULT_TOP_K: 5,
    DEFAULT_RETURN_ALL: false,
  },
  
  // Metrics Configuration
  METRICS: {
    CONFIDENCE_THRESHOLDS: {
      HIGH: 0.8,
      MEDIUM: 0.5,
    },
    TIME_RANGES: {
      LAST_24H: 24 * 60 * 60 * 1000,
      LAST_7_DAYS: 7 * 24 * 60 * 60 * 1000,
      LAST_30_DAYS: 30 * 24 * 60 * 60 * 1000,
    },
  },
} as const

// Helper functions to get full paths
export const getDataPath = (filename: string) => {
  const path = require('path')
  return path.join(API_CONFIG.DATA.VOLUME_PATH, filename)
}

export const getResultsFilePath = () => getDataPath(API_CONFIG.DATA.RESULTS_FILE)
export const getBackupFilePath = () => getDataPath(API_CONFIG.DATA.BACKUP_FILE)
export const getLogFilePath = () => getDataPath(API_CONFIG.DATA.LOG_FILE)

// Environment validation
export const validateConfig = () => {
  const warnings: string[] = []
  
  if (!process.env.REVIEWS_UPSTREAM_URL) {
    warnings.push("REVIEWS_UPSTREAM_URL not set, using default")
  }
  
  if (!process.env.ML_EXPLAIN_SERVICE_URL) {
    warnings.push("ML_EXPLAIN_SERVICE_URL not set, using default")
  }
  
  if (!process.env.DATA_VOLUME_PATH) {
    warnings.push("DATA_VOLUME_PATH not set, using default")
  }
  
  if (warnings.length > 0) {
    console.warn("Config warnings:", warnings)
  }
  
  return warnings
}
