import { ValidationError } from '../../shared/errors/index.js';
import { CreateExpenseInput, CreateFuelLogInput, EXPENSE_CATEGORIES, ExpenseCategory } from './types.js';

function asRecord(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null) {
    throw new ValidationError('Request body must be a JSON object.');
  }
  return value as Record<string, unknown>;
}

function positiveInteger(value: unknown, field: string, optional = false): number | undefined {
  if (optional && (value === undefined || value === null || value === '')) return undefined;
  const numberValue = Number(value);
  if (!Number.isInteger(numberValue) || numberValue <= 0) {
    throw new ValidationError(`${field} must be a positive integer.`, field);
  }
  return numberValue;
}

function positiveNumber(value: unknown, field: string, allowZero = false): number {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue) || (allowZero ? numberValue < 0 : numberValue <= 0)) {
    throw new ValidationError(`${field} must be ${allowZero ? 'zero or greater' : 'greater than zero'}.`, field);
  }
  return numberValue;
}

function dateTime(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new ValidationError(`${field} is required.`, field);
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new ValidationError(`${field} must be a valid date and time.`, field);
  }
  return parsed.toISOString().slice(0, 19).replace('T', ' ');
}

export function validateCreateFuelLogInput(body: unknown): CreateFuelLogInput {
  const record = asRecord(body);
  const vehicleId = positiveInteger(record.vehicle_id, 'vehicle_id');
  if (vehicleId === undefined) throw new ValidationError('vehicle_id is required.', 'vehicle_id');

  return {
    vehicle_id: vehicleId,
    trip_id: positiveInteger(record.trip_id, 'trip_id', true),
    logged_at: dateTime(record.logged_at, 'logged_at'),
    liters: positiveNumber(record.liters, 'liters'),
    cost: positiveNumber(record.cost, 'cost'),
    odometer_km: positiveNumber(record.odometer_km, 'odometer_km', true),
  };
}

export function validateCreateExpenseInput(body: unknown): CreateExpenseInput {
  const record = asRecord(body);
  const vehicleId = positiveInteger(record.vehicle_id, 'vehicle_id', true);
  const tripId = positiveInteger(record.trip_id, 'trip_id', true);
  if (!vehicleId && !tripId) {
    throw new ValidationError('An expense must be linked to a vehicle or trip.', 'vehicle_id');
  }

  const category = typeof record.category === 'string' ? record.category.trim().toUpperCase() : '';
  if (!EXPENSE_CATEGORIES.includes(category as ExpenseCategory)) {
    throw new ValidationError(`category must be one of: ${EXPENSE_CATEGORIES.join(', ')}.`, 'category');
  }

  const note = typeof record.note === 'string' ? record.note.trim() : undefined;
  return {
    vehicle_id: vehicleId,
    trip_id: tripId,
    category: category as ExpenseCategory,
    amount: positiveNumber(record.amount, 'amount'),
    occurred_at: dateTime(record.occurred_at, 'occurred_at'),
    ...(note ? { note } : {}),
  };
}
