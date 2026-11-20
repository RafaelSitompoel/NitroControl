use thiserror::Error;

#[derive(Error, Debug, Clone, PartialEq)]
pub enum NitroError {
    #[error("Sensor unavailable: {0}")]
    SensorUnavailable(String),

    #[error("Hardware feature not supported: {0}")]
    HardwareNotSupported(String),

    #[error("Permission denied: {0}")]
    PermissionDenied(String),

    #[error("Device disconnected: {0}")]
    DeviceDisconnected(String),

    #[error("Hardware controller unavailable: {0}")]
    ControllerUnavailable(String),

    #[error("Invalid configuration: {0}")]
    InvalidConfiguration(String),

    #[error("Hardware operation failed: {0}")]
    OperationFailed(String),

    #[error("Operation timed out: {0}")]
    Timeout(String),

    #[error("Database error: {0}")]
    DatabaseError(String),

    #[error("Internal error: {0}")]
    Internal(String),
}

pub type Result<T> = std::result::Result<T, NitroError>;
