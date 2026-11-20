use nitrocontrol_core::db::Database;
use nitrocontrol_core::hardware::discovery::HardwareDiscovery;
use nitrocontrol_core::types::capabilities::CapabilityStatus;
use nitrocontrol_core::types::profiles::{FanMode, PowerMode, Profile};
use nitrocontrol_core::types::settings::AppSettings;

#[test]
fn test_nitro_model_detection() {
    assert!(HardwareDiscovery::is_acer_nitro("Nitro ANV15-51", "Acer"));
    assert!(HardwareDiscovery::is_acer_nitro("Nitro AN515-58", "Acer"));
    assert!(HardwareDiscovery::is_acer_nitro("AN16-41", "Acer"));
    assert!(HardwareDiscovery::is_acer_nitro("Predator Nitro 17", "Acer"));
    assert!(!HardwareDiscovery::is_acer_nitro("ThinkPad X1", "Lenovo"));
    assert!(!HardwareDiscovery::is_acer_nitro("Aspire 5", "Acer"));

    assert_eq!(
        HardwareDiscovery::detect_nitro_generation("Nitro ANV15-51"),
        Some("Nitro V".to_string())
    );
    assert_eq!(
        HardwareDiscovery::detect_nitro_generation("Nitro AN515-58"),
        Some("Nitro 5".to_string())
    );
    assert_eq!(
        HardwareDiscovery::detect_nitro_generation("Nitro AN16-41"),
        Some("Nitro 16".to_string())
    );
    assert_eq!(
        HardwareDiscovery::detect_nitro_generation("Nitro AN17-51"),
        Some("Nitro 17".to_string())
    );
}

#[test]
fn test_database_settings_crud() {
    let db = Database::open_in_memory().expect("Failed to open in-memory database");
    let initial_settings = db.get_settings().expect("Failed to fetch initial settings");
    assert_eq!(initial_settings.refresh_interval_ms, 1000);
    assert_eq!(initial_settings.api_port, 7878);

    let mut modified = initial_settings.clone();
    modified.refresh_interval_ms = 500;
    modified.high_temp_alert_celsius = 90.0;
    db.save_settings(&modified).expect("Failed to save settings");

    let loaded = db.get_settings().expect("Failed to reload settings");
    assert_eq!(loaded.refresh_interval_ms, 500);
    assert_eq!(loaded.high_temp_alert_celsius, 90.0);
}

#[test]
fn test_database_profiles() {
    let db = Database::open_in_memory().expect("Failed to open in-memory database");
    db.init_default_profiles().expect("Failed to init default profiles");

    let profiles = db.list_profiles().expect("Failed to list profiles");
    assert!(profiles.len() >= 4);

    let balanced = profiles.iter().find(|p| p.id == "balanced");
    assert!(balanced.is_some());
    assert!(balanced.unwrap().is_active);

    // Activate Gaming profile
    let activated = db.activate_profile("gaming").expect("Failed to activate gaming profile");
    assert_eq!(activated.id, "gaming");
    assert!(activated.is_active);

    let reloaded = db.list_profiles().expect("Failed to reload profiles");
    let old_balanced = reloaded.iter().find(|p| p.id == "balanced").unwrap();
    let new_gaming = reloaded.iter().find(|p| p.id == "gaming").unwrap();
    assert!(!old_balanced.is_active);
    assert!(new_gaming.is_active);

    // Custom profile creation
    let custom = Profile {
        id: "custom_quiet".into(),
        name: "Custom Quiet".into(),
        is_active: false,
        is_builtin: false,
        power_mode: PowerMode::Quiet,
        fan_mode: FanMode::Auto,
        fan_curve: None,
        coolboost_enabled: false,
        refresh_rate_ms: 2000,
        description: Some("Custom low-noise mode".into()),
    };
    db.save_profile(&custom).expect("Failed to save custom profile");

    let custom_reloaded = db.get_profile("custom_quiet").expect("Failed to get custom profile");
    assert!(custom_reloaded.is_some());
    assert_eq!(custom_reloaded.unwrap().name, "Custom Quiet");

    // Deletion
    db.delete_profile("custom_quiet").expect("Failed to delete custom profile");
    let after_delete = db.get_profile("custom_quiet").expect("Failed to check deleted profile");
    assert!(after_delete.is_none());

    // Deletion of built-in should fail
    let delete_builtin_res = db.delete_profile("gaming");
    assert!(delete_builtin_res.is_err());
}
