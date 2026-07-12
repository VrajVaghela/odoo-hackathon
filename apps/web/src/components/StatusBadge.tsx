import React from 'react';

export type StatusType =
  | 'AVAILABLE'
  | 'COMPLETED'
  | 'ON_TRIP'
  | 'DISPATCHED'
  | 'IN_SHOP'
  | 'RETIRED'
  | 'SUSPENDED'
  | 'CANCELLED'
  | 'DRAFT'
  | 'OFF_DUTY';

interface StatusBadgeProps {
  status: StatusType | string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const normStatus = status.toUpperCase();

  let colorVar = '--color-neutral';
  let label = status;

  switch (normStatus) {
    case 'AVAILABLE':
    case 'COMPLETED':
      colorVar = '--color-success';
      label = normStatus === 'AVAILABLE' ? 'Available' : 'Completed';
      break;
    case 'ON_TRIP':
    case 'DISPATCHED':
      colorVar = '--color-info';
      label = normStatus === 'ON_TRIP' ? 'On Trip' : 'Dispatched';
      break;
    case 'IN_SHOP':
      colorVar = '--color-warning';
      label = 'In Shop';
      break;
    case 'RETIRED':
      colorVar = '--color-danger';
      label = 'Retired';
      break;
    case 'SUSPENDED':
      colorVar = '--color-danger';
      label = 'Suspended';
      break;
    case 'CANCELLED':
      colorVar = '--color-danger';
      label = 'Cancelled';
      break;
    case 'DRAFT':
      colorVar = '--color-neutral';
      label = 'Draft';
      break;
    case 'OFF_DUTY':
      colorVar = '--color-neutral';
      label = 'Off Duty';
      break;
    default:
      colorVar = '--color-neutral';
      label = status;
  }

  const badgeStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '0.25rem 0.5rem',
    borderRadius: 'var(--radius-sm)',
    fontSize: 'var(--text-xs)',
    fontWeight: 600,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    border: `1px solid var(${colorVar})`,
    color: `var(${colorVar})`,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  };

  return (
    <span style={badgeStyle}>
      {label}
    </span>
  );
};
