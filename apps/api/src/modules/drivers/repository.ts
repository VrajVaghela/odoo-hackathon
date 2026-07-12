import pool from '../../db/pool.js';
import { PoolConnection } from 'mysql2/promise';
import { Driver, CreateDriverInput, UpdateDriverInput, DriverFilters } from './types.js';

export class DriverRepository {
  /**
   * Find driver by ID.
   */
  async findById(id: number, connection?: PoolConnection): Promise<Driver | null> {
    const executor = connection || pool;
    const [rows] = await executor.query(
      'SELECT id, full_name, licence_number, licence_category, licence_expiry_date, contact_number, safety_score, status FROM drivers WHERE id = ?',
      [id]
    );
    const driver = (rows as any[])[0];
    return driver ? this.mapRow(driver) : null;
  }

  /**
   * Find driver by licence number.
   */
  async findByLicenceNumber(licenceNum: string, connection?: PoolConnection): Promise<Driver | null> {
    const executor = connection || pool;
    const [rows] = await executor.query(
      'SELECT id, full_name, licence_number, licence_category, licence_expiry_date, contact_number, safety_score, status FROM drivers WHERE licence_number = ?',
      [licenceNum]
    );
    const driver = (rows as any[])[0];
    return driver ? this.mapRow(driver) : null;
  }

  /**
   * Create a new driver.
   */
  async create(input: CreateDriverInput, connection?: PoolConnection): Promise<Driver> {
    const status = input.status || 'AVAILABLE';
    const safetyScore = input.safety_score ?? 100.00;

    const executor = connection || pool;
    const [result] = await executor.query(
      `INSERT INTO drivers (full_name, licence_number, licence_category, licence_expiry_date, contact_number, safety_score, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        input.full_name,
        input.licence_number,
        input.licence_category,
        input.licence_expiry_date,
        input.contact_number,
        safetyScore,
        status,
      ]
    );

    const insertId = (result as any).insertId;
    return (await this.findById(insertId, connection))!;
  }

  /**
   * Update an existing driver.
   */
  async update(id: number, input: UpdateDriverInput, connection?: PoolConnection): Promise<Driver> {
    const fields: string[] = [];
    const values: any[] = [];

    if (input.full_name !== undefined) {
      fields.push('full_name = ?');
      values.push(input.full_name);
    }
    if (input.licence_number !== undefined) {
      fields.push('licence_number = ?');
      values.push(input.licence_number);
    }
    if (input.licence_category !== undefined) {
      fields.push('licence_category = ?');
      values.push(input.licence_category);
    }
    if (input.licence_expiry_date !== undefined) {
      fields.push('licence_expiry_date = ?');
      values.push(input.licence_expiry_date);
    }
    if (input.contact_number !== undefined) {
      fields.push('contact_number = ?');
      values.push(input.contact_number);
    }
    if (input.safety_score !== undefined) {
      fields.push('safety_score = ?');
      values.push(input.safety_score);
    }
    if (input.status !== undefined) {
      fields.push('status = ?');
      values.push(input.status);
    }

    if (fields.length === 0) {
      return (await this.findById(id, connection))!;
    }

    values.push(id);
    const executor = connection || pool;
    await executor.query(
      `UPDATE drivers SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return (await this.findById(id, connection))!;
  }

  /**
   * List drivers with filters and pagination.
   */
  async list(filters: DriverFilters): Promise<{ drivers: Driver[]; total: number }> {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const offset = (page - 1) * limit;

    const whereClauses: string[] = [];
    const values: any[] = [];

    if (filters.status) {
      whereClauses.push('status = ?');
      values.push(filters.status);
    }
    if (filters.licence_category) {
      whereClauses.push('licence_category = ?');
      values.push(filters.licence_category);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Get total count
    const [countRows] = await pool.query(
      `SELECT COUNT(*) as total FROM drivers ${whereSql}`,
      values
    );
    const total = (countRows as any[])[0].total;

    // Get paginated rows
    const listValues = [...values, limit, offset];
    const [rows] = await pool.query(
      `SELECT id, full_name, licence_number, licence_category, licence_expiry_date, contact_number, safety_score, status
       FROM drivers
       ${whereSql}
       ORDER BY id DESC
       LIMIT ? OFFSET ?`,
      listValues
    );

    const drivers = (rows as any[]).map(row => this.mapRow(row));
    return { drivers, total };
  }

  /**
   * Get all active available drivers for dispatch.
   * Checks status = 'AVAILABLE' and licence is not expired.
   */
  async getAvailable(): Promise<Driver[]> {
    const [rows] = await pool.query(
      `SELECT id, full_name, licence_number, licence_category, licence_expiry_date, contact_number, safety_score, status
       FROM drivers
       WHERE status = 'AVAILABLE' AND licence_expiry_date >= CURDATE()`
    );
    return (rows as any[]).map(row => this.mapRow(row));
  }

  /**
   * Maps database row to Driver interface.
   */
  private mapRow(row: any): Driver {
    // format date as YYYY-MM-DD
    const dateObj = new Date(row.licence_expiry_date);
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');

    return {
      id: Number(row.id),
      full_name: row.full_name,
      licence_number: row.licence_number,
      licence_category: row.licence_category,
      licence_expiry_date: `${year}-${month}-${day}`,
      contact_number: row.contact_number,
      safety_score: Number(row.safety_score),
      status: row.status,
    };
  }
}
