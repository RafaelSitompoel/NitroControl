use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "PascalCase")]
pub enum CapabilityStatus {
    Supported,
    Unsupported,
    Unavailable,
    PermissionDenied,
    TemporarilyUnavailable,
    NotTested,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct CapabilityItem {
    pub name: String,
    pub status: CapabilityStatus,
    pub reason: Option<String>,
    pub details: Option<String>,
}

impl CapabilityItem {
    pub fn new(name: impl Into<String>, status: CapabilityStatus) -> Self {
        Self {
            name: name.into(),
            status,
            reason: None,
            details: None,
        }
    }

    pub fn with_reason(mut self, reason: impl Into<String>) -> Self {
        self.reason = Some(reason.into());
        self
    }

    pub fn with_details(mut self, details: impl Into<String>) -> Self {
        self.details = Some(details.into());
        self
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct HardwareCapabilities {
    pub system_model: String,
    pub manufacturer: String,
    pub is_acer_nitro: bool,
    pub detected_generation: Option<String>,
    pub cpu_monitoring: CapabilityItem,
    pub gpu_monitoring: CapabilityItem,
    pub ram_monitoring: CapabilityItem,
    pub battery_monitoring: CapabilityItem,
    pub fan_rpm_monitoring: CapabilityItem,
    pub fan_control: CapabilityItem,
    pub coolboost: CapabilityItem,
    pub power_modes: CapabilityItem,
    pub fan_curves: CapabilityItem,
    pub overclocking: CapabilityItem,
}
