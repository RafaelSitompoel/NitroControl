use crate::error::{NitroError, Result};
use crate::hardware::acer::wmi::{AcerWmiInterface, WmiProbeResult};
use std::process::Command;

pub struct CoolBoostController;

impl CoolBoostController {
    pub fn set_enabled(enabled: bool) -> Result<()> {
        let probe = AcerWmiInterface::probe_acer_gaming_wmi();
        match probe {
            WmiProbeResult::Accessible => {
                let arg = if enabled { 1 } else { 0 };
                let script = format!(
                    "try {{ $inst = Get-CimInstance -Namespace root\\wmi -ClassName AcerGamingFunction -ErrorAction Stop; \
                     $res = Invoke-CimMethod -InputObject $inst -MethodName SetGamingMiscSetting -Arguments @{{ gmInput = {arg} }} -ErrorAction Stop; \
                     'SUCCESS' }} catch {{ 'FAIL:' + $_.Exception.Message }}"
                );

                let output = Command::new("powershell")
                    .args(["-NoProfile", "-NonInteractive", "-Command", &script])
                    .output()
                    .map_err(|e| NitroError::OperationFailed(e.to_string()))?;

                let stdout = String::from_utf8_lossy(&output.stdout).trim().to_string();
                if stdout.contains("SUCCESS") {
                    Ok(())
                } else {
                    Err(NitroError::OperationFailed(format!("CoolBoost operation failed: {}", stdout)))
                }
            }
            WmiProbeResult::PermissionDenied(reason) => {
                Err(NitroError::PermissionDenied(reason))
            }
            WmiProbeResult::NotAvailable(_) => {
                Err(NitroError::HardwareNotSupported(
                    "CoolBoost is unavailable on this device.".to_string(),
                ))
            }
        }
    }
}
