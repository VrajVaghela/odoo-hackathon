import { PoolConnection } from 'mysql2/promise';
import pool from '../../db/pool.js';
import { MaintenanceLog } from './types.js';

export class MaintenanceRepository {
  /**
   * Locks the vehicle row for update.
   */
  async findVehicleForUpdate(connection: PoolConnection, vehicleId: number): Promise<any | null> {
    const [rows] = await connection.query<any[]>(
      `SELECT id, status, registration_number, name FROM vehicles WHERE id = ? FOR UPDATE`,
      [vehicleId]
    );
    return rows[0] ?? null;
  }

  /**
   * Checks if there's already an active maintenance log for the vehicle.
   */
  async hasActiveMaintenance(connection: PoolConnection, vehicleId: number): Promise<boolean> {
    const [rows] = await connection.query<any[]>(
      `SELECT id FROM maintenance_logs WHERE vehicle_id = ? AND status = 'ACTIVE' LIMIT 1`,
      [vehicleId]
    );
    return rows.length > 0;
  }

  /**
   * Inserts a new active maintenance log.
   */
  async openMaintenance(
    connection: PoolConnection,
    vehicleId: number,
    serviceType: string,
    description: string
  ): Promise<number> {
    const [result] = await connection.query<any>(
      `INSERT INTO maintenance_logs (vehicle_id, service_type, description, opened_at, status, cost)
       VALUES (?, ?, ?, NOW(), 'ACTIVE', 0)`,
      [vehicleId, serviceType, description]
    );
    return result.insertId;
  }

  /**
   * Locks the maintenance log row for update.
   */
  async findLogForUpdate(connection: PoolConnection, logId: number): Promise<any | null> {
    const [rows] = await connection.query<any[]>(
      `SELECT * FROM maintenance_logs WHERE id = ? FOR UPDATE`,
      [logId]
    );
    return rows[0] ?? null;
  }

  /**
   * Closes an active maintenance log.
   */
  async closeMaintenance(connection: PoolConnection, logId: number, cost: number): Promise<void> {
    await connection.query(
      `UPDATE maintenance_logs
       SET status = 'CLOSED', cost = ?, closed_at = NOW()
       WHERE id = ?`,
      [cost, logId]
    );
  }

  /**
   * Updates a vehicle's status.
   */
  async updateVehicleStatus(connection: PoolConnection, vehicleId: number, status: string): Promise<void> {
    await connection.query(
      `UPDATE vehicles SET status = ? WHERE id = ?`,
      [status, vehicleId]
    );
  }

  /**
   * Lists all maintenance logs, optionally filtered by vehicle.
   */
  async listLogs(vehicleId?: number): Promise<any[]> {
    let sql = `
      SELECT m.id, m.vehicle_id, m.service_type, m.description, m.opened_at, m.closed_at, m.cost, m.status,
             v.registration_number as vehicle_reg, v.name as vehicle_name
      FROM maintenance_logs m
      JOIN vehicles v ON m.vehicle_id = v.id
    `;
    const params: any[] = [];

    if (vehicleId) {
      sql += ` WHERE m.vehicle_id = ?`;
      params.push(vehicleId);
    }

    sql += ` ORDER BY m.opened_at DESC`;

    const [rows] = await pool.query<any[]>(sql, params);
    return rows;
  }

  /**
   * Retrieves a single maintenance log by ID.
   */
  async findById(logId: number, connection?: PoolConnection): Promise<any | null> {
    const conn = connection || pool;
    const [rows] = await conn.query<any[]>(
      `SELECT m.id, m.vehicle_id, m.service_type, m.description, m.opened_at, m.closed_at, m.cost, m.status,
              v.registration_number as vehicle_reg, v.name as vehicle_name
       FROM maintenance_logs m
       JOIN vehicles v ON m.vehicle_id = v.id
       WHERE m.id = ?`,
      [logId]
    );
    return rows[0] ?? null;
  }
}
