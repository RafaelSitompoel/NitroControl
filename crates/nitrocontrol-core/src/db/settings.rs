use crate::db::Database;
use crate::error::{NitroError, Result};
use crate::types::settings::AppSettings;
use chrono::Utc;

impl Database {
    pub fn get_settings(&self) -> Result<AppSettings> {
        let conn = self.conn();
        let mut stmt = conn
            .prepare("SELECT data_json FROM settings WHERE id = 1")
            .map_err(|e| NitroError::DatabaseError(e.to_string()))?;

        let mut rows = stmt
            .query([])
            .map_err(|e| NitroError::DatabaseError(e.to_string()))?;

        if let Some(row) = rows.next().map_err(|e| NitroError::DatabaseError(e.to_string()))? {
            let json_str: String = row.get(0).map_err(|e| NitroError::DatabaseError(e.to_string()))?;
            let settings: AppSettings = serde_json::from_str(&json_str)
                .map_err(|e| NitroError::InvalidConfiguration(format!("Failed to parse settings JSON: {}", e)))?;
            Ok(settings)
        } else {
            let default_settings = AppSettings::default();
            drop(rows);
            drop(stmt);
            drop(conn);
            self.save_settings(&default_settings)?;
            Ok(default_settings)
        }
    }

    pub fn save_settings(&self, settings: &AppSettings) -> Result<()> {
        let conn = self.conn();
        let json_str = serde_json::to_string(settings)
            .map_err(|e| NitroError::InvalidConfiguration(e.to_string()))?;
        let now = Utc::now().to_rfc3339();

        conn.execute(
            "INSERT INTO settings (id, data_json, updated_at) 
             VALUES (1, ?1, ?2) 
             ON CONFLICT(id) DO UPDATE SET data_json = ?1, updated_at = ?2",
            rusqlite::params![json_str, now],
        )
        .map_err(|e| NitroError::DatabaseError(format!("Failed to save settings: {}", e)))?;

        Ok(())
    }
}
