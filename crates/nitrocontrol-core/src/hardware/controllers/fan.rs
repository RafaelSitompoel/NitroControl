use crate::error::{NitroError, Result};
use crate::hardware::acer::wmi::{AcerWmiInterface, WmiProbeResult};

pub struct FanController;

impl FanController {
    pub fn set_mode(mode: &str, speed_pct: Option<u32>) -> Result<()> {
        // Validate speed percentage if provided
        if let Some(pct) = speed_pct {
            if pct > 100 {
                return Err(NitroError::InvalidConfiguration(
                    "Fan speed percentage must be between 0 and 100".to_string(),
                ));
            }
        }

        // Check hardware capability
        let probe = AcerWmiInterface::probe_acer_gaming_wmi();
        match probe {
            WmiProbeResult::Accessible => {
                AcerWmiInterface::set_gaming_fan_mode(mode, speed_pct)
            }
            WmiProbeResult::PermissionDenied(reason) => {
                Err(NitroError::PermissionDenied(reason))
            }
            WmiProbeResult::NotAvailable(reason) => {
                Err(NitroError::HardwareNotSupported(format!(
                    "Fan control is not supported on this hardware: {}",
                    reason
                )))
            }
        }
    }
}
