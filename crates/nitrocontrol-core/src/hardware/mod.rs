pub mod acer;
pub mod capabilities;
pub mod controllers;
pub mod discovery;
pub mod sensors;

pub use capabilities::HardwareCapabilityDetector;
pub use discovery::HardwareDiscovery;
pub use sensors::HardwareSensors;
