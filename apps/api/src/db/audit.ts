import { PoolConnection } from 'mysql2/promise';

/**
 * Inserts an audit log entry in the database.
 * Designed to run within a transaction/connection pool query context.
 */
export async function logAuditEvent(
  connection: PoolConnection,
  actorUserId: number | null,
  entityType: string,
  entityId: number,
  action: string,
  beforeJson: object | null,
  afterJson: object | null
): Promise<void> {
  await connection.query(
    `INSERT INTO audit_logs (actor_user_id, entity_type, entity_id, action, before_json, after_json)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      actorUserId,
      entityType,
      entityId,
      action,
      beforeJson ? JSON.stringify(beforeJson) : null,
      afterJson ? JSON.stringify(afterJson) : null,
    ]
  );
}
