import { PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import pool from '../../db/pool.js';
import { CreateExpenseInput, CreateFuelLogInput, Expense, FinanceTripOption, FinanceVehicleOption, FuelLog } from './types.js';

interface VehicleRow extends RowDataPacket {
  id: number;
  registration_number: string;
  odometer_km: string | number;
}

interface TripRow extends RowDataPacket {
  id: number;
  vehicle_id: number | null;
  trip_code: string;
}

export class FinanceRepository {
  async findVehicleForUpdate(connection: PoolConnection, vehicleId: number): Promise<VehicleRow | null> {
    const [rows] = await connection.query<VehicleRow[]>(
      'SELECT id, registration_number, odometer_km FROM vehicles WHERE id = ? FOR UPDATE',
      [vehicleId],
    );
    return rows[0] ?? null;
  }

  async findTripForUpdate(connection: PoolConnection, tripId: number): Promise<TripRow | null> {
    const [rows] = await connection.query<TripRow[]>(
      'SELECT id, vehicle_id, trip_code FROM trips WHERE id = ? FOR UPDATE',
      [tripId],
    );
    return rows[0] ?? null;
  }

  async insertFuelLog(connection: PoolConnection, input: CreateFuelLogInput): Promise<number> {
    const [result] = await connection.query<ResultSetHeader>(
      `INSERT INTO fuel_logs (vehicle_id, trip_id, logged_at, liters, cost, odometer_km)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [input.vehicle_id, input.trip_id ?? null, input.logged_at, input.liters, input.cost, input.odometer_km],
    );
    return result.insertId;
  }

  async updateVehicleOdometer(connection: PoolConnection, vehicleId: number, odometerKm: number): Promise<void> {
    await connection.query('UPDATE vehicles SET odometer_km = ? WHERE id = ?', [odometerKm, vehicleId]);
  }

  async insertExpense(connection: PoolConnection, input: CreateExpenseInput): Promise<number> {
    const [result] = await connection.query<ResultSetHeader>(
      `INSERT INTO expenses (vehicle_id, trip_id, category, amount, occurred_at, note)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [input.vehicle_id ?? null, input.trip_id ?? null, input.category, input.amount, input.occurred_at, input.note ?? null],
    );
    return result.insertId;
  }

  async findFuelLogById(id: number, connection?: PoolConnection): Promise<FuelLog | null> {
    const executor = connection ?? pool;
    const [rows] = await executor.query<RowDataPacket[]>(
      `SELECT f.id, f.vehicle_id, f.trip_id, f.logged_at, f.liters, f.cost, f.odometer_km,
              v.registration_number AS vehicle_registration_number, t.trip_code
       FROM fuel_logs f
       JOIN vehicles v ON v.id = f.vehicle_id
       LEFT JOIN trips t ON t.id = f.trip_id
       WHERE f.id = ?`,
      [id],
    );
    return rows[0] ? this.mapFuelLog(rows[0]) : null;
  }

  async findExpenseById(id: number, connection?: PoolConnection): Promise<Expense | null> {
    const executor = connection ?? pool;
    const [rows] = await executor.query<RowDataPacket[]>(
      `SELECT e.id, e.vehicle_id, e.trip_id, e.category, e.amount, e.occurred_at, e.note,
              v.registration_number AS vehicle_registration_number, t.trip_code
       FROM expenses e
       LEFT JOIN vehicles v ON v.id = e.vehicle_id
       LEFT JOIN trips t ON t.id = e.trip_id
       WHERE e.id = ?`,
      [id],
    );
    return rows[0] ? this.mapExpense(rows[0]) : null;
  }

  async listFuelLogs(vehicleId?: number): Promise<FuelLog[]> {
    const where = vehicleId ? 'WHERE f.vehicle_id = ?' : '';
    const values = vehicleId ? [vehicleId] : [];
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT f.id, f.vehicle_id, f.trip_id, f.logged_at, f.liters, f.cost, f.odometer_km,
              v.registration_number AS vehicle_registration_number, t.trip_code
       FROM fuel_logs f
       JOIN vehicles v ON v.id = f.vehicle_id
       LEFT JOIN trips t ON t.id = f.trip_id
       ${where}
       ORDER BY f.logged_at DESC, f.id DESC`,
      values,
    );
    return rows.map((row) => this.mapFuelLog(row));
  }

  async listExpenses(vehicleId?: number): Promise<Expense[]> {
    const where = vehicleId ? 'WHERE e.vehicle_id = ?' : '';
    const values = vehicleId ? [vehicleId] : [];
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT e.id, e.vehicle_id, e.trip_id, e.category, e.amount, e.occurred_at, e.note,
              v.registration_number AS vehicle_registration_number, t.trip_code
       FROM expenses e
       LEFT JOIN vehicles v ON v.id = e.vehicle_id
       LEFT JOIN trips t ON t.id = e.trip_id
       ${where}
       ORDER BY e.occurred_at DESC, e.id DESC`,
      values,
    );
    return rows.map((row) => this.mapExpense(row));
  }

  async listVehicleOptions(): Promise<FinanceVehicleOption[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT id, registration_number, name FROM vehicles ORDER BY registration_number',
    );
    return rows.map((row) => ({
      id: Number(row.id),
      registration_number: String(row.registration_number),
      name: String(row.name),
    }));
  }

  async listTripOptions(): Promise<FinanceTripOption[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT id, trip_code, vehicle_id, status
       FROM trips
       WHERE status IN ('DISPATCHED', 'COMPLETED')
       ORDER BY id DESC`,
    );
    return rows.map((row) => ({
      id: Number(row.id),
      trip_code: String(row.trip_code),
      vehicle_id: row.vehicle_id === null ? null : Number(row.vehicle_id),
      status: String(row.status),
    }));
  }

  private mapFuelLog(row: RowDataPacket): FuelLog {
    return {
      id: Number(row.id),
      vehicle_id: Number(row.vehicle_id),
      trip_id: row.trip_id === null ? null : Number(row.trip_id),
      logged_at: new Date(row.logged_at).toISOString(),
      liters: Number(row.liters),
      cost: Number(row.cost),
      odometer_km: Number(row.odometer_km),
      vehicle_registration_number: String(row.vehicle_registration_number),
      trip_code: row.trip_code === null ? null : String(row.trip_code),
    };
  }

  private mapExpense(row: RowDataPacket): Expense {
    return {
      id: Number(row.id),
      vehicle_id: row.vehicle_id === null ? null : Number(row.vehicle_id),
      trip_id: row.trip_id === null ? null : Number(row.trip_id),
      category: row.category,
      amount: Number(row.amount),
      occurred_at: new Date(row.occurred_at).toISOString(),
      note: row.note === null ? null : String(row.note),
      vehicle_registration_number: row.vehicle_registration_number === null ? null : String(row.vehicle_registration_number),
      trip_code: row.trip_code === null ? null : String(row.trip_code),
    };
  }
}
