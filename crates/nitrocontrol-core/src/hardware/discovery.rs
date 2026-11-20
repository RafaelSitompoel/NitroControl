use crate::error::{NitroError, Result};
use crate::types::system::SystemInfo;
use std::process::Command;
use std::sync::OnceLock;
use sysinfo::System;

pub struct HardwareDiscovery;

static CACHED_SYS_INFO: OnceLock<SystemInfo> = OnceLock::new();

impl HardwareDiscovery {
    pub fn get_system_info() -> Result<SystemInfo> {
        if let Some(info) = CACHED_SYS_INFO.get() {
            return Ok(info.clone());
        }

        let mut sys = System::new_all();
        sys.refresh_all();

        let os_name = System::name().unwrap_or_else(|| "Windows".to_string());
        let os_version = System::os_version().unwrap_or_else(|| "Unknown".to_string());
        let hostname = System::host_name().unwrap_or_else(|| "Localhost".to_string());
        let uptime_secs = System::uptime();

        // Query Win32_ComputerSystem and Win32_Bios via PowerShell CIM once
        let (model, manufacturer) = Self::query_model_and_mfg()
            .unwrap_or_else(|_| ("Standard PC".to_string(), "Unknown".to_string()));
        let bios_version = Self::query_bios_version()
            .unwrap_or_else(|_| "Unknown BIOS".to_string());

        let info = SystemInfo {
            model,
            manufacturer,
            os_name,
            os_version,
            bios_version,
            hostname,
            uptime_secs,
        };

        let _ = CACHED_SYS_INFO.set(info.clone());
        Ok(info)
    }

    pub fn is_acer_nitro(model: &str, mfg: &str) -> bool {
        let mfg_lower = mfg.to_lowercase();
        let model_lower = model.to_lowercase();

        let is_acer = mfg_lower.contains("acer") || model_lower.contains("acer");
        let is_nitro = model_lower.contains("nitro")
            || model_lower.contains("an5")
            || model_lower.contains("anv")
            || model_lower.contains("an16")
            || model_lower.contains("an17");

        is_acer && is_nitro
    }

    pub fn detect_nitro_generation(model: &str) -> Option<String> {
        let model_lower = model.to_lowercase();
        if model_lower.contains("anv") || model_lower.contains("nitro v") {
            Some("Nitro V".to_string())
        } else if model_lower.contains("an5") || model_lower.contains("nitro 5") {
            Some("Nitro 5".to_string())
        } else if model_lower.contains("an16") || model_lower.contains("nitro 16") {
            Some("Nitro 16".to_string())
        } else if model_lower.contains("an17") || model_lower.contains("nitro 17") {
            Some("Nitro 17".to_string())
        } else {
            None
        }
    }

    fn query_model_and_mfg() -> Result<(String, String)> {
        let output = Command::new("powershell")
            .args([
                "-NoProfile",
                "-NonInteractive",
                "-Command",
                "try { $cs = Get-CimInstance Win32_ComputerSystem -ErrorAction Stop; \"$($cs.Model)|$($cs.Manufacturer)\" } catch { 'Unknown|Unknown' }",
            ])
            .output()
            .map_err(|e| NitroError::Internal(format!("Failed to execute PowerShell query: {}", e)))?;

        let text = String::from_utf8_lossy(&output.stdout).trim().to_string();
        let parts: Vec<&str> = text.split('|').collect();

        if parts.len() == 2 {
            let model = parts[0].trim().to_string();
            let mfg = parts[1].trim().to_string();
            Ok((
                if model.is_empty() { "Unknown Model".into() } else { model },
                if mfg.is_empty() { "Unknown Manufacturer".into() } else { mfg },
            ))
        } else {
            Ok(("Unknown Model".into(), "Unknown Manufacturer".into()))
        }
    }

    fn query_bios_version() -> Result<String> {
        let output = Command::new("powershell")
            .args([
                "-NoProfile",
                "-NonInteractive",
                "-Command",
                "try { (Get-CimInstance Win32_Bios -ErrorAction Stop).SMBIOSBIOSVersion } catch { 'Unknown' }",
            ])
            .output()
            .map_err(|e| NitroError::Internal(e.to_string()))?;

        let bios = String::from_utf8_lossy(&output.stdout).trim().to_string();
        Ok(if bios.is_empty() { "Unknown BIOS".into() } else { bios })
    }
}
