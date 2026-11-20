use crate::error::Result;
use crate::types::system::BatteryInfo;

#[repr(C)]
#[derive(Default, Debug, Clone, Copy)]
struct SystemPowerStatus {
    ac_line_status: u8,
    battery_flag: u8,
    battery_life_percent: u8,
    system_status_flag: u8,
    battery_life_time: u32,
    battery_full_life_time: u32,
}

#[link(name = "kernel32")]
extern "system" {
    fn GetSystemPowerStatus(lpSystemPowerStatus: *mut SystemPowerStatus) -> i32;
}

pub fn read_battery_metrics() -> Result<BatteryInfo> {
    let mut status = SystemPowerStatus::default();
    let success = unsafe { GetSystemPowerStatus(&mut status) };

    if success != 0 {
        // battery_flag: 128 means no system battery, 255 means unknown status
        let present = status.battery_flag != 128 && status.battery_life_percent != 255;
        let is_charging = (status.battery_flag & 8) != 0;
        let power_plugged = status.ac_line_status == 1;

        let percentage = if status.battery_life_percent <= 100 {
            Some(status.battery_life_percent as f32)
        } else {
            None
        };

        let estimated_remaining_minutes = if status.battery_life_time != 0xFFFFFFFF && status.battery_life_time > 0 {
            Some(status.battery_life_time / 60)
        } else {
            None
        };

        Ok(BatteryInfo {
            present,
            percentage,
            is_charging,
            power_plugged,
            estimated_remaining_minutes,
            status_source: "Win32 GetSystemPowerStatus (Instant Native)".into(),
        })
    } else {
        Ok(BatteryInfo {
            present: false,
            percentage: None,
            is_charging: false,
            power_plugged: true,
            estimated_remaining_minutes: None,
            status_source: "Unavailable".into(),
        })
    }
}
