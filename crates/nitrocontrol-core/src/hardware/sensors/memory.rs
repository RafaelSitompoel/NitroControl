use crate::error::Result;
use crate::types::sensors::RamMetrics;
use sysinfo::System;

pub fn read_ram_metrics(sys: &System) -> Result<RamMetrics> {
    let total_bytes = sys.total_memory();
    let used_bytes = sys.used_memory();
    let available_bytes = sys.available_memory();

    let usage_percent = if total_bytes > 0 {
        ((used_bytes as f64 / total_bytes as f64) * 100.0) as f32
    } else {
        0.0
    };

    Ok(RamMetrics {
        total_bytes,
        used_bytes,
        available_bytes,
        usage_percent,
        source: "Windows Kernel Memory Manager".into(),
    })
}
