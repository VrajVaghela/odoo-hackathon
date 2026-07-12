import test from 'node:test';
import assert from 'node:assert';
import http from 'http';
import app from '../src/app.js';
import pool from '../src/db/pool.js';

let server: http.Server;
let baseUrl: string;

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

async function stopServer(): Promise<void> {
  await pool.end();
  return new Promise((resolve) => {
    server.close(() => resolve());
  });
}

// Utility to parse cookies from response headers
function getSessionCookie(headers: Headers): string | null {
  const setCookie = headers.get('set-cookie');
  if (!setCookie) return null;
  const match = setCookie.match(/session_token=([^;]+)/);
  return match ? `session_token=${match[1]}` : null;
}

test('Phase 2 API Integration Tests', async (t) => {
  await startServer();

  let managerCookie: string = '';
  let dispatcherCookie: string = '';
  let safetyCookie: string = '';

  await t.test('Auth: Login successfully with different roles', async () => {
    // 1. Log in as Fleet Manager
    const managerRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'manager@transitops.com', password: 'password123' }),
    });
    assert.strictEqual(managerRes.status, 200);
    const managerBody = await managerRes.json();
    assert.strictEqual(managerBody.user.role, 'FLEET_MANAGER');
    managerCookie = getSessionCookie(managerRes.headers) || '';
    assert.ok(managerCookie.includes('session_token'));

    // 2. Log in as Dispatcher
    const dispatcherRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'dispatcher@transitops.com', password: 'password123' }),
    });
    assert.strictEqual(dispatcherRes.status, 200);
    const dispatcherBody = await dispatcherRes.json();
    assert.strictEqual(dispatcherBody.user.role, 'DISPATCHER');
    dispatcherCookie = getSessionCookie(dispatcherRes.headers) || '';

    // 3. Log in as Safety Officer
    const safetyRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'safety@transitops.com', password: 'password123' }),
    });
    assert.strictEqual(safetyRes.status, 200);
    const safetyBody = await safetyRes.json();
    assert.strictEqual(safetyBody.user.role, 'SAFETY_OFFICER');
    safetyCookie = getSessionCookie(safetyRes.headers) || '';
  });

  await t.test('Vehicles: RBAC constraints', async () => {
    // GET /vehicles should fail without login
    const noAuthRes = await fetch(`${baseUrl}/api/v1/vehicles`);
    assert.strictEqual(noAuthRes.status, 401);

    // GET /vehicles should fail for Safety Officer (forbidden)
    const safetyAuthRes = await fetch(`${baseUrl}/api/v1/vehicles`, {
      headers: { cookie: safetyCookie },
    });
    assert.strictEqual(safetyAuthRes.status, 403);

    // GET /vehicles should succeed for Fleet Manager
    const managerAuthRes = await fetch(`${baseUrl}/api/v1/vehicles`, {
      headers: { cookie: managerCookie },
    });
    assert.strictEqual(managerAuthRes.status, 200);
    const listBody = await managerAuthRes.json();
    assert.ok(Array.isArray(listBody.vehicles));
  });

  await t.test('Vehicles: Register new vehicle & validation rules', async () => {
    // 1. Uniqueness check (KA-01-AA-1111 already exists in seed)
    const duplicateRes = await fetch(`${baseUrl}/api/v1/vehicles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: managerCookie,
      },
      body: JSON.stringify({
        registration_number: 'ka-01-aa-1111', // Test normalization to uppercase
        name: 'Duplicate Van',
        model: 'Tata',
        vehicle_type: 'VAN',
        max_capacity_kg: 1000,
        acquisition_cost: 10000,
        region: 'South',
      }),
    });
    assert.strictEqual(duplicateRes.status, 409);
    const duplicateBody = await duplicateRes.json();
    assert.strictEqual(duplicateBody.error.code, 'CONFLICT');

    // 2. Numeric limit check (max_capacity <= 0)
    const invalidRes = await fetch(`${baseUrl}/api/v1/vehicles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: managerCookie,
      },
      body: JSON.stringify({
        registration_number: 'KA-01-XX-9999',
        name: 'Invalid Van',
        model: 'Tata',
        vehicle_type: 'VAN',
        max_capacity_kg: -50,
        acquisition_cost: 10000,
        region: 'South',
      }),
    });
    assert.strictEqual(invalidRes.status, 422);
    const invalidBody = await invalidRes.json();
    assert.strictEqual(invalidBody.error.code, 'VALIDATION_ERROR');

    // 3. Successful registration
    const uniqueReg = `KA-01-NEW-${Math.floor(Math.random() * 10000)}`;
    const createRes = await fetch(`${baseUrl}/api/v1/vehicles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: managerCookie,
      },
      body: JSON.stringify({
        registration_number: `  ${uniqueReg}  `, // test trim normalization
        name: 'New Cargo Truck',
        model: 'Eicher Pro',
        vehicle_type: 'TRUCK',
        max_capacity_kg: 3500.50,
        acquisition_cost: 25000,
        region: 'North',
      }),
    });
    assert.strictEqual(createRes.status, 201);
    const createBody = await createRes.json();
    assert.strictEqual(createBody.vehicle.registration_number, uniqueReg);
    assert.strictEqual(createBody.vehicle.status, 'AVAILABLE');
    assert.strictEqual(createBody.vehicle.max_capacity_kg, 3500.50);
  });

  await t.test('Vehicles: Edit/update & status lifecycle transitions', async () => {
    // Find the vehicle with status ON_TRIP (seeded vehicle Tata Winger KA-01-AC-3333)
    const listRes = await fetch(`${baseUrl}/api/v1/vehicles`, {
      headers: { cookie: managerCookie },
    });
    const listBody = await listRes.json();
    const onTripVehicle = listBody.vehicles.find((v: any) => v.status === 'ON_TRIP');
    const availableVehicle = listBody.vehicles.find((v: any) => v.status === 'AVAILABLE');

    assert.ok(onTripVehicle, 'Should find a seeded vehicle that is ON_TRIP');
    assert.ok(availableVehicle, 'Should find a seeded vehicle that is AVAILABLE');

    // 1. Try to manually change status of ON_TRIP vehicle -> Expect 422/409 state conflict
    const editOnTripRes = await fetch(`${baseUrl}/api/v1/vehicles/${onTripVehicle.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        cookie: managerCookie,
      },
      body: JSON.stringify({ status: 'AVAILABLE' }),
    });
    assert.strictEqual(editOnTripRes.status, 422);
    const editOnTripBody = await editOnTripRes.json();
    assert.strictEqual(editOnTripBody.error.code, 'INVALID_STATE_CHANGE');

    // 2. Try to manually set status TO 'ON_TRIP' -> Expect failure
    const editToOnTripRes = await fetch(`${baseUrl}/api/v1/vehicles/${availableVehicle.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        cookie: managerCookie,
      },
      body: JSON.stringify({ status: 'ON_TRIP' }),
    });
    assert.strictEqual(editToOnTripRes.status, 422);

    // 3. Valid transition: AVAILABLE -> RETIRED
    const retireRes = await fetch(`${baseUrl}/api/v1/vehicles/${availableVehicle.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        cookie: managerCookie,
      },
      body: JSON.stringify({ status: 'RETIRED' }),
    });
    assert.strictEqual(retireRes.status, 200);
    const retireBody = await retireRes.json();
    assert.strictEqual(retireBody.vehicle.status, 'RETIRED');
    assert.ok(retireBody.vehicle.retired_at);

    // 4. Valid transition: RETIRED -> AVAILABLE
    const restoreRes = await fetch(`${baseUrl}/api/v1/vehicles/${availableVehicle.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        cookie: managerCookie,
      },
      body: JSON.stringify({ status: 'AVAILABLE' }),
    });
    assert.strictEqual(restoreRes.status, 200);
    const restoreBody = await restoreRes.json();
    assert.strictEqual(restoreBody.vehicle.status, 'AVAILABLE');
    assert.strictEqual(restoreBody.vehicle.retired_at, null);
  });

  await t.test('Drivers: RBAC & Validation constraints', async () => {
    // GET /drivers should fail for Fleet Manager (forbidden)
    const managerAuthRes = await fetch(`${baseUrl}/api/v1/drivers`, {
      headers: { cookie: managerCookie },
    });
    assert.strictEqual(managerAuthRes.status, 403);

    // GET /drivers should succeed for Safety Officer
    const safetyAuthRes = await fetch(`${baseUrl}/api/v1/drivers`, {
      headers: { cookie: safetyCookie },
    });
    assert.strictEqual(safetyAuthRes.status, 200);
    const listBody = await safetyAuthRes.json();
    assert.ok(Array.isArray(listBody.drivers));

    // Create duplicate licence number check (DL-11111 exists in seed)
    const duplicateRes = await fetch(`${baseUrl}/api/v1/drivers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: safetyCookie,
      },
      body: JSON.stringify({
        full_name: 'Dup Driver',
        licence_number: 'dl-11111', // normalized to uppercase
        licence_category: 'HEAVY',
        licence_expiry_date: '2027-12-31',
        contact_number: '+91 0000000000',
        safety_score: 95,
      }),
    });
    assert.strictEqual(duplicateRes.status, 409);

    // Score out of range check
    const invalidScoreRes = await fetch(`${baseUrl}/api/v1/drivers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: safetyCookie,
      },
      body: JSON.stringify({
        full_name: 'Invalid Score Driver',
        licence_number: 'DL-99999',
        licence_category: 'HEAVY',
        licence_expiry_date: '2027-12-31',
        contact_number: '+91 0000000000',
        safety_score: 105, // score exceeds 100
      }),
    });
    assert.strictEqual(invalidScoreRes.status, 422);

    // Successful driver creation
    const uniqueLicence = `DL-${Math.floor(Math.random() * 100000)}`;
    const createRes = await fetch(`${baseUrl}/api/v1/drivers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: safetyCookie,
      },
      body: JSON.stringify({
        full_name: 'Mark Ruffalo',
        licence_number: `  ${uniqueLicence}  `,
        licence_category: 'LIGHT',
        licence_expiry_date: '2028-10-15',
        contact_number: '+91 9876543210',
        safety_score: 91.50,
      }),
    });
    assert.strictEqual(createRes.status, 201);
    const createBody = await createRes.json();
    assert.strictEqual(createBody.driver.licence_number, uniqueLicence);
    assert.strictEqual(createBody.driver.safety_score, 91.50);
  });

  await t.test('Drivers: Edit/update & status lifecycle transitions', async () => {
    const listRes = await fetch(`${baseUrl}/api/v1/drivers`, {
      headers: { cookie: safetyCookie },
    });
    const listBody = await listRes.json();
    const onTripDriver = listBody.drivers.find((d: any) => d.status === 'ON_TRIP');
    const availableDriver = listBody.drivers.find((d: any) => d.status === 'AVAILABLE');

    assert.ok(onTripDriver, 'Should find a seeded driver on trip');
    assert.ok(availableDriver, 'Should find a seeded available driver');

    // Try manually updating ON_TRIP driver -> Expect 422
    const editOnTripRes = await fetch(`${baseUrl}/api/v1/drivers/${onTripDriver.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        cookie: safetyCookie,
      },
      body: JSON.stringify({ status: 'AVAILABLE' }),
    });
    assert.strictEqual(editOnTripRes.status, 422);

    // Try manually setting to ON_TRIP -> Expect 422
    const editToOnTripRes = await fetch(`${baseUrl}/api/v1/drivers/${availableDriver.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        cookie: safetyCookie,
      },
      body: JSON.stringify({ status: 'ON_TRIP' }),
    });
    assert.strictEqual(editToOnTripRes.status, 422);

    // Valid transition: AVAILABLE -> SUSPENDED
    const suspendRes = await fetch(`${baseUrl}/api/v1/drivers/${availableDriver.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        cookie: safetyCookie,
      },
      body: JSON.stringify({ status: 'SUSPENDED' }),
    });
    assert.strictEqual(suspendRes.status, 200);
    const suspendBody = await suspendRes.json();
    assert.strictEqual(suspendBody.driver.status, 'SUSPENDED');
  });

  await t.test('Trips Contract: Available resources queries for Teammate 3', async () => {
    // 1. GET /vehicles/available
    const resVehicles = await fetch(`${baseUrl}/api/v1/vehicles/available`, {
      headers: { cookie: dispatcherCookie },
    });
    assert.strictEqual(resVehicles.status, 200);
    const bodyVehicles = await resVehicles.json();
    assert.ok(Array.isArray(bodyVehicles.vehicles));
    // Verify none of the available vehicles are in shop, retired, or on trip
    for (const v of bodyVehicles.vehicles) {
      assert.strictEqual(v.status, 'AVAILABLE');
      assert.strictEqual(v.retired_at, null);
    }

    // 2. GET /drivers/available
    const resDrivers = await fetch(`${baseUrl}/api/v1/drivers/available`, {
      headers: { cookie: dispatcherCookie },
    });
    assert.strictEqual(resDrivers.status, 200);
    const bodyDrivers = await resDrivers.json();
    assert.ok(Array.isArray(bodyDrivers.drivers));
    for (const d of bodyDrivers.drivers) {
      assert.strictEqual(d.status, 'AVAILABLE');
      const expiry = new Date(d.licence_expiry_date);
      assert.ok(expiry.getTime() >= Date.now() - 24 * 60 * 60 * 1000); // not expired
    }
  });

  await t.test('Dashboard: KPIs and active board', async () => {
    const res = await fetch(`${baseUrl}/api/v1/dashboard`, {
      headers: { cookie: dispatcherCookie },
    });
    assert.strictEqual(res.status, 200);
    const body = await res.json();

    // Check KPIs schema
    assert.ok(body.kpis);
    assert.ok(body.kpis.activeVehicles);
    assert.ok(body.kpis.availableDrivers);
    assert.ok(body.kpis.pendingDispatches);
    assert.ok(body.kpis.fleetUtilization);

    // Check active trips
    assert.ok(Array.isArray(body.activeTrips));
    for (const t of body.activeTrips) {
      assert.ok(['DRAFT', 'DISPATCHED'].includes(t.status));
    }
  });

  await stopServer();
});
