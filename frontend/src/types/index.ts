export type CapabilityStatus =
  | 'Supported'
  | 'Unsupported'
  | 'Unavailable'
  | 'PermissionDenied'
  | 'TemporarilyUnavailable'
  | 'NotTested';

export interface CapabilityItem {
  name: string;
  status: CapabilityStatus;
  reason?: string;
  details?: string;
}

export interface HardwareCapabilities {
  system_model: string;
  manufacturer: string;
  is_acer_nitro: boolean;
  detected_generation?: string;
  cpu_monitoring: CapabilityItem;
  gpu_monitoring: CapabilityItem;
  ram_monitoring: CapabilityItem;
  battery_monitoring: CapabilityItem;
  fan_rpm_monitoring: CapabilityItem;
  fan_control: CapabilityItem;
  coolboost: CapabilityItem;
  power_modes: CapabilityItem;
  fan_curves: CapabilityItem;
  overclocking: CapabilityItem;
}

export interface SystemInfo {
  model: string;
  manufacturer: string;
  os_name: string;
  os_version: string;
  bios_version: string;
  hostname: string;
  uptime_secs: number;
}

export interface BatteryInfo {
  present: boolean;
  percentage?: number;
  is_charging: boolean;
  power_plugged: boolean;
  estimated_remaining_minutes?: number;
  status_source: string;
}

export interface CpuMetrics {
  model: string;
  cores_physical: number;
  threads_logical: number;
  usage_percent: number;
  frequency_mhz: number;
  temperature_celsius?: number;
  power_watts?: number;
  source: string;
}

export interface GpuMetrics {
  model: string;
  vendor: string;
  usage_percent?: number;
  temperature_celsius?: number;
  frequency_mhz?: number;
  memory_used_bytes: number;
  memory_total_bytes: number;
  power_watts?: number;
  power_limit_watts?: number;
  source: string;
}

export interface RamMetrics {
  total_bytes: number;
  used_bytes: number;
  available_bytes: number;
  usage_percent: number;
  source: string;
}

export interface FanMetrics {
  fan_id: number;
  name: string;
  current_rpm?: number;
  speed_percent?: number;
  mode: string;
  status: string;
  source: string;
}

export interface TelemetrySnapshot {
  timestamp: string;
  cpu: CpuMetrics;
  gpu?: GpuMetrics;
  ram: RamMetrics;
  fans: FanMetrics[];
  battery: BatteryInfo;
}

export interface FanCurvePoint {
  temp_c: number;
  speed_percent: number;
}

export interface Profile {
  id: string;
  name: string;
  is_active: boolean;
  is_builtin: boolean;
  power_mode: 'quiet' | 'balanced' | 'performance';
  fan_mode: 'auto' | 'max' | 'custom';
  fan_curve?: FanCurvePoint[];
  coolboost_enabled: boolean;
  refresh_rate_ms: number;
  description?: string;
}

export interface AppSettings {
  refresh_interval_ms: number;
  start_with_windows: boolean;
  minimize_to_tray: boolean;
  high_temp_alert_celsius: number;
  high_temp_alerts_enabled: boolean;
  api_port: number;
  api_bind_local_only: boolean;
  api_token?: string;
  dark_theme: boolean;
  history_retention_hours: number;
}

export interface HistoricalDataPoint {
  id: number;
  timestamp: string;
  cpu_usage: number;
  cpu_temp?: number;
  cpu_freq: number;
  gpu_usage?: number;
  gpu_temp?: number;
  gpu_freq?: number;
  gpu_vram_used?: number;
  ram_usage: number;
  ram_used: number;
  fan1_rpm?: number;
  fan2_rpm?: number;
  battery_percent?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}
