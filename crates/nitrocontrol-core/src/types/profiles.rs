use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum PowerMode {
    Quiet,
    Balanced,
    Performance,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum FanMode {
    Auto,
    Max,
    Custom,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct FanCurvePoint {
    pub temp_c: u32,
    pub speed_percent: u32,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct Profile {
    pub id: String,
    pub name: String,
    pub is_active: bool,
    pub is_builtin: bool,
    pub power_mode: PowerMode,
    pub fan_mode: FanMode,
    pub fan_curve: Option<Vec<FanCurvePoint>>,
    pub coolboost_enabled: bool,
    pub refresh_rate_ms: u64,
    pub description: Option<String>,
}

impl Profile {
    pub fn default_profiles() -> Vec<Self> {
        vec![
            Self {
                id: "silent".into(),
                name: "Silent".into(),
                is_active: false,
                is_builtin: true,
                power_mode: PowerMode::Quiet,
                fan_mode: FanMode::Auto,
                fan_curve: None,
                coolboost_enabled: false,
                refresh_rate_ms: 2000,
                description: Some("Prioritizes whisper-quiet operation and lower temperatures.".into()),
            },
            Self {
                id: "balanced".into(),
                name: "Balanced".into(),
                is_active: true,
                is_builtin: true,
                power_mode: PowerMode::Balanced,
                fan_mode: FanMode::Auto,
                fan_curve: None,
                coolboost_enabled: false,
                refresh_rate_ms: 1000,
                description: Some("Dynamic balance between cooling and performance for daily use.".into()),
            },
            Self {
                id: "gaming".into(),
                name: "Gaming".into(),
                is_active: false,
                is_builtin: true,
                power_mode: PowerMode::Performance,
                fan_mode: FanMode::Auto,
                fan_curve: None,
                coolboost_enabled: true,
                refresh_rate_ms: 1000,
                description: Some("Elevates performance plan and engages aggressive cooling during gaming sessions.".into()),
            },
            Self {
                id: "max_cooling".into(),
                name: "Maximum Cooling".into(),
                is_active: false,
                is_builtin: true,
                power_mode: PowerMode::Performance,
                fan_mode: FanMode::Max,
                fan_curve: None,
                coolboost_enabled: true,
                refresh_rate_ms: 500,
                description: Some("Forces maximum fan speeds for peak thermal dissipation.".into()),
            },
        ]
    }
}
