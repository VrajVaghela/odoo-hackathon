import { DashboardRepository, DashboardKPIs, DashboardTrip } from './repository.js';

export class DashboardService {
  private dashboardRepository = new DashboardRepository();

  /**
   * Aggregates and calculates dashboard metrics and retrieves filtered active trips.
   */
  async getDashboardData(filters: {
    vehicleType?: string;
    region?: string;
    status?: string;
  }): Promise<{ kpis: any; activeTrips: DashboardTrip[] }> {
    // 1. Get vehicle breakdown
    const vehicleBreakdown = await this.dashboardRepository.getVehicleBreakdown({
      vehicleType: filters.vehicleType,
      region: filters.region,
    });

    // 2. Get available drivers
    const availableDrivers = await this.dashboardRepository.getAvailableDrivers();

    // 3. Get pending dispatches (draft trips)
    const pendingDispatches = await this.dashboardRepository.getPendingDispatches({
      vehicleType: filters.vehicleType,
      region: filters.region,
    });

    // 4. Calculate fleet utilization
    // utilization = on_trip / total_active_vehicles * 100
    let utilizationPercent = 0;
    if (vehicleBreakdown.total > 0) {
      utilizationPercent = Math.round((vehicleBreakdown.onTrip / vehicleBreakdown.total) * 100);
    }
    const fleetUtilization = {
      value: `${utilizationPercent}%`,
    };

    // 5. Get retired vehicles count, total drivers, and trip metrics
    const retiredCount = await this.dashboardRepository.getRetiredVehiclesCount({
      vehicleType: filters.vehicleType,
      region: filters.region,
    });
    const totalDrivers = await this.dashboardRepository.getTotalDriversCount();
    const tripMetrics = await this.dashboardRepository.getTripStatusCounts({
      vehicleType: filters.vehicleType,
      region: filters.region,
    });

    const totalVehiclesCount = vehicleBreakdown.total + retiredCount;

    // 6. Get active/recent trips list for the dispatch board
    const activeTrips = await this.dashboardRepository.getActiveTrips(filters);

    const kpis = {
      // Original nested fields for backward compatibility/tests
      activeVehicles: {
        total: vehicleBreakdown.total,
        onTrip: vehicleBreakdown.onTrip,
        inShop: vehicleBreakdown.inShop,
        available: vehicleBreakdown.available,
      },
      availableDrivers: {
        total: availableDrivers.total,
        names: availableDrivers.names,
      },
      pendingDispatches: {
        total: pendingDispatches.total,
        draftTripCodes: pendingDispatches.draftTripCodes,
      },
      fleetUtilization,

      // New flat fields for the frontend
      totalVehicles: totalVehiclesCount,
      availableVehicles: vehicleBreakdown.available,
      onTripVehicles: vehicleBreakdown.onTrip,
      inShopVehicles: vehicleBreakdown.inShop,
      retiredVehicles: retiredCount,
      totalDrivers,
      availableDriversCount: availableDrivers.total,
      activeTrips: tripMetrics.active,
      draftTrips: tripMetrics.draft,
      completedTrips: tripMetrics.completed,
      fleetUtilisation: utilizationPercent,
    };

    return { kpis, activeTrips };
  }
}
