import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import app from '../src/app.js';
import pool from '../src/db/pool.js';

// This suite asserts named demo rows. Run `npm run db:reset` from the
// workspace root before executing it so every scenario starts in its seed state.

type ApiError = {
  error: {
    code: string;
    message: string;
    field?: string;
  };
};

type TripResponse = {
  trip: {
    id: number;
    status: string;
  };
};

let server: http.Server;
let baseUrl: string;
let dispatcherCookie: string;

function startServer(): Promise<void> {
  return new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(0, () => {
      const address = server.address();
      const port = typeof address === 'string' ? 0 : address?.port;
      baseUrl = `http://localhost:${port}`;
      resolve();
    });
  });
}

function stopServer(): Promise<void> {
  return new Promise((resolve) => {
    server.close(() => resolve());
  });
}

function sessionCookie(headers: Headers): string {
  const header = headers.get('set-cookie') ?? '';
  const match = header.match(/session_token=([^;]+)/);
  assert.ok(match, 'login should return a session cookie');
  return `session_token=${match[1]}`;
}

async function loginDispatcher(): Promise<string> {
  const response = await fetch(`${baseUrl}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'dispatcher@transitops.com',
      password: 'password123',
    }),
  });
  assert.equal(response.status, 200);
  return sessionCookie(response.headers);
}

async function createDraft(cargoWeightKg: number): Promise<number> {
  const response = await fetch(`${baseUrl}/api/v1/trips`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      cookie: dispatcherCookie,
    },
    body: JSON.stringify({
      source: `Quality origin ${cargoWeightKg}`,
      destination: `Quality destination ${cargoWeightKg}`,
      cargo_weight_kg: cargoWeightKg,
      planned_distance_km: 100,
      revenue: 1000,
    }),
  });
  assert.equal(response.status, 201);
  const body = await response.json() as TripResponse;
  return body.trip.id;
}

async function dispatch(tripId: number, vehicleId: number, driverId: number): Promise<Response> {
  return fetch(`${baseUrl}/api/v1/trips/${tripId}/dispatch`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      cookie: dispatcherCookie,
    },
    body: JSON.stringify({ vehicle_id: vehicleId, driver_id: driverId }),
  });
}

async function seedId(table: 'vehicles' | 'drivers' | 'trips', column: string, value: string): Promise<number> {
  const allowedTables = new Set(['vehicles', 'drivers', 'trips']);
  const allowedColumns = new Set(['registration_number', 'licence_number', 'trip_code']);
  assert.ok(allowedTables.has(table));
  assert.ok(allowedColumns.has(column));

  const [rows] = await pool.query(`SELECT id FROM ${table} WHERE ${column} = ?`, [value]);
  const row = (rows as Array<{ id: number }>)[0];
  assert.ok(row, `Seed row ${table}.${column}=${value} should exist.`);
  return Number(row.id);
}

async function expectDispatchRejection(
  tripId: number,
  vehicleId: number,
  driverId: number,
  expectedCode: string,
): Promise<ApiError['error']> {
  const response = await dispatch(tripId, vehicleId, driverId);
  assert.equal(response.status, 422);
  const body = await response.json() as ApiError;
  assert.equal(body.error.code, expectedCode);
  return body.error;
}

test('dispatch API rule matrix uses the deterministic demo scenarios', async (t) => {
  await startServer();

  try {
    dispatcherCookie = await loginDispatcher();

    const vanAvailable = await seedId('vehicles', 'registration_number', 'KA-01-AA-1111');
    const truckAvailable = await seedId('vehicles', 'registration_number', 'KA-01-AB-2222');
    const alternateDriver = await seedId('drivers', 'licence_number', 'DL-22222');
    const vehicleOnTrip = await seedId('vehicles', 'registration_number', 'KA-01-AC-3333');
    const vehicleInShop = await seedId('vehicles', 'registration_number', 'KA-01-AD-4444');
    const vehicleRetired = await seedId('vehicles', 'registration_number', 'KA-01-AE-5555');
    const driverAvailable = await seedId('drivers', 'licence_number', 'DL-11111');
    const driverOnTrip = await seedId('drivers', 'licence_number', 'DL-33333');
    const driverSuspended = await seedId('drivers', 'licence_number', 'DL-44444');
    const driverExpired = await seedId('drivers', 'licence_number', 'DL-55555');
    const driverOffDuty = await seedId('drivers', 'licence_number', 'DL-66666');
    const dispatchedTrip = await seedId('trips', 'trip_code', 'TRP-102');
    const capacityBoundaryTrip = await seedId('trips', 'trip_code', 'TRP-104');
    const capacityOverflowTrip = await seedId('trips', 'trip_code', 'TRP-105');

    // Earlier integration tests intentionally suspend an available driver. Restore
    // this named fixture so the licence-expiry assertion remains independently valid.
    await pool.query('UPDATE drivers SET status = ? WHERE id = ?', ['AVAILABLE', driverExpired]);

    await t.test('rejects cargo above capacity and rolls back the attempted dispatch', async () => {
      const error = await expectDispatchRejection(capacityOverflowTrip, vanAvailable, driverAvailable, 'CARGO_EXCEEDS_CAPACITY');
      assert.match(error.message, /1\.00 kg over KA-01-AA-1111/i);

      const tripResponse = await fetch(`${baseUrl}/api/v1/trips/${capacityOverflowTrip}`, {
        headers: { cookie: dispatcherCookie },
      });
      assert.equal(tripResponse.status, 200);
      const tripBody = await tripResponse.json() as TripResponse;
      assert.equal(tripBody.trip.status, 'DRAFT');

      const [vehicleRows] = await pool.query('SELECT status FROM vehicles WHERE id = ?', [vanAvailable]);
      const [driverRows] = await pool.query('SELECT status FROM drivers WHERE id = ?', [driverAvailable]);
      assert.equal((vehicleRows as Array<{ status: string }>)[0]?.status, 'AVAILABLE');
      assert.equal((driverRows as Array<{ status: string }>)[0]?.status, 'AVAILABLE');
    });

    await t.test('accepts cargo equal to capacity and atomically updates all resources', async () => {
      const response = await dispatch(capacityBoundaryTrip, vanAvailable, driverAvailable);
      assert.equal(response.status, 200);

      const body = await response.json() as TripResponse;
      assert.equal(body.trip.status, 'DISPATCHED');

      const [vehicleRows] = await pool.query('SELECT status FROM vehicles WHERE id = ?', [vanAvailable]);
      const [driverRows] = await pool.query('SELECT status FROM drivers WHERE id = ?', [driverAvailable]);
      const [auditRows] = await pool.query(
        'SELECT action FROM audit_logs WHERE entity_type = ? AND entity_id = ? ORDER BY id',
        ['trip', capacityBoundaryTrip],
      );

      assert.equal((vehicleRows as Array<{ status: string }>)[0]?.status, 'ON_TRIP');
      assert.equal((driverRows as Array<{ status: string }>)[0]?.status, 'ON_TRIP');
      assert.ok((auditRows as Array<{ action: string }>).some((row) => row.action === 'TRIP_DISPATCHED'));
    });

    await t.test('rejects completion when the vehicle state no longer matches the trip lifecycle', async () => {
      const driftTrip = await createDraft(600);
      const dispatchResponse = await dispatch(driftTrip, truckAvailable, alternateDriver);
      assert.equal(dispatchResponse.status, 200);

      await pool.query('UPDATE vehicles SET status = ? WHERE id = ?', ['AVAILABLE', truckAvailable]);

      const completeResponse = await fetch(`${baseUrl}/api/v1/trips/${driftTrip}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: dispatcherCookie,
        },
        body: JSON.stringify({ actual_distance_km: 50 }),
      });

      assert.equal(completeResponse.status, 422);
      const body = await completeResponse.json() as ApiError;
      assert.equal(body.error.code, 'VEHICLE_NOT_ON_TRIP');

      await pool.query('UPDATE vehicles SET status = ? WHERE id = ?', ['AVAILABLE', truckAvailable]);
      await pool.query('UPDATE drivers SET status = ? WHERE id = ?', ['AVAILABLE', alternateDriver]);
    });

    await t.test('rejects a rapid double dispatch for the same trip', async () => {
      const repeatedTrip = await createDraft(650);
      const first = await dispatch(repeatedTrip, truckAvailable, alternateDriver);
      assert.equal(first.status, 200);

      const second = await dispatch(repeatedTrip, truckAvailable, alternateDriver);
      assert.equal(second.status, 422);
      const secondBody = await second.json() as ApiError;
      assert.equal(secondBody.error.code, 'INVALID_TRIP_STATUS');

      await pool.query('UPDATE vehicles SET status = ? WHERE id = ?', ['AVAILABLE', truckAvailable]);
      await pool.query('UPDATE drivers SET status = ? WHERE id = ?', ['AVAILABLE', alternateDriver]);
    });

    await t.test('rejects a trip that is not in DRAFT status', async () => {
      await expectDispatchRejection(dispatchedTrip, truckAvailable, driverExpired, 'INVALID_TRIP_STATUS');
    });

    await t.test('rejects unavailable vehicle states with specific codes', async () => {
      await expectDispatchRejection(await createDraft(100), vehicleOnTrip, driverExpired, 'VEHICLE_ON_TRIP');
      await expectDispatchRejection(await createDraft(100), vehicleInShop, driverExpired, 'VEHICLE_IN_SHOP');
      await expectDispatchRejection(await createDraft(100), vehicleRetired, driverExpired, 'VEHICLE_RETIRED');
    });

    await t.test('rejects driver compliance and availability conflicts with specific codes', async () => {
      await expectDispatchRejection(await createDraft(100), truckAvailable, driverSuspended, 'DRIVER_SUSPENDED');
      await expectDispatchRejection(await createDraft(100), truckAvailable, driverOnTrip, 'DRIVER_ON_TRIP');
      await expectDispatchRejection(await createDraft(100), truckAvailable, driverOffDuty, 'DRIVER_OFF_DUTY');
      await expectDispatchRejection(await createDraft(100), truckAvailable, driverExpired, 'DRIVER_LICENCE_EXPIRED');
    });

  } finally {
    await pool.end();
    await stopServer();
  }
});
