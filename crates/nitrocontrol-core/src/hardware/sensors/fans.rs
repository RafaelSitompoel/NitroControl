use crate::error::Result;
use crate::hardware::acer::wmi::{AcerWmiInterface, WmiProbeResult};
use crate::types::sensors::FanMetrics;
use std::process::Command;

pub fn read_fans_metrics() -> Result<Vec<FanMetrics>> {
    let probe = AcerWmiInterface::probe_acer_gaming_wmi();

    match probe {
        WmiProbeResult::Accessible => {
            // Read fan speeds via Acer WMI GetGamingFanSpeed
            let output = Command::new("powershell")
                .args([
                    "-NoProfile",
                    "-NonInteractive",
                    "-Command",
                    "try { \
                     $inst = Get-CimInstance -Namespace root\\wmi -ClassName AcerGamingFunction -ErrorAction Stop; \
                     $cpuFan = Invoke-CimMethod -InputObject $inst -MethodName GetGamingFanSpeed -Arguments @{ gmInput = 1 } -ErrorAction Stop; \
                     $gpuFan = Invoke-CimMethod -InputObject $inst -MethodName GetGamingFanSpeed -Arguments @{ gmInput = 2 } -ErrorAction Stop; \
                     \"$($cpuFan.gmOutput)|$($gpuFan.gmOutput)\" \
                    } catch { 'ERROR' }",
                ])
                .output();

            if let Ok(out) = output {
                let text = String::from_utf8_lossy(&out.stdout).trim().to_string();
                if text != "ERROR" && text.contains('|') {
                    let parts: Vec<&str> = text.split('|').collect();
                    let f1_rpm = parts.get(0).and_then(|s| s.parse::<u32>().ok());
                    let f2_rpm = parts.get(1).and_then(|s| s.parse::<u32>().ok());

                    return Ok(vec![
                        FanMetrics {
                            fan_id: 1,
                            name: "CPU Fan".into(),
                            current_rpm: f1_rpm,
                            speed_percent: None,
                            mode: "Auto".into(),
                            status: "Active".into(),
                            source: "Acer Gaming WMI (GetGamingFanSpeed)".into(),
                        },
                        FanMetrics {
                            fan_id: 2,
                            name: "GPU Fan".into(),
                            current_rpm: f2_rpm,
                            speed_percent: None,
                            mode: "Auto".into(),
                            status: "Active".into(),
                            source: "Acer Gaming WMI (GetGamingFanSpeed)".into(),
                        },
                    ]);
                }
            }

            Ok(default_fan_entries(
                "Active (RPM query failed)",
                "Acer Gaming WMI (RPM query unavailable)",
            ))
        }
        WmiProbeResult::PermissionDenied(_) => Ok(default_fan_entries(
            "Tachometer Locked (Admin Privileges Required)",
            "Acer Gaming WMI (Permission Denied)",
        )),
        WmiProbeResult::NotAvailable(_) => Ok(default_fan_entries(
            "Unsupported on this hardware",
            "Unavailable",
        )),
    }
}

fn default_fan_entries(status: &str, source: &str) -> Vec<FanMetrics> {
    vec![
        FanMetrics {
            fan_id: 1,
            name: "CPU Fan".into(),
            current_rpm: None,
            speed_percent: None,
            mode: "Auto".into(),
            status: status.into(),
            source: source.into(),
        },
        FanMetrics {
            fan_id: 2,
            name: "GPU Fan".into(),
            current_rpm: None,
            speed_percent: None,
            mode: "Auto".into(),
            status: status.into(),
            source: source.into(),
        },
    ]
}
