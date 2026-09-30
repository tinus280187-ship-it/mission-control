export interface SystemMetrics {
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  network_io: {
    bytes_sent: number;
    bytes_recv: number;
    packets_sent: number;
    packets_recv: number;
  };
  uptime: string;
}

export interface GatewayStatus {
  status: string;
  uptime: string;
  version?: string;
  agents_connected: number;
  last_heartbeat: string;
}

export interface DashboardOverview {
  system_metrics: SystemMetrics;
  gateway_status: GatewayStatus;
  active_processes: number;
  kanban_boards: number;
  cron_jobs: number;
  memory_files: number;
}

export interface KanbanCard {
  id: string;
  title: string;
  description?: string;
  column_id: string;
  position: number;
  created_at: string;
  updated_at: string;
  tags: string[];
  assignee?: string;
}

export interface KanbanColumn {
  id: string;
  title: string;
  position: number;
  cards: KanbanCard[];
}

export interface KanbanBoard {
  id: string;
  name: string;
  description?: string;
  columns: KanbanColumn[];
  created_at: string;
  updated_at: string;
}

export interface CronJob {
  id: string;
  schedule: string;
  command: string;
  description?: string;
  enabled: boolean;
  last_run?: string;
  next_run?: string;
  status: string;
}

export interface ProcessInfo {
  pid: number;
  name: string;
  command: string;
  cpu_percent: number;
  memory_percent: number;
  status: string;
  start_time: string;
  user: string;
}

export interface MemoryFile {
  path: string;
  name: string;
  size: number;
  modified: string;
  type: string;
  content_preview?: string;
}

export interface MemoryFolder {
  path: string;
  name: string;
  files: MemoryFile[];
  folders: MemoryFolder[];
  total_files: number;
  total_size: number;
}

export interface LiteratureEntry {
  id: string;
  title: string;
  authors: string[];
  year: number;
  abstract?: string;
  keywords: string[];
  url?: string;
}

export interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  max_tokens: number;
  available: boolean;
  pricing?: Record<string, number>;
}

export interface WSMessage {
  type: string;
  data: any;
  timestamp: string;
}

export interface NavItem {
  path: string;
  label: string;
  icon: React.ComponentType;
}