use crate::db::Database;
use crate::error::{NitroError, Result};
use crate::types::sensors::TelemetrySnapshot;
use chrono::{Duration, Utc};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct HistoricalDataPoint {
    pub id: i64,
    pub timestamp: String,
    pub cpu_usage: f32,
    pub cpu_temp: Option<f32>,
    pub cpu_freq: u64,
    pub gpu_usage: Option<f32>,
    pub gpu_temp: Option<f32>,
    pub gpu_freq: Option<u64>,
    pub gpu_vram_used: Option<u64>,
    pub ram_usage: f32,
    pub ram_used: u64,
    pub fan1_rpm: Option<u32>,
    pub fan2_rpm: Option<u32>,
    pub battery_percent: Option<f32>,
}

impl Database {
    pub fn record_snapshot(&self, snapshot: &TelemetrySnapshot) -> Result<()> {
        let conn = self.conn();
        let ts = snapshot.timestamp.to_rfc3339();

        let fan1 = snapshot.fans.get(0).and_then(|f| f.current_rpm);
        let fan2 = snapshot.fans.get(1).and_then(|f| f.current_rpm);

        let (gpu_usage, gpu_temp, gpu_freq, gpu_vram_used) = match &snapshot.gpu {
            Some(g) => (g.usage_percent, g.temperature_celsius, g.frequency_mhz, Some(g.memory_used_bytes)),
            None => (None, None, None, None),
        };

        conn.execute(
            "INSERT INTO sensor_history (
                timestamp, cpu_usage, cpu_temp, cpu_freq, 
                gpu_usage, gpu_temp, gpu_freq, gpu_vram_used, 
                ram_usage, ram_used, fan1_rpm, fan2_rpm, battery_percent
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)",
            rusqlite::params![
                ts,
                snapshot.cpu.usage_percent,
                snapshot.cpu.temperature_celsius,
                snapshot.cpu.frequency_mhz as i64,
                gpu_usage,
                gpu_temp,
                gpu_freq.map(|f| f as i64),
                gpu_vram_used.map(|v| v as i64),
                snapshot.ram.usage_percent,
                snapshot.ram.used_bytes as i64,
                fan1.map(|r| r as i64),
                fan2.map(|r| r as i64),
                snapshot.battery.percentage,
            ],
        )
        .map_err(|e| NitroError::DatabaseError(format!("Failed to record telemetry history: {}", e)))?;

        Ok(())
    }

    pub fn query_history(&self, range: &str, limit: Option<usize>) -> Result<Vec<HistoricalDataPoint>> {
        let conn = self.conn();
        let now = Utc::now();
        let cutoff = match range {
            "5m" => now - Duration::minutes(5),
            "30m" => now - Duration::minutes(30),
            "1h" => now - Duration::hours(1),
            "24h" => now - Duration::hours(24),
            _ => now - Duration::minutes(30),
        };
        let cutoff_str = cutoff.to_rfc3339();
        let max_rows = limit.unwrap_or(500);

        let mut stmt = conn
            .prepare(
                "SELECT id, timestamp, cpu_usage, cpu_temp, cpu_freq, 
                        gpu_usage, gpu_temp, gpu_freq, gpu_vram_used, 
                        ram_usage, ram_used, fan1_rpm, fan2_rpm, battery_percent 
                 FROM sensor_history 
                 WHERE timestamp >= ?1 
                 ORDER BY timestamp ASC 
                 LIMIT ?2",
            )
            .map_err(|e| NitroError::DatabaseError(e.to_string()))?;

        let rows = stmt
            .query_map(rusqlite::params![cutoff_str, max_rows as i64], |row| {
                Ok(HistoricalDataPoint {
                    id: row.get(0)?,
                    timestamp: row.get(1)?,
                    cpu_usage: row.get(2)?,
                    cpu_temp: row.get(3)?,
                    cpu_freq: row.get::<_, i64>(4)? as u64,
                    gpu_usage: row.get(5)?,
                    gpu_temp: row.get(6)?,
                    gpu_freq: row.get::<_, Option<i64>>(7)?.map(|f| f as u64),
                    gpu_vram_used: row.get::<_, Option<i64>>(8)?.map(|v| v as u64),
                    ram_usage: row.get(9)?,
                    ram_used: row.get::<_, i64>(10)? as u64,
                    fan1_rpm: row.get::<_, Option<i64>>(11)?.map(|f| f as u32),
                    fan2_rpm: row.get::<_, Option<i64>>(12)?.map(|f| f as u32),
                    battery_percent: row.get(13)?,
                })
            })
            .map_err(|e| NitroError::DatabaseError(e.to_string()))?;

        let mut history = Vec::new();
        for r in rows {
            history.push(r.map_err(|e| NitroError::DatabaseError(e.to_string()))?);
        }

        Ok(history)
    }

    pub fn export_csv(&self, range: &str) -> Result<String> {
        let history = self.query_history(range, Some(5000))?;
        let mut csv = String::from("id,timestamp,cpu_usage,cpu_temp,cpu_freq,gpu_usage,gpu_temp,gpu_freq,gpu_vram_used,ram_usage,ram_used,fan1_rpm,fan2_rpm,battery_percent\n");

        for h in history {
            csv.push_str(&format!(
                "{},{},{:.2},{:.1},{},{:.2},{:.1},{},{},{:.2},{},{},{},{}\n",
                h.id,
                h.timestamp,
                h.cpu_usage,
                h.cpu_temp.unwrap_or(0.0),
                h.cpu_freq,
                h.gpu_usage.unwrap_or(0.0),
                h.gpu_temp.unwrap_or(0.0),
                h.gpu_freq.unwrap_or(0),
                h.gpu_vram_used.unwrap_or(0),
                h.ram_usage,
                h.ram_used,
                h.fan1_rpm.map(|r| r.to_string()).unwrap_or_default(),
                h.fan2_rpm.map(|r| r.to_string()).unwrap_or_default(),
                h.battery_percent.map(|b| format!("{:.1}", b)).unwrap_or_default(),
            ));
        }

        Ok(csv)
    }

    pub fn clear_history(&self) -> Result<()> {
        let conn = self.conn();
        conn.execute("DELETE FROM sensor_history", [])
            .map_err(|e| NitroError::DatabaseError(e.to_string()))?;
        Ok(())
    }

    pub fn prune_old_history(&self, retention_hours: u32) -> Result<usize> {
        let conn = self.conn();
        let cutoff = Utc::now() - Duration::hours(retention_hours as i64);
        let cutoff_str = cutoff.to_rfc3339();

        let count = conn
            .execute("DELETE FROM sensor_history WHERE timestamp < ?1", [cutoff_str])
            .map_err(|e| NitroError::DatabaseError(e.to_string()))?;

        Ok(count)
    }
}
