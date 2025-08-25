import { NextResponse } from "next/server"
import { readFile, stat } from "fs/promises"
import { existsSync } from "fs"
import { API_CONFIG, getResultsFilePath, getBackupFilePath, getLogFilePath } from "@/lib/config"

// Use volume mount for Docker deployment
const RESULTS_DIR = API_CONFIG.DATA.VOLUME_PATH
const RESULTS_FILE = getResultsFilePath()
const BACKUP_FILE = getBackupFilePath()
const LOG_FILE = getLogFilePath()

export async function GET() {
  try {
    const status = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      persistence: {
        dataDirectory: {
          exists: existsSync(RESULTS_DIR),
          path: RESULTS_DIR
        },
        resultsFile: {
          exists: existsSync(RESULTS_FILE),
          path: RESULTS_FILE,
          size: null as number | null,
          lastModified: null as string | null,
          recordCount: 0
        },
        backupFile: {
          exists: existsSync(BACKUP_FILE),
          path: BACKUP_FILE,
          size: null as number | null,
          lastModified: null as string | null
        },
        logFile: {
          exists: existsSync(LOG_FILE),
          path: LOG_FILE,
          size: null as number | null,
          lastModified: null as string | null
        }
      }
    }

    // Get results file details
    if (status.persistence.resultsFile.exists) {
      try {
        const stats = await stat(RESULTS_FILE)
        status.persistence.resultsFile.size = stats.size
        status.persistence.resultsFile.lastModified = stats.mtime.toISOString()
        
        // Count records
        const data = await readFile(RESULTS_FILE, "utf8")
        const results = JSON.parse(data)
        if (Array.isArray(results)) {
          status.persistence.resultsFile.recordCount = results.length
        }
      } catch (error) {
        console.error("Error reading results file:", error)
      }
    }

    // Get backup file details
    if (status.persistence.backupFile.exists) {
      try {
        const stats = await stat(BACKUP_FILE)
        status.persistence.backupFile.size = stats.size
        status.persistence.backupFile.lastModified = stats.mtime.toISOString()
      } catch (error) {
        console.error("Error reading backup file:", error)
      }
    }

    // Get log file details
    if (status.persistence.logFile.exists) {
      try {
        const stats = await stat(LOG_FILE)
        status.persistence.logFile.size = stats.size
        status.persistence.logFile.lastModified = stats.mtime.toISOString()
      } catch (error) {
        console.error("Error reading log file:", error)
      }
    }

    return NextResponse.json(status)
  } catch (error) {
    console.error("Error getting status:", error)
    return NextResponse.json({
      status: "error",
      timestamp: new Date().toISOString(),
      error: "Failed to get system status"
    }, { status: 500 })
  }
}
