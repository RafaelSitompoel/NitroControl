use clap::Parser;
use nitrocontrol_core::api::routes::{create_router, AppState};
use nitrocontrol_core::db::Database;
use nitrocontrol_core::hardware::capabilities::HardwareCapabilityDetector;
use nitrocontrol_core::hardware::controllers::PowerController;
use nitrocontrol_core::hardware::discovery::HardwareDiscovery;
use nitrocontrol_core::service::MonitoringService;
use std::net::SocketAddr;
use std::path::PathBuf;
use std::sync::Arc;
use tracing::info;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

#[derive(Parser, Debug)]
#[command(name = "nitrocontrol-daemon")]
#[command(about = "NitroControl - Open-Source Acer NitroSense Alternative Backend")]
struct Args {
    #[arg(long, default_value = "127.0.0.1")]
    host: String,

    #[arg(long, default_value_t = 7878)]
    port: u16,

    #[arg(long)]
    db: Option<PathBuf>,

    #[arg(long, default_value_t = false)]
    no_window: bool,
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "info,nitrocontrol_core=debug,nitrocontrol_daemon=debug".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    let args = Args::parse();

    println!("============================================================");
    println!("  _   _ _ _             ____            _             _ ");
    println!(" | \\ | (_) |_ _ __ ___ / ___|___  _ __ | |_ _ __ ___ | |");
    println!(" |  \\| | | __| '__/ _ \\ |   / _ \\| '_ \\| __| '__/ _ \\| |");
    println!(" | |\\  | | |_| | | (_) | |__| (_) | | | | |_| | | (_) | |");
    println!(" |_| \\_|_|\\__|_|  \\___/ \\____\\___/|_| |_|\\__|_|  \\___/|_|");
    println!("      Open-Source Acer NitroSense Alternative");
    println!("============================================================");

    // Hardware discovery
    let sys_info = HardwareDiscovery::get_system_info()?;
    println!("Hardware Model : {} ({})", sys_info.model, sys_info.manufacturer);
    println!("Operating Sys  : {} {}", sys_info.os_name, sys_info.os_version);
    println!("BIOS Version   : {}", sys_info.bios_version);

    let is_nitro = HardwareDiscovery::is_acer_nitro(&sys_info.model, &sys_info.manufacturer);
    let gen = HardwareDiscovery::detect_nitro_generation(&sys_info.model);
    println!("Acer Nitro HW  : {} (Generation: {})", is_nitro, gen.as_deref().unwrap_or("Generic"));

    let caps = HardwareCapabilityDetector::detect()?;
    println!("Fan Control    : {:?}", caps.fan_control.status);
    if let Some(reason) = &caps.fan_control.reason {
        println!("  Note: {}", reason);
    }
    println!("CoolBoost      : {:?}", caps.coolboost.status);
    println!("GPU Telemetry  : {:?}", caps.gpu_monitoring.status);

    if let Ok(active_scheme) = PowerController::get_active_scheme() {
        println!("Active Power   : {} ({})", active_scheme.name, active_scheme.guid);
    }

    // Database initialization
    let db_path = args.db.unwrap_or_else(|| PathBuf::from("nitrocontrol.db"));
    info!("Opening database at {:?}", db_path);
    let db = Database::open(&db_path)?;
    db.init_default_profiles()?;

    // Service initialization
    let (monitoring_service, _) = MonitoringService::new(db.clone());
    let monitoring_service = Arc::new(monitoring_service);
    monitoring_service.clone().start_background_loop();

    let state = AppState {
        db,
        monitoring: monitoring_service,
    };

    let router = create_router(state);

    let addr: SocketAddr = format!("{}:{}", args.host, args.port).parse()?;
    info!("NitroControl API & WebSocket listening on http://{}", addr);
    println!("REST API & WebSocket live at: http://{}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await?;

    // Auto-launch dedicated standalone desktop app window (unless --no-window passed)
    if !args.no_window {
        launch_desktop_window(args.port);
    }

    axum::serve(listener, router)
        .with_graceful_shutdown(shutdown_signal())
        .await?;

    info!("NitroControl daemon exited gracefully");
    Ok(())
}

fn launch_desktop_window(port: u16) {
    let url = format!("http://127.0.0.1:{}", port);
    let edge_paths = [
        r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
        r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    ];

    let user_data = std::env::var("LOCALAPPDATA")
        .map(|p| format!(r"{}\NitroControl\window_data", p))
        .unwrap_or_else(|_| r".nitrocontrol_data".to_string());

    for path in edge_paths {
        if std::path::Path::new(path).exists() {
            let mut cmd = std::process::Command::new(path);
            cmd.args([
                &format!("--app={}", url),
                "--window-size=1280,850",
                &format!("--user-data-dir={}", user_data),
            ]);
            let _ = cmd.spawn();
            return;
        }
    }

    // Fallback: default browser
    let _ = std::process::Command::new("powershell")
        .args(["-NoProfile", "-Command", &format!("Start-Process '{}'", url)])
        .spawn();
}

async fn shutdown_signal() {
    tokio::signal::ctrl_c()
        .await
        .expect("Failed to listen for Ctrl+C signal");
    info!("Shutdown signal received, terminating NitroControl services...");
}
