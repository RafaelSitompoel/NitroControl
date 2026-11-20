use crate::error::{NitroError, Result};
use std::process::Command;
use std::sync::RwLock;
use std::time::{Duration, Instant};

pub struct AcerWmiInterface;

#[derive(Clone, Debug)]
pub enum WmiProbeResult {
    Accessible,
    PermissionDenied(String),
    NotAvailable(String),
}

static PROBE_CACHE: RwLock<Option<(Instant, WmiProbeResult)>> = RwLock::new(None);
const PROBE_CACHE_DURATION: Duration = Duration::from_secs(30);

impl AcerWmiInterface {
    pub fn probe_acer_gaming_wmi() -> WmiProbeResult {
        if let Ok(guard) = PROBE_CACHE.read() {
            if let Some((instant, ref res)) = *guard {
                if instant.elapsed() < PROBE_CACHE_DURATION {
                    return res.clone();
                }
            }
        }

        let output = Command::new("powershell")
            .args([
                "-NoProfile",
                "-NonInteractive",
                "-Command",
                "$ErrorActionPreference = 'Stop'; try { $c = Get-CimClass -Namespace root\\wmi -ClassName AcerGamingFunction -ErrorAction Stop; if ($null -ne $c) { try { [void](Get-CimInstance -Namespace root\\wmi -ClassName AcerGamingFunction -ErrorAction Stop); 'ACCESSIBLE' } catch { if ($_.Exception.Message -match 'Access denied') { 'PERMISSION_DENIED' } else { 'ERROR:' + $_.Exception.Message } } } else { 'NOT_FOUND' } } catch { 'NOT_FOUND' }",
            ])
            .output();

        let result = match output {
            Ok(out) => {
                let stdout = String::from_utf8_lossy(&out.stdout).trim().to_string();
                if stdout.contains("ACCESSIBLE") {
                    WmiProbeResult::Accessible
                } else if stdout.contains("PERMISSION_DENIED") {
                    WmiProbeResult::PermissionDenied(
                        "Administrator privileges are required to access Acer Gaming WMI hardware registers."
                            .to_string(),
                    )
                } else {
                    WmiProbeResult::NotAvailable(
                        "AcerGamingFunction WMI class is not available or supported on this system."
                            .to_string(),
                    )
                }
            }
            Err(e) => WmiProbeResult::NotAvailable(format!("Failed to execute WMI probe: {}", e)),
        };

        if let Ok(mut guard) = PROBE_CACHE.write() {
            *guard = Some((Instant::now(), result.clone()));
        }

        result
    }

    pub fn set_gaming_fan_mode(mode: &str, speed_pct: Option<u32>) -> Result<()> {
        match Self::probe_acer_gaming_wmi() {
            WmiProbeResult::PermissionDenied(reason) => Err(NitroError::PermissionDenied(reason)),
            WmiProbeResult::NotAvailable(reason) => Err(NitroError::HardwareNotSupported(reason)),
            WmiProbeResult::Accessible => {
                let _speed_val = speed_pct.unwrap_or(100);
                let mode_code = match mode {
                    "Max" | "max" => 1,
                    "Custom" | "custom" => 2,
                    _ => 0, // Auto
                };

                let script = format!(
                    "try {{ $inst = Get-CimInstance -Namespace root\\wmi -ClassName AcerGamingFunction -ErrorAction Stop; \
                     $res = Invoke-CimMethod -InputObject $inst -MethodName SetGamingFanBehavior -Arguments @{{ gmInput = {mode_code} }} -ErrorAction Stop; \
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
                    Err(NitroError::OperationFailed(format!("Acer WMI command failed: {}", stdout)))
                }
            }
        }
    }
}
