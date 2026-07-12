import React, { useState, useEffect } from 'react';
import { LoginForm } from './features/auth/LoginForm.tsx';
import { AppShell } from './components/AppShell.tsx';
import { MetricCard } from './components/MetricCard.tsx';
import { StatusBadge } from './components/StatusBadge.tsx';

interface UserSession {
  email: string;
  role: string;
}

const App: React.FC = () => {
  const [user, setUser] = useState<UserSession | null>(null);
  const [currentPage, setCurrentPage] = useState('dashboard');

  // Load session from localStorage on start
  useEffect(() => {
    const savedSession = localStorage.getItem('transitops_session');
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession);
        setUser(parsed);
      } catch (e) {
        localStorage.removeItem('transitops_session');
      }
    }
  }, []);

  // Update initial page when user logs in based on role permission
  const handleLoginSuccess = (session: UserSession) => {
    setUser(session);
    localStorage.setItem('transitops_session', JSON.stringify(session));

    // Redirect to default view for role
    const role = session.role;
    if (role === 'SAFETY_OFFICER') {
      setCurrentPage('drivers');
    } else if (role === 'FINANCIAL_ANALYST') {
      setCurrentPage('finance');
    } else {
      setCurrentPage('dashboard');
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/v1/auth/logout', { method: 'POST' }).catch(() => {});
    } finally {
      setUser(null);
      localStorage.removeItem('transitops_session');
    }
  };

  // Center page for login
  if (!user) {
    const loginPageStyle: React.CSSProperties = {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: 'var(--color-canvas)',
      padding: 'var(--space-4)',
    };
    return (
      <div style={loginPageStyle}>
        <LoginForm onLoginSuccess={handleLoginSuccess} />
      </div>
    );
  }

  // Render components based on pageId
  const renderPageContent = () => {
    const pageHeaderStyle: React.CSSProperties = {
      marginBottom: 'var(--space-6)',
    };
    const pageTitleStyle: React.CSSProperties = {
      fontSize: 'var(--text-xl)',
      fontWeight: 800,
      marginBottom: 'var(--space-1)',
    };
    const pageDescStyle: React.CSSProperties = {
      fontSize: 'var(--text-sm)',
      color: 'var(--color-text-muted)',
    };

    const containerStyle: React.CSSProperties = {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-6)',
    };

    switch (currentPage) {
      case 'dashboard':
        return (
          <div style={containerStyle}>
            <div style={pageHeaderStyle}>
              <h2 style={pageTitleStyle}>Operations Control Overview</h2>
              <p style={pageDescStyle}>Real-time metrics and active dispatches.</p>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-4)' }}>
              <MetricCard label="Active Vehicles" value="3" helperText="1 on trip, 1 in shop" statusToken="--color-info" />
              <MetricCard label="Available Drivers" value="2" helperText="John Doe, Jane Smith" statusToken="--color-success" />
              <MetricCard label="Pending Dispatches" value="1" helperText="TRP-103 is a draft" statusToken="--color-neutral" />
              <MetricCard label="Fleet Utilisation" value="60%" helperText="Goal: 75% for Q3" statusToken="--color-primary" />
            </div>

            <div style={{ backgroundColor: 'var(--color-surface-raised)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)' }}>
              <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>Active Dispatch Board</h3>
              <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
                Seeded trips and active resource tracks will display here once Phase 2 is completed.
              </p>
            </div>
          </div>
        );

      case 'vehicles':
        return (
          <div style={containerStyle}>
            <div style={pageHeaderStyle}>
              <h2 style={pageTitleStyle}>Fleet Registry</h2>
              <p style={pageDescStyle}>Manage fleet assets, configurations, and lifecycle status.</p>
            </div>
            <div style={{ backgroundColor: 'var(--color-surface-raised)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)' }}>
              <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>Vehicles List</h3>
              <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
                Seeded vehicles and status trackers will display here once Phase 2 is completed.
              </p>
            </div>
          </div>
        );

      case 'drivers':
        return (
          <div style={containerStyle}>
            <div style={pageHeaderStyle}>
              <h2 style={pageTitleStyle}>Drivers Compliance Panel</h2>
              <p style={pageDescStyle}>Track driver licenses, safety scores, and schedule status.</p>
            </div>
            <div style={{ backgroundColor: 'var(--color-surface-raised)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)' }}>
              <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>Seeded Drivers</h3>
              <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-4)' }}>
                This is a view showing initial seed drivers and compliance rules.
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <div style={{ border: '1px solid var(--color-border)', padding: 'var(--space-3)', borderRadius: 'var(--radius-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>John Doe</div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Licence: DL-11111 | Heavy | Expiry: 2027-12-31</div>
                  </div>
                  <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                    <span style={{ fontSize: 'var(--text-xs)', alignSelf: 'center', color: 'var(--color-success)' }}>Safety Score: 95</span>
                    <StatusBadge status="AVAILABLE" />
                  </div>
                </div>

                <div style={{ border: '1px solid var(--color-border)', padding: 'var(--space-3)', borderRadius: 'var(--radius-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>Charlie Green</div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Licence: DL-55555 | Light | Expiry: 2026-06-01</div>
                  </div>
                  <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-danger)', fontWeight: 600 }}>Licence Expired</span>
                    <StatusBadge status="AVAILABLE" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'trips':
        return (
          <div style={containerStyle}>
            <div style={pageHeaderStyle}>
              <h2 style={pageTitleStyle}>Trips & Dispatched Jobs</h2>
              <p style={pageDescStyle}>Plan routes, dispatch trips, and monitor active assignments.</p>
            </div>
            <div style={{ backgroundColor: 'var(--color-surface-raised)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)' }}>
              <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>Dispatched Trip Lifecycle</h3>
              <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
                Seeded trips and active dispatch operations will display here once Phase 2 is completed.
              </p>
            </div>
          </div>
        );

      case 'maintenance':
        return (
          <div style={containerStyle}>
            <div style={pageHeaderStyle}>
              <h2 style={pageTitleStyle}>Maintenance Logs</h2>
              <p style={pageDescStyle}>Track shop orders, mechanical issues, and maintenance schedules.</p>
            </div>
            <div style={{ backgroundColor: 'var(--color-surface-raised)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)' }}>
              <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>Active Service Orders</h3>
              <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
                Vehicles currently checked into the shop will display here once Phase 3 is completed.
              </p>
            </div>
          </div>
        );

      case 'finance':
        return (
          <div style={containerStyle}>
            <div style={pageHeaderStyle}>
              <h2 style={pageTitleStyle}>Fuel & Expense Ledger</h2>
              <p style={pageDescStyle}>Track operational costs, tolls, and refueling logs.</p>
            </div>
            <div style={{ backgroundColor: 'var(--color-surface-raised)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)' }}>
              <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>Refueling Logs & Tolls</h3>
              <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
                Seeded logs and ledger inputs will display here once Phase 3 is completed.
              </p>
            </div>
          </div>
        );

      case 'reports':
        return (
          <div style={containerStyle}>
            <div style={pageHeaderStyle}>
              <h2 style={pageTitleStyle}>Analytics Reports</h2>
              <p style={pageDescStyle}>Analyze fuel efficiency, fleet utilization, and ROI.</p>
            </div>
            <div style={{ backgroundColor: 'var(--color-surface-raised)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)' }}>
              <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>Fleet ROI Analysis</h3>
              <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
                Native SVG reports and CSV export handlers will be enabled here in Phase 3.
              </p>
            </div>
          </div>
        );

      default:
        return (
          <div>
            <h2>Console</h2>
            <p>Page content not found.</p>
          </div>
        );
    }
  };

  return (
    <AppShell
      user={user}
      onLogout={handleLogout}
      currentPage={currentPage}
      onPageChange={setCurrentPage}
    >
      {renderPageContent()}
    </AppShell>
  );
};

export default App;
