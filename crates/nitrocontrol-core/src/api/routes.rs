use crate::api::ws::ws_monitoring_handler;
use crate::db::Database;
use crate::hardware::capabilities::HardwareCapabilityDetector;
use crate::hardware::controllers::{BatteryLimiterController, CoolBoostController, FanController, PowerController};
use crate::hardware::discovery::HardwareDiscovery;
use crate::service::MonitoringService;
use crate::types::api_models::{
    ApiResponse, BatteryLimiterRequest, CoolBoostRequest, FanControlRequest, PowerModeRequest,
    ProfileActivateRequest, SensorHistoryQuery,
};
use crate::types::profiles::Profile;
use crate::types::settings::AppSettings;
use axum::{
    extract::{Path, Query},
    http::StatusCode,
    response::IntoResponse,
    routing::{delete, get, post},
    Json, Router,
};
use std::sync::Arc;
use tower_http::cors::{Any, CorsLayer};
use tower_http::services::{ServeDir, ServeFile};

#[derive(Clone)]
pub struct AppState {
    pub db: Database,
    pub monitoring: Arc<MonitoringService>,
}

pub fn create_router(state: AppState) -> Router {
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    let dist_path = std::path::Path::new("frontend/dist");
    let fallback = ServeFile::new(dist_path.join("index.html"));
    let static_service = ServeDir::new(dist_path).fallback(fallback);

    Router::new()
        // Health
        .route("/api/v1/status", get(get_status))
        // WebSocket
        .route("/ws/monitoring", get(ws_monitoring_handler))
        // System & Hardware
        .route("/api/v1/system", get(get_system_info))
        .route("/api/v1/system/elevate", post(elevate_app))
        .route("/api/v1/hardware", get(get_hardware_info))
        .route("/api/v1/capabilities", get(get_capabilities))
        // Sensors & Telemetry
        .route("/api/v1/sensors", get(get_sensors))
        .route("/api/v1/temperatures", get(get_temperatures))
        .route("/api/v1/fans", get(get_fans))
        // History
        .route("/api/v1/history", get(get_history))
        .route("/api/v1/history/export", get(export_history_csv))
        .route("/api/v1/history/clear", post(clear_history))
        // Performance & Hardware Controls
        .route("/api/v1/performance", get(get_performance_schemes))
        .route("/api/v1/performance/mode", post(set_performance_mode))
        .route("/api/v1/fans/mode", post(set_fan_mode))
        .route("/api/v1/coolboost", post(set_coolboost))
        // Battery Limiter
        .route("/api/v1/battery/limit", get(get_battery_limit))
        .route("/api/v1/battery/limit", post(set_battery_limit))
        // Profiles
        .route("/api/v1/profiles", get(list_profiles))
        .route("/api/v1/profiles", post(save_profile))
        .route("/api/v1/profiles/activate", post(activate_profile))
        .route("/api/v1/profiles/:id", delete(delete_profile))
        // Settings
        .route("/api/v1/settings", get(get_settings))
        .route("/api/v1/settings", post(update_settings))
        .fallback_service(static_service)
        .layer(cors)
        .with_state(state.monitoring.clone())
        .layer(axum::Extension(state))
}

async fn get_status() -> impl IntoResponse {
    (StatusCode::OK, Json(ApiResponse::ok("NitroControl backend running")))
}

async fn elevate_app() -> impl IntoResponse {
    let desktop_exe = r"C:\Users\ACER NITRO\Documents\NitroControl\NitroControl-Desktop\NitroControl.exe";
    let script = format!("Start-Process '{}' -Verb RunAs", desktop_exe);
    let _ = std::process::Command::new("powershell")
        .args(["-NoProfile", "-Command", &script])
        .spawn();

    tokio::spawn(async {
        tokio::time::sleep(std::time::Duration::from_millis(500)).await;
        std::process::exit(0);
    });

    (StatusCode::OK, Json(ApiResponse::ok("Elevation requested. Click 'Yes' on Windows prompt.")))
}

// Handler implementations

async fn get_system_info() -> impl IntoResponse {
    match HardwareDiscovery::get_system_info() {
        Ok(info) => (StatusCode::OK, Json(ApiResponse::ok(info))),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::err(e.to_string()))),
    }
}

async fn get_hardware_info(
    axum::Extension(state): axum::Extension<AppState>,
) -> impl IntoResponse {
    match state.monitoring.current_snapshot() {
        Ok(snapshot) => {
            let data = serde_json::json!({
                "cpu": snapshot.cpu,
                "gpu": snapshot.gpu,
                "ram": snapshot.ram,
                "battery": snapshot.battery,
            });
            (StatusCode::OK, Json(ApiResponse::ok(data)))
        }
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::err(e.to_string()))),
    }
}

async fn get_capabilities() -> impl IntoResponse {
    match HardwareCapabilityDetector::detect() {
        Ok(caps) => (StatusCode::OK, Json(ApiResponse::ok(caps))),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::err(e.to_string()))),
    }
}

async fn get_sensors(
    axum::Extension(state): axum::Extension<AppState>,
) -> impl IntoResponse {
    match state.monitoring.current_snapshot() {
        Ok(snapshot) => (StatusCode::OK, Json(ApiResponse::ok(snapshot))),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::err(e.to_string()))),
    }
}

async fn get_temperatures(
    axum::Extension(state): axum::Extension<AppState>,
) -> impl IntoResponse {
    match state.monitoring.current_snapshot() {
        Ok(snapshot) => {
            let data = serde_json::json!({
                "cpu_temp": snapshot.cpu.temperature_celsius,
                "gpu_temp": snapshot.gpu.as_ref().and_then(|g| g.temperature_celsius),
                "timestamp": snapshot.timestamp,
            });
            (StatusCode::OK, Json(ApiResponse::ok(data)))
        }
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::err(e.to_string()))),
    }
}

async fn get_fans(
    axum::Extension(state): axum::Extension<AppState>,
) -> impl IntoResponse {
    match state.monitoring.current_snapshot() {
        Ok(snapshot) => (StatusCode::OK, Json(ApiResponse::ok(snapshot.fans))),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::err(e.to_string()))),
    }
}

async fn get_history(
    axum::Extension(state): axum::Extension<AppState>,
    Query(query): Query<SensorHistoryQuery>,
) -> impl IntoResponse {
    let range = query.range.as_deref().unwrap_or("30m");
    match state.db.query_history(range, query.limit) {
        Ok(history) => (StatusCode::OK, Json(ApiResponse::ok(history))),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::err(e.to_string()))),
    }
}

async fn export_history_csv(
    axum::Extension(state): axum::Extension<AppState>,
    Query(query): Query<SensorHistoryQuery>,
) -> impl IntoResponse {
    let range = query.range.as_deref().unwrap_or("1h");
    match state.db.export_csv(range) {
        Ok(csv) => (
            StatusCode::OK,
            [("Content-Type", "text/csv"), ("Content-Disposition", "attachment; filename=\"nitrocontrol_history.csv\"")],
            csv,
        ).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse::<String>::err(e.to_string())),
        ).into_response(),
    }
}

async fn clear_history(
    axum::Extension(state): axum::Extension<AppState>,
) -> impl IntoResponse {
    match state.db.clear_history() {
        Ok(_) => (StatusCode::OK, Json(ApiResponse::ok("Monitoring history cleared successfully"))),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::err(e.to_string()))),
    }
}

async fn get_performance_schemes() -> impl IntoResponse {
    match PowerController::list_available_schemes() {
        Ok(schemes) => {
            let active = PowerController::get_active_scheme().ok();
            let data = serde_json::json!({
                "active_scheme": active,
                "available_schemes": schemes,
            });
            (StatusCode::OK, Json(ApiResponse::ok(data)))
        }
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::err(e.to_string()))),
    }
}

async fn set_performance_mode(
    Json(payload): Json<PowerModeRequest>,
) -> impl IntoResponse {
    match PowerController::set_power_mode(&payload.mode) {
        Ok(active) => (StatusCode::OK, Json(ApiResponse::ok(active))),
        Err(e) => (StatusCode::BAD_REQUEST, Json(ApiResponse::err(e.to_string()))),
    }
}

async fn set_fan_mode(
    Json(payload): Json<FanControlRequest>,
) -> impl IntoResponse {
    match FanController::set_mode(&payload.mode, payload.speed_percent) {
        Ok(_) => (StatusCode::OK, Json(ApiResponse::ok("Fan configuration updated successfully"))),
        Err(e) => {
            let status = match e {
                crate::error::NitroError::PermissionDenied(_) => StatusCode::FORBIDDEN,
                crate::error::NitroError::HardwareNotSupported(_) => StatusCode::NOT_IMPLEMENTED,
                _ => StatusCode::BAD_REQUEST,
            };
            (status, Json(ApiResponse::err(e.to_string())))
        }
    }
}

async fn set_coolboost(
    Json(payload): Json<CoolBoostRequest>,
) -> impl IntoResponse {
    match CoolBoostController::set_enabled(payload.enabled) {
        Ok(_) => (StatusCode::OK, Json(ApiResponse::ok("CoolBoost state updated successfully"))),
        Err(e) => {
            let status = match e {
                crate::error::NitroError::PermissionDenied(_) => StatusCode::FORBIDDEN,
                crate::error::NitroError::HardwareNotSupported(_) => StatusCode::NOT_IMPLEMENTED,
                _ => StatusCode::BAD_REQUEST,
            };
            (status, Json(ApiResponse::err(e.to_string())))
        }
    }
}

async fn list_profiles(
    axum::Extension(state): axum::Extension<AppState>,
) -> impl IntoResponse {
    match state.db.list_profiles() {
        Ok(profiles) => (StatusCode::OK, Json(ApiResponse::ok(profiles))),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::err(e.to_string()))),
    }
}

async fn save_profile(
    axum::Extension(state): axum::Extension<AppState>,
    Json(profile): Json<Profile>,
) -> impl IntoResponse {
    match state.db.save_profile(&profile) {
        Ok(_) => (StatusCode::OK, Json(ApiResponse::ok(profile))),
        Err(e) => (StatusCode::BAD_REQUEST, Json(ApiResponse::err(e.to_string()))),
    }
}

async fn activate_profile(
    axum::Extension(state): axum::Extension<AppState>,
    Json(payload): Json<ProfileActivateRequest>,
) -> impl IntoResponse {
    match state.db.activate_profile(&payload.profile_id) {
        Ok(profile) => {
            // Apply Windows power plan corresponding to the profile
            let mode_str = match profile.power_mode {
                crate::types::profiles::PowerMode::Quiet => "quiet",
                crate::types::profiles::PowerMode::Balanced => "balanced",
                crate::types::profiles::PowerMode::Performance => "performance",
            };
            let _ = PowerController::set_power_mode(mode_str);

            (StatusCode::OK, Json(ApiResponse::ok(profile)))
        }
        Err(e) => (StatusCode::BAD_REQUEST, Json(ApiResponse::err(e.to_string()))),
    }
}

async fn delete_profile(
    axum::Extension(state): axum::Extension<AppState>,
    Path(id): Path<String>,
) -> impl IntoResponse {
    match state.db.delete_profile(&id) {
        Ok(_) => (StatusCode::OK, Json(ApiResponse::ok("Profile deleted successfully"))),
        Err(e) => (StatusCode::BAD_REQUEST, Json(ApiResponse::err(e.to_string()))),
    }
}

async fn get_settings(
    axum::Extension(state): axum::Extension<AppState>,
) -> impl IntoResponse {
    match state.db.get_settings() {
        Ok(settings) => (StatusCode::OK, Json(ApiResponse::ok(settings))),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::err(e.to_string()))),
    }
}

async fn update_settings(
    axum::Extension(state): axum::Extension<AppState>,
    Json(settings): Json<AppSettings>,
) -> impl IntoResponse {
    match state.db.save_settings(&settings) {
        Ok(_) => (StatusCode::OK, Json(ApiResponse::ok(settings))),
        Err(e) => (StatusCode::BAD_REQUEST, Json(ApiResponse::err(e.to_string()))),
    }
}

// ── Battery Limiter ──────────────────────────────────────────────────────────

async fn get_battery_limit() -> impl IntoResponse {
    match BatteryLimiterController::get_state() {
        Ok(enabled) => {
            let data = serde_json::json!({
                "enabled": enabled,
                "limit_percent": if enabled { 80 } else { 100 },
                "description": if enabled {
                    "80% BattCare limit active — extends battery lifespan"
                } else {
                    "No charge limit — battery charges to 100%"
                }
            });
            (StatusCode::OK, Json(ApiResponse::ok(data)))
        }
        Err(e) => {
            let status = match e {
                crate::error::NitroError::PermissionDenied(_) => StatusCode::FORBIDDEN,
                _ => StatusCode::INTERNAL_SERVER_ERROR,
            };
            (status, Json(ApiResponse::err(e.to_string())))
        }
    }
}

async fn set_battery_limit(
    Json(payload): Json<BatteryLimiterRequest>,
) -> impl IntoResponse {
    match BatteryLimiterController::set_enabled(payload.enabled) {
        Ok(_) => {
            let msg = if payload.enabled {
                "Battery charge limit set to 80% — BattCare active"
            } else {
                "Battery charge limit removed — full charge enabled"
            };
            (StatusCode::OK, Json(ApiResponse::ok(msg)))
        }
        Err(e) => {
            let status = match e {
                crate::error::NitroError::PermissionDenied(_) => StatusCode::FORBIDDEN,
                crate::error::NitroError::HardwareNotSupported(_) => StatusCode::NOT_IMPLEMENTED,
                _ => StatusCode::BAD_REQUEST,
            };
            (status, Json(ApiResponse::err(e.to_string())))
        }
    }
}
