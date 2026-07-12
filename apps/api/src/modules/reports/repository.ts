import { RowDataPacket } from 'mysql2/promise';
import pool from '../../db/pool.js';
import { FleetReportSummary, VehicleReportRow } from './types.js';

export class ReportsRepository {
  async getFleetSummary(): Promise<FleetReportSummary> {
    const [utilisationRows] = await pool.query<RowDataPacket[]>(
      `SELECT
         SUM(CASE WHEN status = 'ON_TRIP' THEN 1 ELSE 0 END) AS on_trip_count,
         SUM(CASE WHEN status <> 'RETIRED' THEN 1 ELSE 0 END) AS active_count
       FROM vehicles`,
    );
    const [costRows] = await pool.query<RowDataPacket[]>(
      `SELECT
         (SELECT COALESCE(SUM(cost), 0) FROM fuel_logs) AS fuel_cost,
         (SELECT COALESCE(SUM(cost), 0) FROM maintenance_logs WHERE status = 'CLOSED') AS maintenance_cost,
         (SELECT COALESCE(SUM(amount), 0) FROM expenses) AS expense_cost,
         (SELECT COALESCE(SUM(revenue), 0) FROM trips WHERE status = 'COMPLETED') AS completed_revenue,
         (SELECT COALESCE(SUM(acquisition_cost), 0) FROM vehicles WHERE status <> 'RETIRED') AS active_acquisition_cost`,
    );

    const utilisation = utilisationRows[0];
    const costs = costRows[0];
    const activeCount = Number(utilisation.active_count);
    const onTripCount = Number(utilisation.on_trip_count);
    const fuelCost = Number(costs.fuel_cost);
    const maintenanceCost = Number(costs.maintenance_cost);
    const expenseCost = Number(costs.expense_cost);
    const completedRevenue = Number(costs.completed_revenue);
    const acquisitionCost = Number(costs.active_acquisition_cost);

    return {
      fleet_utilisation_percent: activeCount > 0 ? Math.round((onTripCount / activeCount) * 100) : 0,
      completed_revenue: completedRevenue,
      fuel_cost: fuelCost,
      maintenance_cost: maintenanceCost,
      expense_cost: expenseCost,
      operational_cost: fuelCost + maintenanceCost + expenseCost,
      fleet_roi_percent: acquisitionCost > 0
        ? Number((((completedRevenue - fuelCost - maintenanceCost) / acquisitionCost) * 100).toFixed(2))
        : null,
    };
  }

  async getVehicleReportRows(): Promise<VehicleReportRow[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT
         v.id AS vehicle_id,
         v.registration_number,
         v.name,
         v.acquisition_cost,
         COALESCE(trips.completed_distance_km, 0) AS completed_distance_km,
         COALESCE(fuel.fuel_liters, 0) AS fuel_liters,
         COALESCE(fuel.fuel_cost, 0) AS fuel_cost,
         COALESCE(maintenance.maintenance_cost, 0) AS maintenance_cost,
         COALESCE(expenses.expense_cost, 0) AS expense_cost,
         COALESCE(trips.completed_revenue, 0) AS completed_revenue
       FROM vehicles v
       LEFT JOIN (
         SELECT vehicle_id, SUM(actual_distance_km) AS completed_distance_km, SUM(revenue) AS completed_revenue
         FROM trips
         WHERE status = 'COMPLETED'
         GROUP BY vehicle_id
       ) trips ON trips.vehicle_id = v.id
       LEFT JOIN (
         SELECT vehicle_id, SUM(liters) AS fuel_liters, SUM(cost) AS fuel_cost
         FROM fuel_logs
         GROUP BY vehicle_id
       ) fuel ON fuel.vehicle_id = v.id
       LEFT JOIN (
         SELECT vehicle_id, SUM(cost) AS maintenance_cost
         FROM maintenance_logs
         WHERE status = 'CLOSED'
         GROUP BY vehicle_id
       ) maintenance ON maintenance.vehicle_id = v.id
       LEFT JOIN (
         SELECT vehicle_id, SUM(amount) AS expense_cost
         FROM expenses
         WHERE vehicle_id IS NOT NULL
         GROUP BY vehicle_id
       ) expenses ON expenses.vehicle_id = v.id
       ORDER BY v.registration_number`,
    );

    return rows.map((row) => {
      const fuelCost = Number(row.fuel_cost);
      const maintenanceCost = Number(row.maintenance_cost);
      const expenseCost = Number(row.expense_cost);
      const completedRevenue = Number(row.completed_revenue);
      const acquisitionCost = Number(row.acquisition_cost);
      const fuelLiters = Number(row.fuel_liters);
      const completedDistance = Number(row.completed_distance_km);

      return {
        vehicle_id: Number(row.vehicle_id),
        registration_number: String(row.registration_number),
        name: String(row.name),
        acquisition_cost: acquisitionCost,
        completed_distance_km: completedDistance,
        fuel_liters: fuelLiters,
        fuel_cost: fuelCost,
        maintenance_cost: maintenanceCost,
        expense_cost: expenseCost,
        operational_cost: fuelCost + maintenanceCost + expenseCost,
        completed_revenue: completedRevenue,
        fuel_efficiency_km_per_liter: fuelLiters > 0
          ? Number((completedDistance / fuelLiters).toFixed(2))
          : null,
        roi_percent: acquisitionCost > 0
          ? Number((((completedRevenue - fuelCost - maintenanceCost) / acquisitionCost) * 100).toFixed(2))
          : null,
      };
    });
  }
}
