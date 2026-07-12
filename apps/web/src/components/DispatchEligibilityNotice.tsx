import React from 'react';

// Named subtypes for each conflict so TypeScript can narrow inside switch.
export type VehicleRetiredConflict    = { code: 'VEHICLE_RETIRED';        vehicleReg: string };
export type VehicleInShopConflict     = { code: 'VEHICLE_IN_SHOP';        vehicleReg: string };
export type VehicleOnTripConflict     = { code: 'VEHICLE_ON_TRIP';        vehicleReg: string };
export type VehicleUnavailConflict    = { code: 'VEHICLE_NOT_AVAILABLE';   vehicleReg: string };
export type DriverSuspendedConflict   = { code: 'DRIVER_SUSPENDED';       driverName: string };
export type DriverOffDutyConflict     = { code: 'DRIVER_OFF_DUTY';        driverName: string };
export type DriverOnTripConflict      = { code: 'DRIVER_ON_TRIP';         driverName: string };
export type DriverUnavailConflict     = { code: 'DRIVER_NOT_AVAILABLE';   driverName: string };
export type DriverExpiredConflict     = { code: 'DRIVER_LICENCE_EXPIRED'; driverName: string; expiryDate: string };
export type CargoConflict             = { code: 'CARGO_EXCEEDS_CAPACITY'; cargoKg: number; capacityKg: number; vehicleReg: string };
export type GenericConflict           = { code: string; message: string };

export type EligibilityConflict =
  | VehicleRetiredConflict
  | VehicleInShopConflict
  | VehicleOnTripConflict
  | VehicleUnavailConflict
  | DriverSuspendedConflict
  | DriverOffDutyConflict
  | DriverOnTripConflict
  | DriverUnavailConflict
  | DriverExpiredConflict
  | CargoConflict
  | GenericConflict;

interface DispatchEligibilityNoticeProps {
  conflict: EligibilityConflict | null;
}

function describeConflict(conflict: EligibilityConflict): { label: string; hint?: string } {
  switch (conflict.code) {
    case 'VEHICLE_RETIRED':
      return { label: `Vehicle ${(conflict as VehicleRetiredConflict).vehicleReg} is retired. Select a different vehicle.` };
    case 'VEHICLE_IN_SHOP':
      return { label: `Vehicle ${(conflict as VehicleInShopConflict).vehicleReg} is currently in the shop for maintenance and cannot be dispatched.` };
    case 'VEHICLE_ON_TRIP':
      return { label: `Vehicle ${(conflict as VehicleOnTripConflict).vehicleReg} is already assigned to an active trip.` };
    case 'VEHICLE_NOT_AVAILABLE':
      return { label: `Vehicle ${(conflict as VehicleUnavailConflict).vehicleReg} is not available for dispatch.` };
    case 'DRIVER_SUSPENDED':
      return { label: `Driver ${(conflict as DriverSuspendedConflict).driverName} is suspended. Only available drivers may be assigned.` };
    case 'DRIVER_OFF_DUTY':
      return { label: `Driver ${(conflict as DriverOffDutyConflict).driverName} is off duty. Select an available driver.` };
    case 'DRIVER_ON_TRIP':
      return { label: `Driver ${(conflict as DriverOnTripConflict).driverName} is already assigned to an active trip.` };
    case 'DRIVER_NOT_AVAILABLE':
      return { label: `Driver ${(conflict as DriverUnavailConflict).driverName} is not available for assignment.` };
    case 'DRIVER_LICENCE_EXPIRED': {
      const c = conflict as DriverExpiredConflict;
      return { label: `Driver ${c.driverName}'s licence expired on ${c.expiryDate}. A valid licence is required before dispatch.` };
    }
    case 'CARGO_EXCEEDS_CAPACITY': {
      const c = conflict as CargoConflict;
      return {
        label: `Cargo weight (${c.cargoKg} kg) exceeds ${c.vehicleReg}'s capacity of ${c.capacityKg} kg.`,
        hint: 'Reduce cargo weight or select a vehicle with higher capacity.',
      };
    }
    default: {
      const g = conflict as GenericConflict;
      return { label: g.message || 'Dispatch is not permitted. Check all fields.' };
    }
  }
}

export const DispatchEligibilityNotice: React.FC<DispatchEligibilityNoticeProps> = ({ conflict }) => {
  if (!conflict) return null;

  const { label, hint } = describeConflict(conflict);

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    gap: 'var(--space-3)',
    padding: 'var(--space-4)',
    borderRadius: 'var(--radius-md)',
    backgroundColor: 'rgba(233, 106, 106, 0.08)',
    border: '1px solid var(--color-danger)',
    marginBottom: 'var(--space-4)',
  };

  const iconStyle: React.CSSProperties = {
    fontSize: '16px',
    flexShrink: 0,
    marginTop: '2px',
    color: 'var(--color-danger)',
  };

  const bodyStyle: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-1)',
  };

  const codeStyle: React.CSSProperties = {
    fontSize: 'var(--text-xs)',
    fontWeight: 700,
    fontFamily: 'var(--font-mono)',
    color: 'var(--color-danger)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  };

  const messageStyle: React.CSSProperties = {
    fontSize: 'var(--text-sm)',
    color: 'var(--color-text)',
    lineHeight: 'var(--leading-normal)',
  };

  const hintStyle: React.CSSProperties = {
    fontSize: 'var(--text-xs)',
    color: 'var(--color-text-muted)',
    marginTop: 'var(--space-1)',
  };

  return (
    <div style={containerStyle} role="alert" aria-live="assertive">
      <span style={iconStyle} aria-hidden="true">⚠</span>
      <div style={bodyStyle}>
        <span style={codeStyle}>{conflict.code.replace(/_/g, ' ')}</span>
        <span style={messageStyle}>{label}</span>
        {hint && <span style={hintStyle}>Tip: {hint}</span>}
      </div>
    </div>
  );
};
