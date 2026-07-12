import test from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import app from '../src/app.js';
import pool from '../src/db/pool.js';

let server: http.Server;
let baseUrl: string;

function startServer(): Promise<void> {
  return new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(0, () => {
      const address = server.address();
      baseUrl = `http://localhost:${typeof address === 'string' ? 0 : address?.port}`;
      resolve();
    });
  });
}

function sessionCookie(headers: Headers): string {
  const value = headers.get('set-cookie') ?? '';
  const match = value.match(/session_token=([^;]+)/);
  assert.ok(match, 'login should issue a session cookie');
  return `session_token=${match[1]}`;
}

test('finance and report evidence uses the deterministic seed values', async (t) => {
  await startServer();
  t.after(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await pool.end();
  });

  const login = await fetch(`${baseUrl}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'finance@transitops.com', password: 'password123' }),
  });
  assert.strictEqual(login.status, 200);
  const cookie = sessionCookie(login.headers);

  await t.test('summary and per-vehicle metrics equal the independently calculated seed totals', async () => {
    const response = await fetch(`${baseUrl}/api/v1/reports/summary`, { headers: { cookie } });
    assert.strictEqual(response.status, 200);
    const report = await response.json();

    assert.deepStrictEqual(report.summary, {
      fleet_utilisation_percent: 25,
      completed_revenue: 1200,
      fuel_cost: 4500,
      maintenance_cost: 0,
      expense_cost: 350,
      operational_cost: 4850,
      fleet_roi_percent: -3.06,
    });

    const completedVan = report.vehicles.find((vehicle: { registration_number: string }) => vehicle.registration_number === 'KA-01-AA-1111');
    assert.deepStrictEqual(completedVan && {
      completed_distance_km: completedVan.completed_distance_km,
      fuel_liters: completedVan.fuel_liters,
      fuel_efficiency_km_per_liter: completedVan.fuel_efficiency_km_per_liter,
      operational_cost: completedVan.operational_cost,
      roi_percent: completedVan.roi_percent,
    }, {
      completed_distance_km: 500,
      fuel_liters: 50,
      fuel_efficiency_km_per_liter: 10,
      operational_cost: 4850,
      roi_percent: -22,
    });
  });

  await t.test('CSV escapes quote, comma, and newline data and retains the report totals', async () => {
    const originalName = 'Rapid Cargo Van 1';
    const escapedName = 'Rapid, "Cargo"\nVan';
    await pool.query('UPDATE vehicles SET name = ? WHERE registration_number = ?', [escapedName, 'KA-01-AA-1111']);
    try {
      const response = await fetch(`${baseUrl}/api/v1/reports/export.csv`, { headers: { cookie } });
      assert.strictEqual(response.status, 200);
      const csv = await response.text();
      assert.match(csv, /"Rapid, ""Cargo""\nVan"/);
      assert.match(csv, /"FLEET TOTAL","","","","","4500","0","350","4850","1200","","-3\.06"/);
    } finally {
      await pool.query('UPDATE vehicles SET name = ? WHERE registration_number = ?', [originalName, 'KA-01-AA-1111']);
    }
  });
});
