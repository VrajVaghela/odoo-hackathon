import { PoolConnection, ResultSetHeader } from 'mysql2/promise';
import pool from '../../db/pool.js';
import { Trip } from './types.js';

export class TripRepository {
  /**
   * Generates a unique trip code like TRP-0001.
   */
  async generateTripCode(connection: PoolConnection): Promise<string> {
    const [rows] = await connection.query<any[]>(
      'SELECT COUNT(*) as total FROM trips'
    );
    const count = Number(rows[0].total) + 1;
    return `TRP-${String(count).padStart(4, '0')}`;
  }

  /**
   * Inserts a new DRAFT trip and returns the created record.
   */
  async insertDraft(
    connection: PoolConnection,
    tripCode: string,
    source: string,
    destination: string,
    cargoWeightKg: number,
    plannedDistanceKm: number,
    revenue: number
  ): Promise<number> {
    const [result] = await connection.query<ResultSetHeader>(
      `INSERT INTO trips
         (trip_code, source, destination, cargo_weight_kg, planned_distance_km, revenue, status)
       VALUES (?, ?, ?, ?, ?, ?, 'DRAFT')`,
      [tripCode, source, destination, cargoWeightKg, plannedDistanceKm, revenue]
    );
    return result.insertId;
  }

  /**
   * Finds a trip by id with a FOR UPDATE lock (must be inside a transaction).
   */
  async findByIdForUpdate(connection: PoolConnection, tripId: number): Promise<Trip | null> {
    const [rows] = await connection.query<any[]>(
      `SELECT id, trip_code, source, destination, vehicle_id, driver_id,
              cargo_weight_kg, planned_distance_km, actual_distance_km,
              status, revenue, dispatched_at, completed_at
       FROM trips WHERE id = ? FOR UPDATE`,
      [tripId]
    );
    return rows[0] ?? null;
  }

  /**
   * Finds a vehicle by id with a FOR UPDATE lock (must be inside a transaction).
   */
  async findVehicleForUpdate(
    connection: PoolConnection,
    vehicleId: number
  ): Promise<{ id: number; status: string; max_capacity_kg: number; name: string; registration_number: string; odometer_km: number } | null> {
    const [rows] = await connection.query<any[]>(
      'SELECT id, status, max_capacity_kg, name, registration_number, odometer_km FROM vehicles WHERE id = ? FOR UPDATE',
      [vehicleId]
    );
    return rows[0] ?? null;
  }

  /**
   * Finds a driver by id with a FOR UPDATE lock (must be inside a transaction).
   */
  async findDriverForUpdate(
    connection: PoolConnection,
    driverId: number
  ): Promise<{ id: number; status: string; licence_expiry_date: string; full_name: string } | null> {
    const [rows] = await connection.query<any[]>(
      'SELECT id, status, licence_expiry_date, full_name FROM drivers WHERE id = ? FOR UPDATE',
      [driverId]
    );
    return rows[0] ?? null;
  }

  /**
   * Dispatches a trip: updates trip, vehicle, and driver statuses atomically.
   */
  async dispatchTrip(
    connection: PoolConnection,
    tripId: number,
    vehicleId: number,
    driverId: number
  ): Promise<void> {
    await connection.query(
      `UPDATE trips SET status = 'DISPATCHED', vehicle_id = ?, driver_id = ?, dispatched_at = NOW()
       WHERE id = ?`,
      [vehicleId, driverId, tripId]
    );
    await connection.query(
      "UPDATE vehicles SET status = 'ON_TRIP' WHERE id = ?",
      [vehicleId]
    );
    await connection.query(
      "UPDATE drivers SET status = 'ON_TRIP' WHERE id = ?",
      [driverId]
    );
  }

  /**
   * Completes a DISPATCHED trip:
   * - Sets trip status = COMPLETED with actual_distance_km and completed_at
   * - Increments vehicle odometer by actual distance
   * - Restores vehicle and driver to AVAILABLE
   */
  async completeTrip(
    connection: PoolConnection,
    tripId: number,
    vehicleId: number,
    driverId: number,
    actualDistanceKm: number
  ): Promise<void> {
    await connection.query(
      `UPDATE trips
         SET status = 'COMPLETED', actual_distance_km = ?, completed_at = NOW()
       WHERE id = ?`,
      [actualDistanceKm, tripId]
    );
    await connection.query(
      `UPDATE vehicles
         SET status = 'AVAILABLE', odometer_km = odometer_km + ?
       WHERE id = ?`,
      [actualDistanceKm, vehicleId]
    );
    await connection.query(
      "UPDATE drivers SET status = 'AVAILABLE' WHERE id = ?",
      [driverId]
    );
  }

  /**
   * Cancels a DRAFT or DISPATCHED trip:
   * - Sets trip status = CANCELLED
   * - Restores vehicle and driver to AVAILABLE only if they were ON_TRIP
   *   (a DRAFT trip has no vehicle/driver assigned yet)
   */
  async cancelTrip(
    connection: PoolConnection,
    tripId: number,
    vehicleId: number | null,
    driverId: number | null
  ): Promise<void> {
    await connection.query(
      "UPDATE trips SET status = 'CANCELLED' WHERE id = ?",
      [tripId]
    );
    if (vehicleId !== null) {
      await connection.query(
        "UPDATE vehicles SET status = 'AVAILABLE' WHERE id = ? AND status = 'ON_TRIP'",
        [vehicleId]
      );
    }
    if (driverId !== null) {
      await connection.query(
        "UPDATE drivers SET status = 'AVAILABLE' WHERE id = ? AND status = 'ON_TRIP'",
        [driverId]
      );
    }
  }

  /**
   * Lists trips with optional status filter, ordered by most recent first.
   */
  async listTrips(status?: string): Promise<Trip[]> {
    const validStatuses = ['DRAFT', 'DISPATCHED', 'COMPLETED', 'CANCELLED'];
    let sql = `
      SELECT t.id, t.trip_code, t.source, t.destination, t.vehicle_id, t.driver_id,
             t.cargo_weight_kg, t.planned_distance_km, t.actual_distance_km,
             t.status, t.revenue, t.dispatched_at, t.completed_at,
             v.registration_number as vehicle_reg, v.name as vehicle_name,
             d.full_name as driver_name
      FROM trips t
      LEFT JOIN vehicles v ON t.vehicle_id = v.id
      LEFT JOIN drivers d ON t.driver_id = d.id
    `;
    const params: string[] = [];
    if (status && validStatuses.includes(status.toUpperCase())) {
      sql += ' WHERE t.status = ?';
      params.push(status.toUpperCase());
    }
    sql += ' ORDER BY t.id DESC LIMIT 100';
    const [rows] = await pool.query<any[]>(sql, params);
    return rows;
  }

  /**
   * Fetches a single trip by id (no lock).
   */
  async findById(id: number): Promise<Trip | null> {
    const [rows] = await pool.query<any[]>(
      `SELECT t.id, t.trip_code, t.source, t.destination, t.vehicle_id, t.driver_id,
              t.cargo_weight_kg, t.planned_distance_km, t.actual_distance_km,
              t.status, t.revenue, t.dispatched_at, t.completed_at,
              v.registration_number as vehicle_reg, v.name as vehicle_name,
              d.full_name as driver_name
       FROM trips t
       LEFT JOIN vehicles v ON t.vehicle_id = v.id
       LEFT JOIN drivers d ON t.driver_id = d.id
       WHERE t.id = ?`,
      [id]
    );
    return rows[0] ?? null;
  }

  /**
   * Lists AVAILABLE vehicles for dispatch eligibility dropdown.
   */
  async listAvailableVehicles(): Promise<any[]> {
    const [rows] = await pool.query<any[]>(
      `SELECT id, registration_number, name, model, vehicle_type, max_capacity_kg, region
       FROM vehicles WHERE status = 'AVAILABLE'
       ORDER BY registration_number`
    );
    return rows;
  }

  /**
   * Lists AVAILABLE drivers for dispatch eligibility dropdown.
   */
  async listAvailableDrivers(): Promise<any[]> {
    const [rows] = await pool.query<any[]>(
      `SELECT id, full_name, licence_number, licence_category, licence_expiry_date, safety_score
       FROM drivers WHERE status = 'AVAILABLE'
       ORDER BY full_name`
    );
    return rows;
  }

  /**
   * Inserts an audit log entry.
   */
  async insertAuditLog(
    connection: PoolConnection,
    actorUserId: number | null,
    entityType: string,
    entityId: number,
    action: string,
    beforeJson: object | null,
    afterJson: object | null
  ): Promise<void> {
    await connection.query(
      `INSERT INTO audit_logs (actor_user_id, entity_type, entity_id, action, before_json, after_json)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        actorUserId,
        entityType,
        entityId,
        action,
        beforeJson ? JSON.stringify(beforeJson) : null,
        afterJson ? JSON.stringify(afterJson) : null,
      ]
    );
  }
}
