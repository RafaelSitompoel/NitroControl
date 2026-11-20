use crate::db::Database;
use crate::error::{NitroError, Result};
use crate::types::profiles::{FanCurvePoint, FanMode, PowerMode, Profile};
use chrono::Utc;

impl Database {
    pub fn init_default_profiles(&self) -> Result<()> {
        let existing = self.list_profiles()?;
        if existing.is_empty() {
            for p in Profile::default_profiles() {
                self.save_profile(&p)?;
            }
        }
        Ok(())
    }

    pub fn list_profiles(&self) -> Result<Vec<Profile>> {
        let conn = self.conn();
        let mut stmt = conn
            .prepare(
                "SELECT id, name, is_active, is_builtin, power_mode, fan_mode, 
                        fan_curve_json, coolboost_enabled, refresh_rate_ms, description 
                 FROM profiles ORDER BY is_builtin DESC, name ASC",
            )
            .map_err(|e| NitroError::DatabaseError(e.to_string()))?;

        let rows = stmt
            .query_map([], |row| {
                let id: String = row.get(0)?;
                let name: String = row.get(1)?;
                let is_active: bool = row.get::<_, i64>(2)? != 0;
                let is_builtin: bool = row.get::<_, i64>(3)? != 0;
                let power_mode_str: String = row.get(4)?;
                let fan_mode_str: String = row.get(5)?;
                let fan_curve_json: Option<String> = row.get(6)?;
                let coolboost_enabled: bool = row.get::<_, i64>(7)? != 0;
                let refresh_rate_ms: i64 = row.get(8)?;
                let description: Option<String> = row.get(9)?;

                let power_mode = match power_mode_str.as_str() {
                    "quiet" => PowerMode::Quiet,
                    "performance" => PowerMode::Performance,
                    _ => PowerMode::Balanced,
                };

                let fan_mode = match fan_mode_str.as_str() {
                    "max" => FanMode::Max,
                    "custom" => FanMode::Custom,
                    _ => FanMode::Auto,
                };

                let fan_curve = fan_curve_json.and_then(|j| serde_json::from_str::<Vec<FanCurvePoint>>(&j).ok());

                Ok(Profile {
                    id,
                    name,
                    is_active,
                    is_builtin,
                    power_mode,
                    fan_mode,
                    fan_curve,
                    coolboost_enabled,
                    refresh_rate_ms: refresh_rate_ms as u64,
                    description,
                })
            })
            .map_err(|e| NitroError::DatabaseError(e.to_string()))?;

        let mut profiles = Vec::new();
        for r in rows {
            profiles.push(r.map_err(|e| NitroError::DatabaseError(e.to_string()))?);
        }

        Ok(profiles)
    }

    pub fn get_profile(&self, id: &str) -> Result<Option<Profile>> {
        let profiles = self.list_profiles()?;
        Ok(profiles.into_iter().find(|p| p.id == id))
    }

    pub fn save_profile(&self, profile: &Profile) -> Result<()> {
        let conn = self.conn();
        let fan_curve_json = profile
            .fan_curve
            .as_ref()
            .and_then(|c| serde_json::to_string(c).ok());
        let now = Utc::now().to_rfc3339();

        let power_mode_str = match profile.power_mode {
            PowerMode::Quiet => "quiet",
            PowerMode::Balanced => "balanced",
            PowerMode::Performance => "performance",
        };

        let fan_mode_str = match profile.fan_mode {
            FanMode::Auto => "auto",
            FanMode::Max => "max",
            FanMode::Custom => "custom",
        };

        conn.execute(
            "INSERT INTO profiles (id, name, is_active, is_builtin, power_mode, fan_mode, 
                                   fan_curve_json, coolboost_enabled, refresh_rate_ms, description, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)
             ON CONFLICT(id) DO UPDATE SET 
                name = ?2, is_active = ?3, power_mode = ?5, fan_mode = ?6, 
                fan_curve_json = ?7, coolboost_enabled = ?8, refresh_rate_ms = ?9, 
                description = ?10, updated_at = ?11",
            rusqlite::params![
                profile.id,
                profile.name,
                if profile.is_active { 1 } else { 0 },
                if profile.is_builtin { 1 } else { 0 },
                power_mode_str,
                fan_mode_str,
                fan_curve_json,
                if profile.coolboost_enabled { 1 } else { 0 },
                profile.refresh_rate_ms as i64,
                profile.description,
                now
            ],
        )
        .map_err(|e| NitroError::DatabaseError(format!("Failed to save profile: {}", e)))?;

        Ok(())
    }

    pub fn activate_profile(&self, profile_id: &str) -> Result<Profile> {
        let conn = self.conn();
        conn.execute("UPDATE profiles SET is_active = 0", [])
            .map_err(|e| NitroError::DatabaseError(e.to_string()))?;

        let affected = conn
            .execute("UPDATE profiles SET is_active = 1 WHERE id = ?1", [profile_id])
            .map_err(|e| NitroError::DatabaseError(e.to_string()))?;

        if affected == 0 {
            return Err(NitroError::InvalidConfiguration(format!("Profile '{}' not found", profile_id)));
        }

        drop(conn);
        self.get_profile(profile_id)?
            .ok_or_else(|| NitroError::InvalidConfiguration(format!("Profile '{}' not found", profile_id)))
    }

    pub fn delete_profile(&self, profile_id: &str) -> Result<()> {
        let conn = self.conn();
        let is_builtin: Option<i64> = conn
            .query_row("SELECT is_builtin FROM profiles WHERE id = ?1", [profile_id], |r| r.get(0))
            .map_err(|_| NitroError::InvalidConfiguration(format!("Profile '{}' not found", profile_id)))?;

        if is_builtin == Some(1) {
            return Err(NitroError::InvalidConfiguration("Cannot delete built-in profile".into()));
        }

        conn.execute("DELETE FROM profiles WHERE id = ?1", [profile_id])
            .map_err(|e| NitroError::DatabaseError(e.to_string()))?;

        Ok(())
    }
}
