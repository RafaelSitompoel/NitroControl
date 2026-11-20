use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct AppSettings {
    pub refresh_interval_ms: u64,
    pub start_with_windows: bool,
    pub minimize_to_tray: bool,
    pub high_temp_alert_celsius: f32,
    pub high_temp_alerts_enabled: bool,
    pub api_port: u16,
    pub api_bind_local_only: bool,
    pub api_token: Option<String>,
    pub dark_theme: bool,
    pub history_retention_hours: u32,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            refresh_interval_ms: 1000,
            start_with_windows: false,
            minimize_to_tray: true,
            high_temp_alert_celsius: 85.0,
            high_temp_alerts_enabled: true,
            api_port: 7878,
            api_bind_local_only: true,
            api_token: None,
            dark_theme: true,
            history_retention_hours: 24,
        }
    }
}
