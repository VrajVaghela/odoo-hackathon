import mysql from 'mysql2/promise';
import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import { scrypt, randomBytes } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt);

/**
 * Hashes a password using PBKDF2/scrypt with a random salt.
 * Included here to keep the setup script self-contained and robust.
 */
async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${derivedKey.toString('hex')}`;
}

// Load backend environment variables
dotenv.config({ path: 'apps/api/.env' });

const DB_HOST = process.env.DB_HOST || '127.0.0.1';
const DB_PORT = parseInt(process.env.DB_PORT || '3306', 10);
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_NAME || 'transitops';

async function main() {
  console.log(`Connecting to MySQL host at ${DB_HOST}:${DB_PORT} as ${DB_USER}...`);
  
  // Connect without DB name to recreate it
  const initConn = await mysql.createConnection({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
  });

  try {
    console.log(`Recreating database: ${DB_NAME}`);
    await initConn.query(`DROP DATABASE IF EXISTS \`${DB_NAME}\`;`);
    await initConn.query(`CREATE DATABASE \`${DB_NAME}\`;`);
    console.log(`Database \`${DB_NAME}\` recreated successfully.`);
  } finally {
    await initConn.end();
  }

  // Connect to the newly created database
  console.log(`Connecting to database \`${DB_NAME}\`...`);
  const connection = await mysql.createConnection({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    multipleStatements: true,
  });

  try {
    // 1. Run migrations
    console.log('Reading migration file...');
    const migrationPath = path.resolve('db/migrations/001_initial_schema.sql');
    const migrationSql = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('Applying migrations to the database...');
    await connection.query(migrationSql);
    console.log('Migrations applied successfully.');

    // 2. Seed initial roles
    console.log('Seeding roles...');
    const roles = [
      { id: 1, code: 'FLEET_MANAGER', label: 'Fleet Manager' },
      { id: 2, code: 'DISPATCHER', label: 'Dispatcher' },
      { id: 3, code: 'SAFETY_OFFICER', label: 'Safety Officer' },
      { id: 4, code: 'FINANCIAL_ANALYST', label: 'Financial Analyst' },
      { id: 5, code: 'ADMIN', label: 'Administrator' },
    ];
    for (const r of roles) {
      await connection.query(
        'INSERT INTO roles (id, code, label) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE label=VALUES(label);',
        [r.id, r.code, r.label]
      );
    }

    // 3. Seed users
    console.log('Seeding users with hashed passwords...');
    const passwordHash = await hashPassword('password123');
    const users = [
      { role_id: 1, email: 'manager@transitops.com', password_hash: passwordHash },
      { role_id: 2, email: 'dispatcher@transitops.com', password_hash: passwordHash },
      { role_id: 3, email: 'safety@transitops.com', password_hash: passwordHash },
      { role_id: 4, email: 'finance@transitops.com', password_hash: passwordHash },
      { role_id: 5, email: 'admin@transitops.com', password_hash: passwordHash },
    ];
    for (const u of users) {
      await connection.query(
        'INSERT INTO users (role_id, email, password_hash, is_active) VALUES (?, ?, ?, 1);',
        [u.role_id, u.email, u.password_hash]
      );
    }

    // 4. Seed vehicles
    console.log('Seeding vehicles...');
    const vehicles = [
      { registration_number: 'KA-01-AA-1111', name: 'Rapid Cargo Van 1', model: 'Tata Winger', vehicle_type: 'VAN', max_capacity_kg: 800.00, odometer_km: 12000.00, acquisition_cost: 15000.00, status: 'AVAILABLE', region: 'South' },
      { registration_number: 'KA-01-AB-2222', name: 'Heavy Hauler Truck 2', model: 'Ashok Leyland Dost', vehicle_type: 'TRUCK', max_capacity_kg: 5000.00, odometer_km: 45000.00, acquisition_cost: 42000.00, status: 'AVAILABLE', region: 'South' },
      { registration_number: 'KA-01-AC-3333', name: 'Rapid Cargo Van 3', model: 'Tata Winger', vehicle_type: 'VAN', max_capacity_kg: 800.00, odometer_km: 22000.00, acquisition_cost: 16000.00, status: 'ON_TRIP', region: 'North' },
      { registration_number: 'KA-01-AD-4444', name: 'Heavy Duty Tipper 4', model: 'BharatBenz 2823R', vehicle_type: 'TRUCK', max_capacity_kg: 15000.00, odometer_km: 85000.00, acquisition_cost: 35000.00, status: 'IN_SHOP', region: 'East' },
      { registration_number: 'KA-01-AE-5555', name: 'City Delivery Van 5', model: 'Mahindra Supro', vehicle_type: 'VAN', max_capacity_kg: 500.00, odometer_km: 210000.00, acquisition_cost: 12000.00, status: 'RETIRED', region: 'West' }
    ];
    for (const v of vehicles) {
      const retiredAt = v.status === 'RETIRED' ? '2026-07-01 00:00:00' : null;
      await connection.query(
        'INSERT INTO vehicles (registration_number, name, model, vehicle_type, max_capacity_kg, odometer_km, acquisition_cost, status, region, retired_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);',
        [v.registration_number, v.name, v.model, v.vehicle_type, v.max_capacity_kg, v.odometer_km, v.acquisition_cost, v.status, v.region, retiredAt]
      );
    }

    // 5. Seed drivers
    console.log('Seeding drivers...');
    const drivers = [
      { full_name: 'John Doe', licence_number: 'DL-11111', licence_category: 'HEAVY', licence_expiry_date: '2027-12-31', contact_number: '+91 9999988888', safety_score: 95.00, status: 'AVAILABLE' },
      { full_name: 'Jane Smith', licence_number: 'DL-22222', licence_category: 'LIGHT', licence_expiry_date: '2027-06-30', contact_number: '+91 9999977777', safety_score: 88.00, status: 'AVAILABLE' },
      { full_name: 'Bob Johnson', licence_number: 'DL-33333', licence_category: 'LIGHT', licence_expiry_date: '2027-09-30', contact_number: '+91 9999966666', safety_score: 92.00, status: 'ON_TRIP' },
      { full_name: 'Alice Brown', licence_number: 'DL-44444', licence_category: 'HEAVY', licence_expiry_date: '2028-03-31', contact_number: '+91 9999955555', safety_score: 45.00, status: 'SUSPENDED' },
      { full_name: 'Charlie Green', licence_number: 'DL-55555', licence_category: 'LIGHT', licence_expiry_date: '2026-06-01', contact_number: '+91 9999944444', safety_score: 85.00, status: 'AVAILABLE' },
      { full_name: 'Priya Nair', licence_number: 'DL-66666', licence_category: 'HEAVY', licence_expiry_date: '2027-11-30', contact_number: '+91 9999933333', safety_score: 90.00, status: 'OFF_DUTY' }
    ];
    for (const d of drivers) {
      await connection.query(
        'INSERT INTO drivers (full_name, licence_number, licence_category, licence_expiry_date, contact_number, safety_score, status) VALUES (?, ?, ?, ?, ?, ?, ?);',
        [d.full_name, d.licence_number, d.licence_category, d.licence_expiry_date, d.contact_number, d.safety_score, d.status]
      );
    }

    // Retrieve references for foreign keys
    const [[v1]] = await connection.query('SELECT id FROM vehicles WHERE registration_number = "KA-01-AA-1111";') as any;
    const [[v3]] = await connection.query('SELECT id FROM vehicles WHERE registration_number = "KA-01-AC-3333";') as any;
    const [[d1]] = await connection.query('SELECT id FROM drivers WHERE licence_number = "DL-11111";') as any;
    const [[d3]] = await connection.query('SELECT id FROM drivers WHERE licence_number = "DL-33333";') as any;

    // 6. Seed trips
    console.log('Seeding trips...');
    // Completed trip
    await connection.query(
      'INSERT INTO trips (trip_code, source, destination, vehicle_id, driver_id, cargo_weight_kg, planned_distance_km, actual_distance_km, status, revenue, dispatched_at, completed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);',
      ['TRP-101', 'Warehouse A', 'Store B', v1.id, d1.id, 650.00, 500.00, 500.00, 'COMPLETED', 1200.00, '2026-07-11 08:00:00', '2026-07-11 16:00:00']
    );
    // Dispatched trip
    await connection.query(
      'INSERT INTO trips (trip_code, source, destination, vehicle_id, driver_id, cargo_weight_kg, planned_distance_km, status, revenue, dispatched_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);',
      ['TRP-102', 'Warehouse B', 'Store C', v3.id, d3.id, 700.00, 250.00, 'DISPATCHED', 800.00, '2026-07-12 09:00:00']
    );
    // Valid dispatch scenario: fits the available van's 800 kg capacity.
    await connection.query(
      'INSERT INTO trips (trip_code, source, destination, cargo_weight_kg, planned_distance_km, status) VALUES (?, ?, ?, ?, ?, ?);',
      ['TRP-103', 'Warehouse A', 'Store D', 600.00, 180.00, 'DRAFT']
    );
    // Capacity boundary scenario: cargo exactly equals the available van's capacity.
    await connection.query(
      'INSERT INTO trips (trip_code, source, destination, cargo_weight_kg, planned_distance_km, status) VALUES (?, ?, ?, ?, ?, ?);',
      ['TRP-104', 'Warehouse C', 'Store E', 800.00, 220.00, 'DRAFT']
    );
    // Capacity rejection scenario: cargo is 1 kg above the available van's capacity.
    await connection.query(
      'INSERT INTO trips (trip_code, source, destination, cargo_weight_kg, planned_distance_km, status) VALUES (?, ?, ?, ?, ?, ?);',
      ['TRP-105', 'Warehouse D', 'Store F', 801.00, 240.00, 'DRAFT']
    );

    // Retrieve completed trip ID
    const [[t101]] = await connection.query('SELECT id FROM trips WHERE trip_code = "TRP-101";') as any;

    // 7. Seed fuel logs
    console.log('Seeding fuel logs...');
    await connection.query(
      'INSERT INTO fuel_logs (vehicle_id, trip_id, logged_at, liters, cost, odometer_km) VALUES (?, ?, ?, ?, ?, ?);',
      [v1.id, t101.id, '2026-07-11 16:10:00', 50.00, 4500.00, 12000.00]
    );

    // 8. Seed expenses
    console.log('Seeding expenses...');
    await connection.query(
      'INSERT INTO expenses (vehicle_id, trip_id, category, amount, occurred_at, note) VALUES (?, ?, ?, ?, ?, ?);',
      [v1.id, t101.id, 'TOLL', 350.00, '2026-07-11 10:30:00', 'NH48 toll charge']
    );

    // 9. Seed maintenance logs
    console.log('Seeding maintenance logs...');
    const [[v4]] = await connection.query('SELECT id FROM vehicles WHERE registration_number = "KA-01-AD-4444";') as any;
    await connection.query(
      'INSERT INTO maintenance_logs (vehicle_id, service_type, description, opened_at, cost, status) VALUES (?, ?, ?, ?, ?, ?);',
      [v4.id, 'ENGINE_OVERHAUL', 'Routine engine overhaul and piston replacement', '2026-07-11 10:00:00', 0.00, 'ACTIVE']
    );

    console.log('Database initialization and seeding completed successfully!');
  } finally {
    await connection.end();
  }
}

main().catch(err => {
  console.error('Fatal error during database reset:', err);
  process.exit(1);
});
