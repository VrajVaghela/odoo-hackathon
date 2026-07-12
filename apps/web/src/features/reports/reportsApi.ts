export interface ReportSummary {
  fleet_utilisation_percent: number;
  completed_revenue: number;
  fuel_cost: number;
  maintenance_cost: number;
  expense_cost: number;
  operational_cost: number;
  fleet_roi_percent: number | null;
}

export interface VehicleReportRow {
  vehicle_id: number;
  registration_number: string;
  name: string;
  acquisition_cost: number;
  completed_distance_km: number;
  fuel_liters: number;
  fuel_cost: number;
  maintenance_cost: number;
  expense_cost: number;
  operational_cost: number;
  completed_revenue: number;
  fuel_efficiency_km_per_liter: number | null;
  roi_percent: number | null;
}

export interface FleetReport { summary: ReportSummary; vehicles: VehicleReportRow[]; }

export async function fetchFleetReport(): Promise<FleetReport> {
  const response = await fetch('/api/v1/reports/summary');
  if (!response.ok) throw new Error((await response.json().catch(() => ({ error: {} }))).error?.message || 'Could not load reports.');
  return response.json() as Promise<FleetReport>;
}

export async function downloadFleetCsv(): Promise<Blob> {
  const response = await fetch('/api/v1/reports/export.csv');
  if (!response.ok) throw new Error('Could not export the report.');
  return response.blob();
}
