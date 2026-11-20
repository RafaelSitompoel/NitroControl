use crate::error::{NitroError, Result};
use rusqlite::Connection;

pub fn create_tables(conn: &Connection) -> Result<()> {
    conn.execute_batch(
        "
        CREATE TABLE IF NOT EXISTS settings (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            data_json TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS profiles (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            is_active INTEGER NOT NULL DEFAULT 0,
            is_builtin INTEGER NOT NULL DEFAULT 0,
            power_mode TEXT NOT NULL,
            fan_mode TEXT NOT NULL,
            fan_curve_json TEXT,
            coolboost_enabled INTEGER NOT NULL DEFAULT 0,
            refresh_rate_ms INTEGER NOT NULL DEFAULT 1000,
            description TEXT,
            updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS sensor_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            cpu_usage REAL NOT NULL,
            cpu_temp REAL,
            cpu_freq INTEGER NOT NULL,
            gpu_usage REAL,
            gpu_temp REAL,
            gpu_freq INTEGER,
            gpu_vram_used INTEGER,
            ram_usage REAL NOT NULL,
            ram_used INTEGER NOT NULL,
            fan1_rpm INTEGER,
            fan2_rpm INTEGER,
            battery_percent REAL
        );

        CREATE INDEX IF NOT EXISTS idx_sensor_history_timestamp 
        ON sensor_history (timestamp);

        CREATE TABLE IF NOT EXISTS application_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            level TEXT NOT NULL,
            message TEXT NOT NULL,
            context TEXT
        );

        CREATE INDEX IF NOT EXISTS idx_application_logs_timestamp 
        ON application_logs (timestamp);

        CREATE TABLE IF NOT EXISTS hardware_capabilities (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            data_json TEXT NOT NULL,
            detected_at TEXT NOT NULL
        );
        ",
    )
    .map_err(|e| NitroError::DatabaseError(format!("Failed to create database schema: {}", e)))?;

    Ok(())
}
