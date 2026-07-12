import mysql from 'mysql2/promise';
import path from 'node:path';
import fs from 'node:fs';
import dotenv from 'dotenv';

dotenv.config();
const parentEnv = path.resolve(process.cwd(), '../../.env');
if (fs.existsSync(parentEnv)) {
  dotenv.config({ path: parentEnv });
}

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'transitops',
  waitForConnections: true,
  connectionLimit: 10,
  maxIdle: 10, // max idle connections, the default is the same as connectionLimit
  idleTimeout: 60000, // idle connections timeout, in milliseconds, the default value 60000
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

export default pool;
