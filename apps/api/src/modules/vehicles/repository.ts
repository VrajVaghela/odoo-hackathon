import pool from '../../db/pool.js';
import { PoolConnection } from 'mysql2/promise';
import { Vehicle, CreateVehicleInput, UpdateVehicleInput, VehicleFilters } from './types.js';

export class VehicleRepository {
  /**
   * Find vehicle by ID.
   */
  async findById(id: number, connection?: PoolConnection): Promise<Vehicle | null> {
    const executor = connection || pool;
    const [rows] = await executor.query(
      'SELECT id, registration_number, name, model, vehicle_type, max_capacity_kg, odometer_km, acquisition_cost, status, region, retired_at FROM vehicles WHERE id = ?',
      [id]
    );
    const vehicle = (rows as any[])[0];
    return vehicle ? this.mapRow(vehicle) : null;
  }

  /**
   * Find vehicle by registration number.
   */
  async findByRegistrationNumber(regNum: string, connection?: PoolConnection): Promise<Vehicle | null> {
    const executor = connection || pool;
    const [rows] = await executor.query(
      'SELECT id, registration_number, name, model, vehicle_type, max_capacity_kg, odometer_km, acquisition_cost, status, region, retired_at FROM vehicles WHERE registration_number = ?',
      [regNum]
    );
    const vehicle = (rows as any[])[0];
    return vehicle ? this.mapRow(vehicle) : null;
  }

  /**
   * Create a new vehicle.
   */
  async create(input: CreateVehicleInput, connection?: PoolConnection): Promise<Vehicle> {
    const status = input.status || 'AVAILABLE';
    const odometer = input.odometer_km ?? 0;
    const retiredAt = status === 'RETIRED' ? new Date() : null;

    const executor = connection || pool;
    const [result] = await executor.query(
      `INSERT INTO vehicles (registration_number, name, model, vehicle_type, max_capacity_kg, odometer_km, acquisition_cost, status, region, retired_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        input.registration_number,
        input.name,
        input.model,
        input.vehicle_type,
        input.max_capacity_kg,
        odometer,
        input.acquisition_cost,
        status,
        input.region,
        retiredAt,
      ]
    );

    const insertId = (result as any).insertId;
    return (await this.findById(insertId, connection))!;
  }

  /**
   * Update an existing vehicle.
   */
  async update(id: number, input: UpdateVehicleInput, connection?: PoolConnection): Promise<Vehicle> {
    const fields: string[] = [];
    const values: any[] = [];

    if (input.registration_number !== undefined) {
      fields.push('registration_number = ?');
      values.push(input.registration_number);
    }
    if (input.name !== undefined) {
      fields.push('name = ?');
      values.push(input.name);
    }
    if (input.model !== undefined) {
      fields.push('model = ?');
      values.push(input.model);
    }
    if (input.vehicle_type !== undefined) {
      fields.push('vehicle_type = ?');
      values.push(input.vehicle_type);
    }
    if (input.max_capacity_kg !== undefined) {
      fields.push('max_capacity_kg = ?');
      values.push(input.max_capacity_kg);
    }
    if (input.odometer_km !== undefined) {
      fields.push('odometer_km = ?');
      values.push(input.odometer_km);
    }
    if (input.acquisition_cost !== undefined) {
      fields.push('acquisition_cost = ?');
      values.push(input.acquisition_cost);
    }
    if (input.status !== undefined) {
      fields.push('status = ?');
      values.push(input.status);

      // Handle retired_at timestamp
      if (input.status === 'RETIRED') {
        fields.push('retired_at = ?');
        values.push(new Date());
      } else {
        fields.push('retired_at = NULL');
      }
    }
    if (input.region !== undefined) {
      fields.push('region = ?');
      values.push(input.region);
    }

    if (fields.length === 0) {
      return (await this.findById(id, connection))!;
    }

    values.push(id);
    const executor = connection || pool;
    await executor.query(
      `UPDATE vehicles SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return (await this.findById(id, connection))!;
  }

  /**
   * List vehicles with filters and pagination.
   */
  async list(filters: VehicleFilters): Promise<{ vehicles: Vehicle[]; total: number }> {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const offset = (page - 1) * limit;

    const whereClauses: string[] = [];
    const values: any[] = [];

    if (filters.status) {
      whereClauses.push('status = ?');
      values.push(filters.status);
    }
    if (filters.vehicle_type) {
      whereClauses.push('vehicle_type = ?');
      values.push(filters.vehicle_type);
    }
    if (filters.region) {
      whereClauses.push('region = ?');
      values.push(filters.region);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Get total count
    const [countRows] = await pool.query(
      `SELECT COUNT(*) as total FROM vehicles ${whereSql}`,
      values
    );
    const total = (countRows as any[])[0].total;

    // Get paginated rows
    const listValues = [...values, limit, offset];
    const [rows] = await pool.query(
      `SELECT id, registration_number, name, model, vehicle_type, max_capacity_kg, odometer_km, acquisition_cost, status, region, retired_at
       FROM vehicles
       ${whereSql}
       ORDER BY id DESC
       LIMIT ? OFFSET ?`,
      listValues
    );

    const vehicles = (rows as any[]).map(row => this.mapRow(row));
    return { vehicles, total };
  }

  /**
   * Get all active (available) vehicles for dispatch.
   */
  async getAvailable(): Promise<Vehicle[]> {
    const [rows] = await pool.query(
      `SELECT id, registration_number, name, model, vehicle_type, max_capacity_kg, odometer_km, acquisition_cost, status, region, retired_at
       FROM vehicles
       WHERE status = 'AVAILABLE' AND retired_at IS NULL`
    );
    return (rows as any[]).map(row => this.mapRow(row));
  }

  /**
   * Maps a database row to the Vehicle interface.
   */
  private mapRow(row: any): Vehicle {
    return {
      id: Number(row.id),
      registration_number: row.registration_number,
      name: row.name,
      model: row.model,
      vehicle_type: row.vehicle_type,
      max_capacity_kg: Number(row.max_capacity_kg),
      odometer_km: Number(row.odometer_km),
      acquisition_cost: Number(row.acquisition_cost),
      status: row.status,
      region: row.region,
      retired_at: row.retired_at ? new Date(row.retired_at).toISOString() : null,
    };
  }
}
