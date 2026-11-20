use crate::error::Result;
use crate::hardware::acer::wmi::AcerWmiInterface;

pub struct BatteryLimiterController;

impl BatteryLimiterController {
    /// Enable or disable Acer BattCare 80% charge limit.
    /// Requires Administrator privileges (Acer WMI).
    pub fn set_enabled(enabled: bool) -> Result<()> {
        AcerWmiInterface::set_battery_limiter(enabled)
    }

    /// Read current state of the 80% battery limiter.
    pub fn get_state() -> Result<bool> {
        AcerWmiInterface::get_battery_limiter()
    }
}
