use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct SystemInfo {
    pub model: String,
    pub manufacturer: String,
    pub os_name: String,
    pub os_version: String,
    pub bios_version: String,
    pub hostname: String,
    pub uptime_secs: u64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct BatteryInfo {
    pub present: bool,
    pub percentage: Option<f32>,
    pub is_charging: bool,
    pub power_plugged: bool,
    pub estimated_remaining_minutes: Option<u32>,
    pub status_source: String,
}
