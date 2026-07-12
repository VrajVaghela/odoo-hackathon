import pool from './pool.js';
import { PoolConnection } from 'mysql2/promise';

/**
 * Executes a callback within a database transaction.
 * Automatically handles connection retrieval, transaction start, commit, rollback on error, and release.
 */
export async function withTransaction<T>(
  callback: (connection: PoolConnection) => Promise<T>
): Promise<T> {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    try {
      await connection.rollback();
    } catch (rollbackError) {
      console.error('Failed to rollback transaction:', rollbackError);
    }
    throw error;
  } finally {
    connection.release();
  }
}
