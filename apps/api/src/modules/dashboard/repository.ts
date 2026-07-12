import pool from '../../db/pool.js';

export interface DashboardKPIs {
  activeVehicles: {
    total: number;
    onTrip: number;
    inShop: number;
    available: number;
  };
  availableDrivers: {
    total: number;
    names: string[];
  };
  pendingDispatches: {
    total: number;
    draftTripCodes: string[];
  };
  fleetUtilization: {
    value: string;
  };
}

export interface DashboardTrip {
  id: number;
  trip_code: string;
  source: string;
  destination: string;
  cargo_weight_kg: number;
  planned_distance_km: number;
  actual_distance_km: number | null;
  status: string;
  revenue: number;
  dispatched_at: string | null;
  completed_at: string | null;
  vehicle_id: number | null;
  vehicle_registration_number: string | null;
  vehicle_name: string | null;
  vehicle_type: string | null;
  vehicle_region: string | null;
  driver_id: number | null;
  driver_name: string | null;
}

export class DashboardRepository {
  /**
   * Get vehicle count breakdown matching filters (vehicleType, region).
   */
  async getVehicleBreakdown(filters: { vehicleType?: string; region?: string }): Promise<{
    total: number;
    onTrip: number;
    inShop: number;
    available: number;
  }> {
    const whereClauses = ['retired_at IS NULL'];
    const values: any[] = [];

    if (filters.vehicleType) {
      whereClauses.push('vehicle_type = ?');
      values.push(filters.vehicleType);
    }
    if (filters.region) {
      whereClauses.push('region = ?');
      values.push(filters.region);
    }

    const whereSql = `WHERE ${whereClauses.join(' AND ')}`;

    const [rows] = await pool.query(
      `SELECT status, COUNT(*) as count FROM vehicles ${whereSql} GROUP BY status`,
      values
    );

    let total = 0;
    let onTrip = 0;
    let inShop = 0;
    let available = 0;

    for (const row of rows as any[]) {
      const count = Number(row.count);
      total += count;
      if (row.status === 'AVAILABLE') available = count;
      if (row.status === 'ON_TRIP') onTrip = count;
      if (row.status === 'IN_SHOP') inShop = count;
    }

    return { total, onTrip, inShop, available };
  }

  /**
   * Get available drivers count and their names.
   */
  async getAvailableDrivers(): Promise<{ total: number; names: string[] }> {
    const [rows] = await pool.query(
      `SELECT full_name FROM drivers WHERE status = 'AVAILABLE' AND licence_expiry_date >= CURDATE()`
    );

    const names = (rows as any[]).map(r => r.full_name);
    return {
      total: names.length,
      names,
    };
  }

  /**
   * Get pending dispatches (DRAFT trips) matching filters.
   */
  async getPendingDispatches(filters: { vehicleType?: string; region?: string }): Promise<{
    total: number;
    draftTripCodes: string[];
  }> {
    const whereClauses = ["t.status = 'DRAFT'"];
    const values: any[] = [];

    if (filters.vehicleType || filters.region) {
      // Join with vehicles to filter by vehicle properties
      whereClauses.push('t.vehicle_id IS NOT NULL');
      if (filters.vehicleType) {
        whereClauses.push('v.vehicle_type = ?');
        values.push(filters.vehicleType);
      }
      if (filters.region) {
        whereClauses.push('v.region = ?');
        values.push(filters.region);
      }

      const [rows] = await pool.query(
        `SELECT t.trip_code FROM trips t
         JOIN vehicles v ON t.vehicle_id = v.id
         WHERE ${whereClauses.join(' AND ')}`,
        values
      );

      const codes = (rows as any[]).map(r => r.trip_code);
      return { total: codes.length, draftTripCodes: codes };
    } else {
      // No vehicle filters, select all drafts
      const [rows] = await pool.query(
        `SELECT trip_code FROM trips WHERE status = 'DRAFT'`
      );
      const codes = (rows as any[]).map(r => r.trip_code);
      return { total: codes.length, draftTripCodes: codes };
    }
  }

  /**
   * Get retired vehicles count matching filters.
   */
  async getRetiredVehiclesCount(filters: { vehicleType?: string; region?: string }): Promise<number> {
    const whereClauses = ['retired_at IS NOT NULL'];
    const values: any[] = [];

    if (filters.vehicleType) {
      whereClauses.push('vehicle_type = ?');
      values.push(filters.vehicleType);
    }
    if (filters.region) {
      whereClauses.push('region = ?');
      values.push(filters.region);
    }

    const whereSql = `WHERE ${whereClauses.join(' AND ')}`;
    const [rows] = await pool.query(
      `SELECT COUNT(*) as count FROM vehicles ${whereSql}`,
      values
    );

    return Number((rows as any[])[0].count);
  }

  /**
   * Get total drivers count.
   */
  async getTotalDriversCount(): Promise<number> {
    const [rows] = await pool.query(`SELECT COUNT(*) as count FROM drivers`);
    return Number((rows as any[])[0].count);
  }

  /**
   * Get counts of active, draft, completed trips.
   */
  async getTripStatusCounts(filters: { vehicleType?: string; region?: string }): Promise<{
    active: number;
    draft: number;
    completed: number;
  }> {
    const whereClauses: string[] = [];
    const values: any[] = [];

    let querySql = `SELECT t.status, COUNT(*) as count FROM trips t`;
    if (filters.vehicleType || filters.region) {
      querySql += ` JOIN vehicles v ON t.vehicle_id = v.id`;
      if (filters.vehicleType) {
        whereClauses.push('v.vehicle_type = ?');
        values.push(filters.vehicleType);
      }
      if (filters.region) {
        whereClauses.push('v.region = ?');
        values.push(filters.region);
      }
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
    querySql += ` ${whereSql} GROUP BY t.status`;

    const [rows] = await pool.query(querySql, values);

    let active = 0;
    let draft = 0;
    let completed = 0;

    for (const row of rows as any[]) {
      const count = Number(row.count);
      if (row.status === 'DISPATCHED') active = count;
      if (row.status === 'DRAFT') draft = count;
      if (row.status === 'COMPLETED') completed = count;
    }

    return { active, draft, completed };
  }

  /**
   * Get active/recent trips for the dispatch board.
   */
  async getActiveTrips(filters: {
    vehicleType?: string;
    region?: string;
    status?: string;
  }): Promise<DashboardTrip[]> {
    const whereClauses: string[] = [];
    const values: any[] = [];

    if (filters.status) {
      whereClauses.push('t.status = ?');
      values.push(filters.status);
    } else {
      // Default to active statuses (DRAFT, DISPATCHED)
      whereClauses.push("t.status IN ('DRAFT', 'DISPATCHED')");
    }

    if (filters.vehicleType) {
      whereClauses.push('v.vehicle_type = ?');
      values.push(filters.vehicleType);
    }

    if (filters.region) {
      whereClauses.push('v.region = ?');
      values.push(filters.region);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const [rows] = await pool.query(
      `SELECT t.id, t.trip_code, t.source, t.destination, t.cargo_weight_kg, t.planned_distance_km, t.actual_distance_km,
              t.status, t.revenue, t.dispatched_at, t.completed_at,
              t.vehicle_id, v.registration_number as vehicle_registration_number, v.name as vehicle_name, v.vehicle_type, v.region as vehicle_region,
              t.driver_id, d.full_name as driver_name
       FROM trips t
       LEFT JOIN vehicles v ON t.vehicle_id = v.id
       LEFT JOIN drivers d ON t.driver_id = d.id
       ${whereSql}
       ORDER BY t.id DESC`,
      values
    );

    return (rows as any[]).map(row => ({
      id: Number(row.id),
      trip_code: row.trip_code,
      source: row.source,
      destination: row.destination,
      cargo_weight_kg: Number(row.cargo_weight_kg),
      planned_distance_km: Number(row.planned_distance_km),
      actual_distance_km: row.actual_distance_km ? Number(row.actual_distance_km) : null,
      status: row.status,
      revenue: Number(row.revenue),
      dispatched_at: row.dispatched_at ? new Date(row.dispatched_at).toISOString() : null,
      completed_at: row.completed_at ? new Date(row.completed_at).toISOString() : null,
      vehicle_id: row.vehicle_id ? Number(row.vehicle_id) : null,
      vehicle_registration_number: row.vehicle_registration_number,
      vehicle_name: row.vehicle_name,
      vehicle_type: row.vehicle_type,
      vehicle_region: row.vehicle_region,
      driver_id: row.driver_id ? Number(row.driver_id) : null,
      driver_name: row.driver_name,
    }));
  }
}
