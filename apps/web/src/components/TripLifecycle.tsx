import React from 'react';

type TripStatus = 'DRAFT' | 'DISPATCHED' | 'COMPLETED' | 'CANCELLED';

interface TripLifecycleProps {
  status: TripStatus | string;
  tripCode?: string;
}

const STEPS: { key: TripStatus; label: string }[] = [
  { key: 'DRAFT', label: 'Draft' },
  { key: 'DISPATCHED', label: 'Dispatched' },
  { key: 'COMPLETED', label: 'Completed' },
];

const CANCELLED_STEP = { key: 'CANCELLED' as TripStatus, label: 'Cancelled' };

export const TripLifecycle: React.FC<TripLifecycleProps> = ({ status, tripCode }) => {
  const normStatus = (status as string).toUpperCase() as TripStatus;
  const isCancelled = normStatus === 'CANCELLED';

  const steps = isCancelled
    ? [STEPS[0], STEPS[1], CANCELLED_STEP]
    : STEPS;

  const activeIndex = steps.findIndex((s) => s.key === normStatus);

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-3)',
  };

  const headerStyle: React.CSSProperties = {
    fontSize: 'var(--text-xs)',
    fontWeight: 600,
    color: 'var(--color-text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  };

  const stepRowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 0,
  };

  const getStepColor = (idx: number): string => {
    if (isCancelled && idx === steps.length - 1) return 'var(--color-danger)';
    if (idx < activeIndex) return 'var(--color-success)';
    if (idx === activeIndex) {
      switch (normStatus) {
        case 'DISPATCHED': return 'var(--color-info)';
        case 'COMPLETED': return 'var(--color-success)';
        case 'CANCELLED': return 'var(--color-danger)';
        default: return 'var(--color-neutral)';
      }
    }
    return 'var(--color-border)';
  };

  const getStepIcon = (idx: number): string => {
    if (isCancelled && idx === steps.length - 1) return '✕';
    if (idx < activeIndex) return '✓';
    if (idx === activeIndex) return '●';
    return '○';
  };

  return (
    <div style={containerStyle} role="group" aria-label={`Trip lifecycle: ${status}`}>
      {tripCode && (
        <div style={headerStyle}>
          Trip Lifecycle — <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text)' }}>{tripCode}</span>
        </div>
      )}
      <div style={stepRowStyle}>
        {steps.map((step, idx) => {
          const color = getStepColor(idx);
          const isActive = idx === activeIndex;
          return (
            <React.Fragment key={step.key}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '80px' }}>
                <div
                  aria-current={isActive ? 'step' : undefined}
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    border: `2px solid ${color}`,
                    backgroundColor: idx <= activeIndex ? color : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: idx <= activeIndex ? 'var(--color-canvas)' : color,
                    transition: 'all 0.2s ease',
                    flexShrink: 0,
                  }}
                >
                  {getStepIcon(idx)}
                </div>
                <span
                  style={{
                    fontSize: 'var(--text-xs)',
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? color : 'var(--color-text-muted)',
                    marginTop: 'var(--space-1)',
                    textAlign: 'center',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {step.label}
                </span>
              </div>
              {idx < steps.length - 1 && (
                <div
                  aria-hidden="true"
                  style={{
                    flex: 1,
                    height: '2px',
                    backgroundColor: idx < activeIndex ? 'var(--color-success)' : 'var(--color-border)',
                    marginBottom: '14px',
                    transition: 'background-color 0.2s ease',
                  }}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
