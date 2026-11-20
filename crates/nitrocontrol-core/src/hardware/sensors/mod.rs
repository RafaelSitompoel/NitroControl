pub mod battery;
pub mod cpu;
pub mod fans;
pub mod gpu;
pub mod memory;

use crate::error::Result;
use crate::types::sensors::TelemetrySnapshot;
use chrono::Utc;
use std::sync::Mutex;
use sysinfo::System;

pub struct HardwareSensors {
    sys: Mutex<System>,
}

impl HardwareSensors {
    pub fn new() -> Self {
        let mut sys = System::new_all();
        sys.refresh_all();
        Self {
            sys: Mutex::new(sys),
        }
    }

    pub fn snapshot(&self) -> Result<TelemetrySnapshot> {
        let mut sys = self.sys.lock().unwrap();
        sys.refresh_cpu_all();
        sys.refresh_memory();

        let cpu = cpu::read_cpu_metrics(&sys)?;
        let gpu = gpu::read_gpu_metrics().ok();
        let ram = memory::read_ram_metrics(&sys)?;
        let fans = fans::read_fans_metrics()?;
        let battery = battery::read_battery_metrics()?;

        Ok(TelemetrySnapshot {
            timestamp: Utc::now(),
            cpu,
            gpu,
            ram,
            fans,
            battery,
        })
    }
}
