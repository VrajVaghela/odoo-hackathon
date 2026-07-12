import React, { useState, useEffect } from 'react';
import { LoginForm } from './features/auth/LoginForm.tsx';
import { AppShell } from './components/AppShell.tsx';
import { DashboardPage } from './features/dashboard/DashboardPage.tsx';
import { VehiclesPage } from './features/vehicles/VehiclesPage.tsx';
import { DriversPage } from './features/drivers/DriversPage.tsx';
import { TripsPage } from './features/trips/TripsPage.tsx';
import { MaintenancePage } from './features/maintenance/MaintenancePage.tsx';
import { FinancePage } from './features/finance/FinancePage.tsx';
import { ReportsPage } from './features/reports/ReportsPage.tsx';
import { UsersPage } from './features/users/UsersPage.tsx';
import { PageHeader } from './components/PageHeader.tsx';
import { EmptyState } from './components/EmptyState.tsx';

interface UserSession {
  email: string;
  role: string;
}

/**
 * Role → allowed page IDs mapping.
 * This is the single source of truth for role-based page access.
 */
const ROLE_PAGES: Record<string, string[]> = {
  FLEET_MANAGER: ['dashboard', 'vehicles', 'maintenance'],
  DISPATCHER: ['dashboard', 'trips'],
  SAFETY_OFFICER: ['drivers'],
  FINANCIAL_ANALYST: ['finance', 'reports'],
  ADMIN: ['dashboard', 'vehicles', 'drivers', 'trips', 'maintenance', 'finance', 'reports', 'users'],
};

const App: React.FC = () => {
  const [user, setUser] = useState<UserSession | null>(null);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [confirmState, setConfirmState] = useState<{ status: 'idle' | 'loading' | 'success' | 'error'; message: string }>({ status: 'idle', message: '' });

  // Load session from backend /api/v1/auth/me on mount to sync with cookie (important for OAuth redirect)
  useEffect(() => {
    const savedSession = localStorage.getItem('transitops_session');
    if (savedSession) {
      try {
        setUser(JSON.parse(savedSession));
      } catch (e) {
        localStorage.removeItem('transitops_session');
      }
    }

    fetch('/api/v1/auth/me')
      .then((res) => {
        if (res.ok) {
          return res.json();
        }
        throw new Error('Not authenticated');
      })
      .then((data) => {
        if (data && data.user) {
          setUser(data.user);
          localStorage.setItem('transitops_session', JSON.stringify(data.user));
          if (!savedSession) {
            const role = data.user.role;
            const allowed = ROLE_PAGES[role] || [];
            if (allowed.length > 0) {
              setCurrentPage(allowed[0]);
            } else {
              setCurrentPage('dashboard');
            }
          }
        } else {
          setUser(null);
          localStorage.removeItem('transitops_session');
        }
      })
      .catch(() => {
        setUser(null);
        localStorage.removeItem('transitops_session');
      });
  }, []);

  // Update initial page when user logs in based on role permission
  const handleLoginSuccess = (session: UserSession) => {
    setUser(session);
    localStorage.setItem('transitops_session', JSON.stringify(session));

    // Redirect to default view for role
    const role = session.role;
    const allowed = ROLE_PAGES[role] || [];
    if (allowed.length > 0) {
      setCurrentPage(allowed[0]);
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

  // Handle invitation confirmation page (public, before login check)
  const confirmToken = new URLSearchParams(window.location.search).get('confirm');
  if (confirmToken && confirmState.status === 'idle') {
    setConfirmState({ status: 'loading', message: 'Activating your account...' });
    fetch(`/api/v1/users/confirm/${confirmToken}`)
      .then(async (res) => {
        const data = await res.json();
        if (res.ok) {
          setConfirmState({ status: 'success', message: `Account activated for ${data.data?.email || 'your email'}! You can now log in.` });
        } else {
          setConfirmState({ status: 'error', message: data?.error?.message || 'Failed to activate account.' });
        }
        window.history.replaceState({}, document.title, window.location.pathname);
      })
      .catch(() => {
        setConfirmState({ status: 'error', message: 'Network error. Please try again.' });
        window.history.replaceState({}, document.title, window.location.pathname);
      });
  }

  if (confirmState.status !== 'idle') {
    const isSuccess = confirmState.status === 'success';
    const pageStyle: React.CSSProperties = {
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', backgroundColor: 'var(--color-canvas)', padding: 'var(--space-4)',
    };
    const cardStyle: React.CSSProperties = {
      maxWidth: '440px', width: '100%', padding: 'var(--space-8)',
      backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-md)', textAlign: 'center',
    };
    return (
      <div style={pageStyle}>
        <div style={cardStyle}>
          <span style={{ fontSize: '3rem' }}>{confirmState.status === 'loading' ? '⏳' : isSuccess ? '🎉' : '❌'}</span>
          <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--color-text)', margin: 'var(--space-4) 0 var(--space-2)' }}>
            {confirmState.status === 'loading' ? 'Activating...' : isSuccess ? 'Account Activated!' : 'Activation Failed'}
          </h2>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', lineHeight: 'var(--leading-normal)' }}>
            {confirmState.message}
          </p>
          {confirmState.status !== 'loading' && (
            <button
              type="button"
              onClick={() => { setConfirmState({ status: 'idle', message: '' }); window.location.href = '/'; }}
              style={{
                marginTop: 'var(--space-5)', height: 'var(--control-height)', padding: '0 var(--space-5)',
                backgroundColor: 'var(--color-primary)', color: 'var(--color-primary-contrast)',
                border: 'none', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-sm)',
                fontWeight: 700, cursor: 'pointer',
              }}
            >
              Go to Login
            </button>
          )}
        </div>
      </div>
    );
  }

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

  // Check if current page is allowed for user's role
  const allowedPages = ROLE_PAGES[user.role] || [];
  const hasPermission = allowedPages.includes(currentPage);

  // Render components based on pageId
  const renderPageContent = () => {
    // No-permission screen
    if (!hasPermission) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'var(--space-10)',
            textAlign: 'center',
            gap: 'var(--space-4)',
          }}>
            <span style={{ fontSize: '3rem' }} aria-hidden="true">🔒</span>
            <h2 style={{
              fontSize: 'var(--text-xl)',
              fontWeight: 800,
              color: 'var(--color-text)',
            }}>
              Access Restricted
            </h2>
            <p style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--color-text-muted)',
              maxWidth: '400px',
              lineHeight: 'var(--leading-normal)',
            }}>
              Your role <strong style={{ color: 'var(--color-primary)' }}>{user.role.replace(/_/g, ' ')}</strong> does not have permission to access this section.
              Use the sidebar to navigate to your authorized pages.
            </p>
            {allowedPages.length > 0 && (
              <button
                type="button"
                onClick={() => setCurrentPage(allowedPages[0])}
                style={{
                  height: 'var(--control-height)',
                  padding: '0 var(--space-5)',
                  backgroundColor: 'var(--color-primary)',
                  color: 'var(--color-primary-contrast)',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--color-primary-hover)'; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'var(--color-primary)'; }}
              >
                Go to My Dashboard
              </button>
            )}
          </div>
        </div>
      );
    }

    const containerStyle: React.CSSProperties = {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-6)',
    };

    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage userRole={user.role} />;

      case 'vehicles':
        return <VehiclesPage userRole={user.role} />;

      case 'drivers':
        return <DriversPage userRole={user.role} />;

      case 'trips':
        return <TripsPage userRole={user.role} />;

      case 'maintenance':
        return <MaintenancePage />;

      case 'finance':
        return <FinancePage />;

      case 'reports':
        return <ReportsPage />;

      case 'users':
        return <UsersPage />;

      default:
        return (
          <div style={containerStyle}>
            <PageHeader title="Page Not Found" description="The requested page does not exist." />
            <EmptyState
              icon="❓"
              title="Unknown page"
              description="Navigate using the sidebar menu."
              actionLabel="Go to Dashboard"
              onAction={() => setCurrentPage(allowedPages[0] || 'dashboard')}
            />
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
