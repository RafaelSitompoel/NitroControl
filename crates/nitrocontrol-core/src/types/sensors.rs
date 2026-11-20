use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use super::system::BatteryInfo;

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct CpuMetrics {
    pub model: String,
    pub cores_physical: usize,
    pub threads_logical: usize,
    pub usage_percent: f32,
    pub frequency_mhz: u64,
    pub temperature_celsius: Option<f32>,
    pub power_watts: Option<f32>,
    pub source: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct GpuMetrics {
    pub model: String,
    pub vendor: String,
    pub usage_percent: Option<f32>,
    pub temperature_celsius: Option<f32>,
    pub frequency_mhz: Option<u64>,
    pub memory_used_bytes: u64,
    pub memory_total_bytes: u64,
    pub power_watts: Option<f32>,
    pub power_limit_watts: Option<f32>,
    pub source: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct RamMetrics {
    pub total_bytes: u64,
    pub used_bytes: u64,
    pub available_bytes: u64,
    pub usage_percent: f32,
    pub source: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct FanMetrics {
    pub fan_id: u32,
    pub name: String,
    pub current_rpm: Option<u32>,
    pub speed_percent: Option<u32>,
    pub mode: String,
    pub status: String,
    pub source: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct TelemetrySnapshot {
    pub timestamp: DateTime<Utc>,
    pub cpu: CpuMetrics,
    pub gpu: Option<GpuMetrics>,
    pub ram: RamMetrics,
    pub fans: Vec<FanMetrics>,
    pub battery: BatteryInfo,
}
