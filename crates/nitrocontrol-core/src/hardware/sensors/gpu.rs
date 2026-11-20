use crate::error::{NitroError, Result};
use crate::types::sensors::GpuMetrics;
use std::process::Command;

pub fn read_gpu_metrics() -> Result<GpuMetrics> {
    let output = Command::new("nvidia-smi")
        .args([
            "--query-gpu=name,temperature.gpu,utilization.gpu,clocks.current.graphics,memory.used,memory.total,power.draw,power.limit",
            "--format=csv,noheader,nounits",
        ])
        .output()
        .map_err(|e| NitroError::SensorUnavailable(format!("nvidia-smi not available: {}", e)))?;

    if !output.status.success() {
        return Err(NitroError::SensorUnavailable(
            "nvidia-smi query returned non-zero exit code".into(),
        ));
    }

    let line = String::from_utf8_lossy(&output.stdout)
        .lines()
        .next()
        .unwrap_or("")
        .to_string();

    if line.trim().is_empty() {
        return Err(NitroError::SensorUnavailable("nvidia-smi returned empty output".into()));
    }

    let parts: Vec<&str> = line.split(',').map(|s| s.trim()).collect();
    if parts.len() < 6 {
        return Err(NitroError::SensorUnavailable("nvidia-smi returned unexpected CSV format".into()));
    }

    let model = parts[0].to_string();
    let temperature_celsius = parts.get(1).and_then(|s| s.parse::<f32>().ok());
    let usage_percent = parts.get(2).and_then(|s| s.parse::<f32>().ok());
    let frequency_mhz = parts.get(3).and_then(|s| s.parse::<u64>().ok());
    let memory_used_mb = parts.get(4).and_then(|s| s.parse::<u64>().ok()).unwrap_or(0);
    let memory_total_mb = parts.get(5).and_then(|s| s.parse::<u64>().ok()).unwrap_or(0);
    let power_watts = parts.get(6).and_then(|s| s.parse::<f32>().ok());
    let power_limit_watts = parts.get(7).and_then(|s| s.parse::<f32>().ok());

    Ok(GpuMetrics {
        model,
        vendor: "NVIDIA".into(),
        usage_percent,
        temperature_celsius,
        frequency_mhz,
        memory_used_bytes: memory_used_mb * 1024 * 1024,
        memory_total_bytes: memory_total_mb * 1024 * 1024,
        power_watts,
        power_limit_watts,
        source: "NVIDIA NVML / nvidia-smi".into(),
    })
}
