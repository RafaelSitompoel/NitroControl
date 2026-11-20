use crate::error::Result;
use crate::types::sensors::CpuMetrics;
use std::process::Command;
use sysinfo::System;

pub fn read_cpu_metrics(sys: &System) -> Result<CpuMetrics> {
    let cpus = sys.cpus();
    let model = cpus
        .first()
        .map(|c| c.brand().trim().to_string())
        .unwrap_or_else(|| "Unknown CPU".to_string());

    let cores_physical = sys.physical_core_count().unwrap_or(cpus.len());
    let threads_logical = cpus.len();
    let usage_percent = sys.global_cpu_usage();

    let avg_freq = if !cpus.is_empty() {
        let sum: u64 = cpus.iter().map(|c| c.frequency()).sum();
        sum / cpus.len() as u64
    } else {
        0
    };

    let temperature_celsius = query_cpu_temperature();

    Ok(CpuMetrics {
        model,
        cores_physical,
        threads_logical,
        usage_percent,
        frequency_mhz: avg_freq,
        temperature_celsius,
        power_watts: None,
        source: "Windows Kernel Performance Counters / ACPI ThermalZone".into(),
    })
}

fn query_cpu_temperature() -> Option<f32> {
    let output = Command::new("powershell")
        .args([
            "-NoProfile",
            "-NonInteractive",
            "-Command",
            "try { $t = Get-CimInstance -Namespace root\\wmi -ClassName MSAcpi_ThermalZoneTemperature -ErrorAction Stop; [math]::Round(($t.CurrentTemperature[0] - 2732) / 10.0, 1) } catch { '' }",
        ])
        .output()
        .ok()?;

    let text = String::from_utf8_lossy(&output.stdout).trim().to_string();
    text.parse::<f32>().ok().filter(|&t| t > 0.0 && t < 125.0)
}
