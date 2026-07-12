export type MaintenanceStatus = 'ACTIVE' | 'CLOSED';

export const MAINTENANCE_STATUS = {
  ACTIVE: 'ACTIVE' as MaintenanceStatus,
  CLOSED: 'CLOSED' as MaintenanceStatus,
} as const;

export interface MaintenanceLog {
  id: number;
  vehicle_id: number;
  service_type: string;
  description: string;
  opened_at: string;
  closed_at: string | null;
  cost: number;
  status: MaintenanceStatus;
}

export interface OpenMaintenanceInput {
  vehicle_id: number;
  service_type: string;
  description: string;
}

export interface CloseMaintenanceInput {
  cost: number;
}
