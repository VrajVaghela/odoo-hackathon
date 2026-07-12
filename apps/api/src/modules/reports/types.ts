export interface FleetReportSummary {
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

export interface FleetReport {
  summary: FleetReportSummary;
  vehicles: VehicleReportRow[];
}
