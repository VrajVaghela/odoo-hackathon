import { withTransaction } from '../../db/transaction.js';
import { logAuditEvent } from '../../db/audit.js';
import { BusinessRuleViolationError, ResourceNotFoundError } from '../../shared/errors/index.js';
import { CreateExpenseInput, CreateFuelLogInput, Expense, FinanceTripOption, FinanceVehicleOption, FuelLog } from './types.js';
import { FinanceRepository } from './repository.js';

const repo = new FinanceRepository();

export class FinanceService {
  async createFuelLog(input: CreateFuelLogInput, actorUserId: number | null): Promise<FuelLog> {
    return withTransaction(async (connection) => {
      const vehicle = await repo.findVehicleForUpdate(connection, input.vehicle_id);
      if (!vehicle) {
        throw new ResourceNotFoundError(`Vehicle ${input.vehicle_id} not found.`);
      }

      if (input.trip_id) {
        const trip = await repo.findTripForUpdate(connection, input.trip_id);
        if (!trip) {
          throw new ResourceNotFoundError(`Trip ${input.trip_id} not found.`);
        }
        if (trip.vehicle_id !== input.vehicle_id) {
          throw new BusinessRuleViolationError(
            'FUEL_TRIP_VEHICLE_MISMATCH',
            `Trip ${trip.trip_code} is not assigned to vehicle ${vehicle.registration_number}.`,
            'trip_id',
          );
        }
      }

      const previousOdometer = Number(vehicle.odometer_km);
      if (input.odometer_km < previousOdometer) {
        throw new BusinessRuleViolationError(
          'ODOMETER_BELOW_CURRENT',
          `Fuel odometer cannot be below ${vehicle.registration_number}'s current ${previousOdometer} km reading.`,
          'odometer_km',
        );
      }

      const fuelLogId = await repo.insertFuelLog(connection, input);
      if (input.odometer_km > previousOdometer) {
        await repo.updateVehicleOdometer(connection, input.vehicle_id, input.odometer_km);
      }

      await logAuditEvent(connection, actorUserId, 'fuel_log', fuelLogId, 'FUEL_LOG_CREATED', null, {
        vehicle_id: input.vehicle_id,
        trip_id: input.trip_id ?? null,
        liters: input.liters,
        cost: input.cost,
        odometer_km: input.odometer_km,
      });

      if (input.odometer_km > previousOdometer) {
        await logAuditEvent(connection, actorUserId, 'vehicle', input.vehicle_id, 'VEHICLE_ODOMETER_UPDATED', {
          odometer_km: previousOdometer,
        }, {
          odometer_km: input.odometer_km,
        });
      }

      return (await repo.findFuelLogById(fuelLogId, connection))!;
    });
  }

  async createExpense(input: CreateExpenseInput, actorUserId: number | null): Promise<Expense> {
    return withTransaction(async (connection) => {
      if (input.vehicle_id) {
        const vehicle = await repo.findVehicleForUpdate(connection, input.vehicle_id);
        if (!vehicle) {
          throw new ResourceNotFoundError(`Vehicle ${input.vehicle_id} not found.`);
        }
      }

      if (input.trip_id) {
        const trip = await repo.findTripForUpdate(connection, input.trip_id);
        if (!trip) {
          throw new ResourceNotFoundError(`Trip ${input.trip_id} not found.`);
        }
        if (input.vehicle_id && trip.vehicle_id !== input.vehicle_id) {
          throw new BusinessRuleViolationError(
            'EXPENSE_TRIP_VEHICLE_MISMATCH',
            `Trip ${trip.trip_code} is not assigned to the selected vehicle.`,
            'trip_id',
          );
        }
      }

      const expenseId = await repo.insertExpense(connection, input);
      await logAuditEvent(connection, actorUserId, 'expense', expenseId, 'EXPENSE_CREATED', null, {
        vehicle_id: input.vehicle_id ?? null,
        trip_id: input.trip_id ?? null,
        category: input.category,
        amount: input.amount,
      });
      return (await repo.findExpenseById(expenseId, connection))!;
    });
  }

  async listFuelLogs(vehicleId?: number): Promise<FuelLog[]> {
    return repo.listFuelLogs(vehicleId);
  }

  async listExpenses(vehicleId?: number): Promise<Expense[]> {
    return repo.listExpenses(vehicleId);
  }

  async listVehicleOptions(): Promise<FinanceVehicleOption[]> {
    return repo.listVehicleOptions();
  }

  async listTripOptions(): Promise<FinanceTripOption[]> {
    return repo.listTripOptions();
  }
}
