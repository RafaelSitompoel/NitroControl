use crate::error::Result;
use crate::hardware::acer::wmi::{AcerWmiInterface, WmiProbeResult};
use crate::hardware::discovery::HardwareDiscovery;
use crate::types::capabilities::{CapabilityItem, CapabilityStatus, HardwareCapabilities};
use std::process::Command;

pub struct HardwareCapabilityDetector;

impl HardwareCapabilityDetector {
    pub fn detect() -> Result<HardwareCapabilities> {
        let sys_info = HardwareDiscovery::get_system_info()?;
        let is_acer_nitro = HardwareDiscovery::is_acer_nitro(&sys_info.model, &sys_info.manufacturer);
        let generation = HardwareDiscovery::detect_nitro_generation(&sys_info.model);

        // CPU monitoring: Supported on all modern Windows platforms
        let cpu_monitoring = CapabilityItem::new("CPU Telemetry", CapabilityStatus::Supported)
            .with_details("Real-time frequency, core count, thread count, and processor utilization via OS performance counters.");

        // GPU monitoring: Detect presence of NVIDIA GPU or GPU tools
        let has_nvidia = Self::probe_nvidia_support();
        let gpu_monitoring = if has_nvidia {
            CapabilityItem::new("GPU Telemetry", CapabilityStatus::Supported)
                .with_details("Real-time temperature, VRAM usage, utilization, clock frequencies, and power via NVIDIA NVML.")
        } else {
            CapabilityItem::new("GPU Telemetry", CapabilityStatus::Unavailable)
                .with_reason("Dedicated NVIDIA GPU with NVML interface not detected.")
        };

        // RAM monitoring: Supported
        let ram_monitoring = CapabilityItem::new("Memory Telemetry", CapabilityStatus::Supported)
            .with_details("Accurate total, used, and available physical memory from Windows API.");

        // Battery monitoring: Check if device has battery
        let has_battery = Self::probe_battery_presence();
        let battery_monitoring = if has_battery {
            CapabilityItem::new("Battery Telemetry", CapabilityStatus::Supported)
                .with_details("Charge percentage, charging state, and AC adapter connectivity.")
        } else {
            CapabilityItem::new("Battery Telemetry", CapabilityStatus::Unavailable)
                .with_reason("No battery detected (Desktop system or battery disconnected).")
        };

        // Acer WMI Fan & CoolBoost probes
        let (fan_ctrl_status, fan_reason) = if !is_acer_nitro {
            (
                CapabilityStatus::Unsupported,
                Some("System is not an Acer Nitro laptop. Hardware fan control is disabled for safety.".to_string()),
            )
        } else {
            match AcerWmiInterface::probe_acer_gaming_wmi() {
                WmiProbeResult::Accessible => (CapabilityStatus::Supported, None),
                WmiProbeResult::PermissionDenied(msg) => (CapabilityStatus::PermissionDenied, Some(msg)),
                WmiProbeResult::NotAvailable(msg) => (CapabilityStatus::Unsupported, Some(msg)),
            }
        };

        let mut fan_control = CapabilityItem::new("Fan Control", fan_ctrl_status);
        if let Some(r) = &fan_reason {
            fan_control = fan_control.with_reason(r.clone());
        }

        let fan_rpm_monitoring = if fan_ctrl_status == CapabilityStatus::Supported {
            CapabilityItem::new("Fan RPM Monitoring", CapabilityStatus::Supported)
                .with_details("Live fan tachometer RPM feedback via Acer WMI.")
        } else if fan_ctrl_status == CapabilityStatus::PermissionDenied {
            CapabilityItem::new("Fan RPM Monitoring", CapabilityStatus::PermissionDenied)
                .with_reason("Requires administrator privileges to read fan tachometer registers.")
        } else {
            CapabilityItem::new("Fan RPM Monitoring", CapabilityStatus::Unavailable)
                .with_reason("Fan tachometer register unavailable without verified Acer interface.")
        };

        let coolboost = if fan_ctrl_status == CapabilityStatus::Supported {
            CapabilityItem::new("CoolBoost Control", CapabilityStatus::Supported)
                .with_details("Acer dynamic fan acceleration mode.")
        } else if fan_ctrl_status == CapabilityStatus::PermissionDenied {
            CapabilityItem::new("CoolBoost Control", CapabilityStatus::PermissionDenied)
                .with_reason("Requires administrator privileges to invoke Acer CoolBoost.")
        } else {
            CapabilityItem::new("CoolBoost Control", CapabilityStatus::Unsupported)
                .with_reason("CoolBoost is unavailable on this device.")
        };

        // Windows Power Modes: Always supported on Windows
        let power_modes = CapabilityItem::new("Power Schemes", CapabilityStatus::Supported)
            .with_details("Quiet, Balanced, and Performance Windows power plans with verification.");

        // Fan curves: only executable if fan control is Supported
        let fan_curves = if fan_ctrl_status == CapabilityStatus::Supported {
            CapabilityItem::new("Custom Fan Curves", CapabilityStatus::Supported)
                .with_details("Programmable temperature-to-speed curve mapping.")
        } else {
            CapabilityItem::new("Custom Fan Curves", CapabilityStatus::Unavailable)
                .with_reason("Custom fan curve execution requires verified manual fan hardware control.")
        };

        let overclocking = CapabilityItem::new("CPU/GPU Overclocking", CapabilityStatus::Unsupported)
            .with_reason("Overclocking is locked by manufacturer BIOS on this model.");

        Ok(HardwareCapabilities {
            system_model: sys_info.model,
            manufacturer: sys_info.manufacturer,
            is_acer_nitro,
            detected_generation: generation,
            cpu_monitoring,
            gpu_monitoring,
            ram_monitoring,
            battery_monitoring,
            fan_rpm_monitoring,
            fan_control,
            coolboost,
            power_modes,
            fan_curves,
            overclocking,
        })
    }

    fn probe_nvidia_support() -> bool {
        let output = Command::new("nvidia-smi")
            .arg("--help")
            .output();

        match output {
            Ok(out) => out.status.success(),
            Err(_) => false,
        }
    }

    fn probe_battery_presence() -> bool {
        let output = Command::new("powershell")
            .args([
                "-NoProfile",
                "-NonInteractive",
                "-Command",
                "try { [void](Get-CimInstance Win32_Battery -ErrorAction Stop); 'YES' } catch { 'NO' }",
            ])
            .output();

        match output {
            Ok(out) => String::from_utf8_lossy(&out.stdout).contains("YES"),
            Err(_) => false,
        }
    }
}
