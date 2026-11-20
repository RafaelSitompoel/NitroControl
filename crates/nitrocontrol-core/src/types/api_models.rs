use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct ApiResponse<T> {
    pub success: bool,
    pub data: Option<T>,
    pub error: Option<String>,
    pub timestamp: DateTime<Utc>,
}

impl<T> ApiResponse<T> {
    pub fn ok(data: T) -> Self {
        Self {
            success: true,
            data: Some(data),
            error: None,
            timestamp: Utc::now(),
        }
    }

    pub fn err(message: impl Into<String>) -> Self {
        Self {
            success: false,
            data: None,
            error: Some(message.into()),
            timestamp: Utc::now(),
        }
    }
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct FanControlRequest {
    pub fan_id: Option<u32>,
    pub mode: String, // "Auto", "Max", "Custom"
    pub speed_percent: Option<u32>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct PowerModeRequest {
    pub mode: String, // "quiet", "balanced", "performance"
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct CoolBoostRequest {
    pub enabled: bool,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct ProfileActivateRequest {
    pub profile_id: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct SensorHistoryQuery {
    pub range: Option<String>, // "5m", "30m", "1h", "24h"
    pub limit: Option<usize>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct BatteryLimiterRequest {
    pub enabled: bool, // true = 80% limit, false = full charge
}
