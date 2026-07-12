import React, { useState } from 'react';

export type RoleType = 'FLEET_MANAGER' | 'DISPATCHER' | 'SAFETY_OFFICER' | 'FINANCIAL_ANALYST';

interface NavItem {
  id: string;
  label: string;
  icon: string;
  roles: RoleType[];
}

interface AppShellProps {
  user: { email: string; role: RoleType | string };
  onLogout: () => void;
  currentPage: string;
  onPageChange: (pageId: string) => void;
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  user,
  onLogout,
  currentPage,
  onPageChange,
  children,
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const userRole = user.role as RoleType;

  const navigationItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊', roles: ['FLEET_MANAGER', 'DISPATCHER'] },
    { id: 'vehicles', label: 'Fleet Registry', icon: '🚗', roles: ['FLEET_MANAGER'] },
    { id: 'drivers', label: 'Drivers & Safety', icon: '👤', roles: ['SAFETY_OFFICER'] },
    { id: 'trips', label: 'Trips & Dispatch', icon: '🚛', roles: ['DISPATCHER'] },
    { id: 'maintenance', label: 'Maintenance', icon: '🔧', roles: ['FLEET_MANAGER'] },
    { id: 'finance', label: 'Fuel & Expenses', icon: '💰', roles: ['FINANCIAL_ANALYST'] },
    { id: 'reports', label: 'Analytics', icon: '📈', roles: ['FINANCIAL_ANALYST'] },
  ];

  // Filter nav items based on user role
  const visibleNavItems = navigationItems.filter(item => item.roles.includes(userRole));

  const roleLabels: Record<RoleType, string> = {
    FLEET_MANAGER: 'Fleet Manager',
    DISPATCHER: 'Dispatcher',
    SAFETY_OFFICER: 'Safety Officer',
    FINANCIAL_ANALYST: 'Financial Analyst',
  };

  const handleNavClick = (pageId: string) => {
    onPageChange(pageId);
    setMobileOpen(false);
  };

  // Styles
  const layoutStyle: React.CSSProperties = {
    display: 'flex',
    height: '100%',
    width: '100%',
    overflow: 'hidden',
  };

  const sidebarStyle: React.CSSProperties = {
    width: 'var(--sidebar-width)',
    backgroundColor: 'var(--color-surface)',
    borderRight: '1px solid var(--color-border)',
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
    zIndex: 20,
  };

  const mobileSidebarStyle: React.CSSProperties = {
    ...sidebarStyle,
    position: 'fixed',
    top: 0,
    left: 0,
    bottom: 0,
    transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
    transition: 'transform 0.25s ease',
    boxShadow: mobileOpen ? 'var(--shadow-panel)' : 'none',
  };

  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 15,
    opacity: mobileOpen ? 1 : 0,
    pointerEvents: mobileOpen ? 'auto' : 'none',
    transition: 'opacity 0.25s ease',
  };

  const logoAreaStyle: React.CSSProperties = {
    padding: 'var(--space-5)',
    borderBottom: '1px solid var(--color-border)',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  };

  const navListStyle: React.CSSProperties = {
    listStyle: 'none',
    padding: 'var(--space-4) 0',
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-1)',
    flexGrow: 1,
    overflowY: 'auto',
  };

  const navItemStyle = (isActive: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-3)',
    width: '100%',
    padding: 'var(--space-3) var(--space-5)',
    border: 'none',
    backgroundColor: isActive ? 'var(--color-surface-raised)' : 'transparent',
    color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)',
    borderLeft: isActive ? '4px solid var(--color-primary)' : '4px solid transparent',
    fontSize: 'var(--text-sm)',
    fontWeight: isActive ? 700 : 500,
    textAlign: 'left',
    cursor: 'pointer',
    transition: 'color 0.2s, background-color 0.2s',
  });

  const footerAreaStyle: React.CSSProperties = {
    padding: 'var(--space-4) var(--space-5)',
    borderTop: '1px solid var(--color-border)',
    backgroundColor: 'var(--color-surface-raised)',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-2)',
  };

  const userEmailStyle: React.CSSProperties = {
    fontSize: 'var(--text-xs)',
    fontWeight: 600,
    color: 'var(--color-text)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  };

  const userRoleBadgeStyle: React.CSSProperties = {
    alignSelf: 'flex-start',
    backgroundColor: 'var(--color-primary)',
    color: 'var(--color-primary-contrast)',
    fontSize: '10px',
    fontWeight: 700,
    padding: '2px var(--space-2)',
    borderRadius: 'var(--radius-sm)',
    textTransform: 'uppercase',
  };

  const logoutButtonStyle: React.CSSProperties = {
    background: 'none',
    border: '1px solid var(--color-border)',
    color: 'var(--color-text-muted)',
    padding: 'var(--space-2)',
    borderRadius: 'var(--radius-sm)',
    fontSize: 'var(--text-xs)',
    cursor: 'pointer',
    fontWeight: 600,
    marginTop: 'var(--space-2)',
    textAlign: 'center',
    transition: 'all 0.2s',
  };

  const mainAreaStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1,
    height: '100%',
    overflow: 'hidden',
  };

  const headerStyle: React.CSSProperties = {
    height: 'var(--control-height)',
    backgroundColor: 'var(--color-surface)',
    borderBottom: '1px solid var(--color-border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 var(--space-6)',
    flexShrink: 0,
  };

  const hamburgerStyle: React.CSSProperties = {
    display: 'none',
    background: 'none',
    border: 'none',
    color: 'var(--color-text)',
    fontSize: 'var(--text-xl)',
    cursor: 'pointer',
    padding: 'var(--space-1)',
    marginRight: 'var(--space-3)',
    lineHeight: 1,
  };

  const pageTitleStyle: React.CSSProperties = {
    fontSize: 'var(--text-lg)',
    fontWeight: 700,
    color: 'var(--color-text)',
  };

  const contentContainerStyle: React.CSSProperties = {
    flexGrow: 1,
    overflowY: 'auto',
    padding: 'var(--space-6)',
    maxWidth: 'var(--content-max-width)',
    width: '100%',
    margin: '0 auto',
  };

  // Determine if mobile via CSS class strategy
  const isMobileQuery = '@media (max-width: 768px)';

  const SidebarContent = (
    <>
      <div style={logoAreaStyle}>
        <span style={{ fontSize: 'var(--text-lg)', fontWeight: 800, color: 'var(--color-text)' }}>TransitOps</span>
        <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Operations Board</span>
      </div>

      <nav style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <ul style={navListStyle}>
          {visibleNavItems.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => handleNavClick(item.id)}
                style={navItemStyle(currentPage === item.id)}
                onMouseEnter={e => {
                  if (currentPage !== item.id) {
                    e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)';
                    e.currentTarget.style.color = 'var(--color-text)';
                  }
                }}
                onMouseLeave={e => {
                  if (currentPage !== item.id) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = 'var(--color-text-muted)';
                  }
                }}
              >
                <span style={{ fontSize: 'var(--text-base)' }} aria-hidden="true">{item.icon}</span>
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div style={footerAreaStyle}>
        <span style={userEmailStyle} title={user.email}>{user.email}</span>
        <span style={userRoleBadgeStyle}>{roleLabels[userRole] || user.role}</span>
        <button
          type="button"
          onClick={onLogout}
          style={logoutButtonStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)';
            e.currentTarget.style.color = 'var(--color-text)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = 'var(--color-text-muted)';
          }}
        >
          LOG OUT
        </button>
      </div>
    </>
  );

  return (
    <>
      <style>{`
        .appshell-sidebar-desktop { display: flex; }
        .appshell-sidebar-mobile { display: none; }
        .appshell-hamburger { display: none !important; }
        .appshell-overlay { display: none; }

        ${isMobileQuery} {
          .appshell-sidebar-desktop { display: none !important; }
          .appshell-sidebar-mobile { display: flex !important; }
          .appshell-hamburger { display: block !important; }
          .appshell-overlay { display: block !important; }
        }
      `}</style>

      <div style={layoutStyle}>
        {/* Desktop Sidebar */}
        <aside className="appshell-sidebar-desktop" style={sidebarStyle}>
          {SidebarContent}
        </aside>

        {/* Mobile Overlay */}
        <div
          className="appshell-overlay"
          style={overlayStyle}
          onClick={() => setMobileOpen(false)}
        />

        {/* Mobile Sidebar */}
        <aside className="appshell-sidebar-mobile" style={mobileSidebarStyle}>
          {SidebarContent}
        </aside>

        {/* Main Content Area */}
        <div style={mainAreaStyle}>
          <header style={headerStyle}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <button
                className="appshell-hamburger"
                type="button"
                style={hamburgerStyle}
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label="Toggle navigation"
              >
                ☰
              </button>
              <h1 id="page-title" style={pageTitleStyle}>
                {navigationItems.find((item) => item.id === currentPage)?.label || 'Console'}
              </h1>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                Server Connected
              </span>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-success)' }} />
            </div>
          </header>

          <main style={contentContainerStyle}>
            {children}
          </main>
        </div>
      </div>
    </>
  );
};
