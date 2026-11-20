use crate::db::Database;
use crate::hardware::HardwareSensors;
use crate::types::sensors::TelemetrySnapshot;
use parking_lot::RwLock;
use std::sync::Arc;
use std::time::Duration;
use tokio::sync::broadcast;
use tracing::{error, info, warn};

pub struct MonitoringService {
    sensors: Arc<HardwareSensors>,
    db: Database,
    tx: broadcast::Sender<TelemetrySnapshot>,
    latest: Arc<RwLock<Option<TelemetrySnapshot>>>,
}

impl MonitoringService {
    pub fn new(db: Database) -> (Self, broadcast::Receiver<TelemetrySnapshot>) {
        let (tx, rx) = broadcast::channel(100);
        let service = Self {
            sensors: Arc::new(HardwareSensors::new()),
            db,
            tx,
            latest: Arc::new(RwLock::new(None)),
        };
        (service, rx)
    }

    pub fn subscribe(&self) -> broadcast::Receiver<TelemetrySnapshot> {
        self.tx.subscribe()
    }

    pub fn current_snapshot(&self) -> crate::error::Result<TelemetrySnapshot> {
        if let Some(snap) = self.latest.read().as_ref() {
            return Ok(snap.clone());
        }
        let snap = self.sensors.snapshot()?;
        *self.latest.write() = Some(snap.clone());
        Ok(snap)
    }

    pub fn start_background_loop(self: Arc<Self>) {
        tokio::spawn(async move {
            info!("NitroControl background monitoring service started");
            let mut tick_counter: u64 = 0;

            loop {
                let interval_ms = match self.db.get_settings() {
                    Ok(s) => s.refresh_interval_ms.clamp(500, 10000),
                    Err(_) => 1000,
                };

                match self.sensors.snapshot() {
                    Ok(snapshot) => {
                        *self.latest.write() = Some(snapshot.clone());

                        // High temperature check
                        if let Ok(settings) = self.db.get_settings() {
                            if settings.high_temp_alerts_enabled {
                                if let Some(cpu_t) = snapshot.cpu.temperature_celsius {
                                    if cpu_t >= settings.high_temp_alert_celsius {
                                        warn!("CPU temperature alert: {:.1}°C exceeds limit {:.1}°C", cpu_t, settings.high_temp_alert_celsius);
                                    }
                                }
                                if let Some(gpu) = &snapshot.gpu {
                                    if let Some(gpu_t) = gpu.temperature_celsius {
                                        if gpu_t >= settings.high_temp_alert_celsius {
                                            warn!("GPU temperature alert: {:.1}°C exceeds limit {:.1}°C", gpu_t, settings.high_temp_alert_celsius);
                                        }
                                    }
                                }
                            }
                        }

                        // Store in SQLite every ~2 seconds
                        let record_to_db = if interval_ms >= 2000 {
                            true
                        } else {
                            tick_counter % (2000 / interval_ms).max(1) == 0
                        };

                        if record_to_db {
                            if let Err(e) = self.db.record_snapshot(&snapshot) {
                                error!("Failed to persist telemetry snapshot: {}", e);
                            }
                        }

                        // Broadcast to WebSocket subscribers
                        let _ = self.tx.send(snapshot);
                    }
                    Err(e) => {
                        error!("Failed to capture sensor snapshot: {}", e);
                    }
                }

                tick_counter = tick_counter.wrapping_add(1);
                tokio::time::sleep(Duration::from_millis(interval_ms)).await;
            }
        });
    }
}
