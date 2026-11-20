use crate::service::MonitoringService;
use axum::{
    extract::{
        ws::{Message, WebSocket},
        State, WebSocketUpgrade,
    },
    response::Response,
};
use std::sync::Arc;
use tracing::{debug, warn};

pub async fn ws_monitoring_handler(
    ws: WebSocketUpgrade,
    State(service): State<Arc<MonitoringService>>,
) -> Response {
    ws.on_upgrade(move |socket| handle_socket(socket, service))
}

async fn handle_socket(mut socket: WebSocket, service: Arc<MonitoringService>) {
    debug!("New WebSocket client connected to /ws/monitoring");
    let mut rx = service.subscribe();

    // Send immediate initial snapshot
    if let Ok(initial) = service.current_snapshot() {
        if let Ok(json) = serde_json::to_string(&initial) {
            if socket.send(Message::Text(json.into())).await.is_err() {
                return;
            }
        }
    }

    loop {
        tokio::select! {
            snapshot_res = rx.recv() => {
                match snapshot_res {
                    Ok(snapshot) => {
                        if let Ok(json) = serde_json::to_string(&snapshot) {
                            if socket.send(Message::Text(json.into())).await.is_err() {
                                break;
                            }
                        }
                    }
                    Err(tokio::sync::broadcast::error::RecvError::Lagged(missed)) => {
                        warn!("WebSocket client lagged behind, missed {} messages", missed);
                    }
                    Err(tokio::sync::broadcast::error::RecvError::Closed) => {
                        break;
                    }
                }
            }
            msg = socket.recv() => {
                match msg {
                    Some(Ok(Message::Close(_))) | None => break,
                    Some(Ok(Message::Ping(payload))) => {
                        if socket.send(Message::Pong(payload)).await.is_err() {
                            break;
                        }
                    }
                    _ => {}
                }
            }
        }
    }
    debug!("WebSocket client disconnected from /ws/monitoring");
}
