use crate::error::{NitroError, Result};
use serde::{Deserialize, Serialize};
use std::process::Command;

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct PowerSchemeInfo {
    pub guid: String,
    pub name: String,
    pub is_active: bool,
}

pub struct PowerController;

impl PowerController {
    pub fn get_active_scheme() -> Result<PowerSchemeInfo> {
        let output = Command::new("powercfg")
            .arg("/getactivescheme")
            .output()
            .map_err(|e| NitroError::OperationFailed(format!("Failed to execute powercfg: {}", e)))?;

        let text = String::from_utf8_lossy(&output.stdout).trim().to_string();
        // Format: Power Scheme GUID: 21050b51-db44-4480-b796-dc2101360747  (Acer)
        if let Some(guid_start) = text.find("GUID:") {
            let rest = &text[guid_start + 5..].trim();
            let mut parts = rest.splitn(2, '(');
            let guid = parts.next().unwrap_or("").trim().to_string();
            let name = parts
                .next()
                .map(|s| s.trim_end_matches(')').trim().to_string())
                .unwrap_or_else(|| "Unknown".to_string());

            return Ok(PowerSchemeInfo {
                guid,
                name,
                is_active: true,
            });
        }

        Err(NitroError::OperationFailed("Could not parse active power scheme".into()))
    }

    pub fn list_available_schemes() -> Result<Vec<PowerSchemeInfo>> {
        let output = Command::new("powercfg")
            .arg("/l")
            .output()
            .map_err(|e| NitroError::OperationFailed(e.to_string()))?;

        let text = String::from_utf8_lossy(&output.stdout);
        let mut schemes = Vec::new();

        for line in text.lines() {
            if line.contains("Power Scheme GUID:") {
                let rest = line.replace("Power Scheme GUID:", "");
                let rest = rest.trim();
                let is_active = rest.ends_with('*');
                let clean = rest.trim_end_matches('*').trim();

                let mut parts = clean.splitn(2, '(');
                let guid = parts.next().unwrap_or("").trim().to_string();
                let name = parts
                    .next()
                    .map(|s| s.trim_end_matches(')').trim().to_string())
                    .unwrap_or_else(|| "Unknown".to_string());

                schemes.push(PowerSchemeInfo {
                    guid,
                    name,
                    is_active,
                });
            }
        }

        Ok(schemes)
    }

    pub fn set_power_mode(mode: &str) -> Result<PowerSchemeInfo> {
        let schemes = Self::list_available_schemes()?;

        // Standard Windows Power Scheme GUIDs
        // Balanced: 381b4222-f694-41f0-9685-ff5bb260df2e
        // High Performance: 8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c
        // Power Saver: a1841308-3541-4fab-bc81-f71556f20b4a
        let target_guid = match mode.to_lowercase().as_str() {
            "quiet" | "power_saver" => {
                // Find Power Saver or Acer quiet scheme
                schemes
                    .iter()
                    .find(|s| s.name.to_lowercase().contains("saver") || s.name.to_lowercase().contains("quiet"))
                    .map(|s| s.guid.clone())
                    .unwrap_or_else(|| "a1841308-3541-4fab-bc81-f71556f20b4a".to_string())
            }
            "performance" | "high_performance" | "gaming" => {
                // Find High Performance or Acer Gaming scheme
                schemes
                    .iter()
                    .find(|s| {
                        s.name.to_lowercase().contains("high")
                            || s.name.to_lowercase().contains("performance")
                            || s.name.to_lowercase().contains("acer")
                    })
                    .map(|s| s.guid.clone())
                    .unwrap_or_else(|| "8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c".to_string())
            }
            _ => {
                // Balanced
                schemes
                    .iter()
                    .find(|s| s.name.to_lowercase().contains("balanced"))
                    .map(|s| s.guid.clone())
                    .unwrap_or_else(|| "381b4222-f694-41f0-9685-ff5bb260df2e".to_string())
            }
        };

        let output = Command::new("powercfg")
            .args(["/setactive", &target_guid])
            .output()
            .map_err(|e| NitroError::OperationFailed(format!("Failed to set power scheme: {}", e)))?;

        if !output.status.success() {
            let err = String::from_utf8_lossy(&output.stderr);
            return Err(NitroError::OperationFailed(format!(
                "Failed to activate power scheme {}: {}",
                target_guid, err
            )));
        }

        // Read back to verify
        let active = Self::get_active_scheme()?;
        Ok(active)
    }
}
