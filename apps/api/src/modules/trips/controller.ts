import { Request, Response, NextFunction } from 'express';
import { TripService } from './service.js';
import { validateCreateTripInput, validateDispatchTripInput, validateCompleteTripInput, validateCancelTripInput } from './validator.js';
import { AuthenticatedRequest } from '../../middleware/auth.js';

const tripService = new TripService();

/**
 * POST /api/v1/trips
 * Creates a new DRAFT trip.
 */
export async function createTrip(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const input = validateCreateTripInput(req.body);
    const trip = await tripService.createDraft(input, req.user?.id ?? null);
    res.status(201).json({ trip });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/v1/trips/:id/dispatch
 * Dispatches a DRAFT trip with all business rule checks under row locks.
 */
export async function dispatchTrip(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const tripId = Number(req.params.id);
    const input = validateDispatchTripInput(req.body);
    const trip = await tripService.dispatchTrip(tripId, input, req.user?.id ?? null);
    res.status(200).json({
      trip,
      message: `${trip.trip_code} dispatched successfully.`,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/v1/trips/:id/complete
 * Marks a DISPATCHED trip as COMPLETED; records actual distance and restores availability.
 */
export async function completeTrip(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const tripId = Number(req.params.id);
    const input = validateCompleteTripInput(req.body);
    const trip = await tripService.completeTrip(tripId, input, req.user?.id ?? null);
    res.status(200).json({
      trip,
      message: `${trip.trip_code} marked as completed. Vehicle and driver are now available.`,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/v1/trips/:id/cancel
 * Cancels a DRAFT or DISPATCHED trip; safely restores vehicle/driver availability.
 */
export async function cancelTrip(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const tripId = Number(req.params.id);
    const input = validateCancelTripInput(req.body);
    const trip = await tripService.cancelTrip(tripId, input, req.user?.id ?? null);
    res.status(200).json({
      trip,
      message: `${trip.trip_code} has been cancelled.`,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/trips
 * Lists trips, optionally filtered by status query param.
 */
export async function listTrips(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    const trips = await tripService.listTrips(status);
    res.status(200).json({ trips });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/trips/:id
 * Fetches a single trip by id.
 */
export async function getTrip(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const tripId = Number(req.params.id);
    const trip = await tripService.getTrip(tripId);
    res.status(200).json({ trip });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/trips/dispatch-options
 * Returns available vehicles and drivers for the dispatch form selectors.
 */
export async function getDispatchOptions(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const options = await tripService.getDispatchOptions();
    res.status(200).json(options);
  } catch (err) {
    next(err);
  }
}
