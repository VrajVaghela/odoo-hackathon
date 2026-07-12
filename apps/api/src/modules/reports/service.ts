import { ReportsRepository } from './repository.js';
import { FleetReport, VehicleReportRow } from './types.js';

const repository = new ReportsRepository();

function csvCell(value: string | number | null): string {
  const text = value === null ? '' : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

export class ReportsService {
  async getFleetReport(): Promise<FleetReport> {
    const [summary, vehicles] = await Promise.all([
      repository.getFleetSummary(),
      repository.getVehicleReportRows(),
    ]);
    return { summary, vehicles };
  }

  async buildCsv(): Promise<string> {
    const report = await this.getFleetReport();
    const columns: Array<keyof VehicleReportRow> = [
      'registration_number',
      'name',
      'completed_distance_km',
      'fuel_liters',
      'fuel_efficiency_km_per_liter',
      'fuel_cost',
      'maintenance_cost',
      'expense_cost',
      'operational_cost',
      'completed_revenue',
      'acquisition_cost',
      'roi_percent',
    ];
    const header = columns.map((column) => csvCell(column)).join(',');
    const rows = report.vehicles.map((vehicle) => columns.map((column) => csvCell(vehicle[column])).join(','));
    const summary = [
      csvCell('FLEET TOTAL'),
      csvCell(''),
      csvCell(''),
      csvCell(''),
      csvCell(''),
      csvCell(report.summary.fuel_cost),
      csvCell(report.summary.maintenance_cost),
      csvCell(report.summary.expense_cost),
      csvCell(report.summary.operational_cost),
      csvCell(report.summary.completed_revenue),
      csvCell(''),
      csvCell(report.summary.fleet_roi_percent),
    ].join(',');
    return [header, ...rows, summary].join('\r\n');
  }
}
