import { useControlAuth } from '../../contexts/AuthContext';
import { ShieldCheck, LayoutDashboard, UserCheck, Users, Building2, LogOut, Radio, CreditCard, Activity, Sparkles, Clock, Zap } from 'lucide-react';

export default function ControlLayout({ activeTab, setActiveTab, children }) {
  const { logout } = useControlAuth();

  const navItems = [
    { id: 'overview', label: 'System Overview', icon: LayoutDashboard, category: 'Main' },
    { id: 'packages', label: 'Subscriptions & Packages', icon: CreditCard, category: 'Main' },
    { id: 'trials', label: '3-Day Trial Accounts', icon: Clock, category: 'Main' },
    { id: 'admins', label: 'Admin Accounts', icon: UserCheck, category: 'Management' },
    { id: 'employees', label: 'Employee Accounts', icon: Users, category: 'Management' },
    { id: 'companies', label: 'Admin Companies', icon: Building2, category: 'Management' },
  ];

  const currentTabObj = navItems.find(item => item.id === activeTab);

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div>
          {/* Brand Header */}
          <div className="brand" style={{ padding: '16px 14px', borderBottom: '1px solid var(--border-color)' }}>
            <img src="/lamba.png" alt="LAMBA" className="lamba-logo-desktop" style={{ height: '42px', maxWidth: '190px', objectFit: 'contain' }} />
            <img src="/lambalogo.png" alt="LAMBA" className="lamba-logo-mobile" style={{ height: '36px', maxWidth: '36px', objectFit: 'contain' }} />
          </div>

          {/* Navigation Category: Core Controls */}
          <div className="nav-section-label">Core Modules</div>
          <nav className="nav-menu">
            {navItems.filter(i => i.category === 'Main').map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <div
                  key={item.id}
                  className={`nav-item ${isActive ? 'active' : ''}`}
                  onClick={() => setActiveTab(item.id)}
                >
                  <div className="nav-item-content">
                    <Icon size={18} style={{ color: isActive ? '#818cf8' : 'inherit' }} />
                    <span>{item.label}</span>
                  </div>
                  {item.id === 'packages' && (
                    <span style={{
                      fontSize: 10,
                      fontWeight: 800,
                      background: 'rgba(99, 102, 241, 0.25)',
                      color: '#818cf8',
                      padding: '2px 7px',
                      borderRadius: 99,
                      border: '1px solid rgba(99, 102, 241, 0.4)',
                    }}>PRO</span>
                  )}
                  {item.id === 'trials' && (
                    <span style={{
                      fontSize: 10,
                      fontWeight: 800,
                      background: 'rgba(16, 185, 129, 0.25)',
                      color: '#34d399',
                      padding: '2px 7px',
                      borderRadius: 99,
                      border: '1px solid rgba(16, 185, 129, 0.4)',
                    }}>3-DAY</span>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Navigation Category: Accounts & Workspaces */}
          <div className="nav-section-label">System Directory</div>
          <nav className="nav-menu">
            {navItems.filter(i => i.category === 'Management').map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <div
                  key={item.id}
                  className={`nav-item ${isActive ? 'active' : ''}`}
                  onClick={() => setActiveTab(item.id)}
                >
                  <div className="nav-item-content">
                    <Icon size={18} style={{ color: isActive ? '#818cf8' : 'inherit' }} />
                    <span>{item.label}</span>
                  </div>
                </div>
              );
            })}
          </nav>
        </div>

        {/* Live System Indicator & Exit Button */}
        <div>
          <div style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(15, 23, 42, 0.8) 100%)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            borderRadius: 'var(--radius-md)',
            padding: '14px 16px',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.3)',
          }}>
            <div className="pulse-dot" style={{ flexShrink: 0 }} />
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#ffffff', letterSpacing: '0.3px', display: 'flex', alignItems: 'center', gap: 6 }}>
                Firebase Realtime <Activity size={12} color="#10b981" />
              </div>
              <div style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                panel-adefe
              </div>
            </div>
          </div>

          {/* WhatsApp Support Button */}
          <a
            href="https://wa.me/923104824942?text=Hello%20Super%20Admin%20Support%2C%20I%20have%20a%20query%20regarding%20Control%20Panel."
            target="_blank"
            rel="noopener noreferrer"
            title="Chat on WhatsApp: 03104824942"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              width: '100%',
              padding: '11px 16px',
              marginBottom: 10,
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: 13,
              textDecoration: 'none',
              boxShadow: '0 4px 14px rgba(37, 211, 102, 0.25)',
              transition: 'all 0.2s ease',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              boxSizing: 'border-box'
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.52 3.48A11.93 11.93 0 0012.06 0C5.46 0 .09 5.37.09 11.97c0 2.11.55 4.17 1.6 6L0 24l6.19-1.62a11.94 11.94 0 005.87 1.51h.01c6.6 0 11.97-5.37 11.97-11.97 0-3.2-1.25-6.21-3.52-8.44zM12.06 21.89h-.01a9.92 9.92 0 01-5.06-1.39l-.36-.21-3.76.99 1-3.66-.23-.38a9.93 9.93 0 01-1.52-5.27c0-5.5 4.47-9.97 9.98-9.97 2.66 0 5.16 1.04 7.04 2.92a9.9 9.9 0 012.92 7.05c0 5.5-4.48 9.97-9.98 9.97zm5.47-7.47c-.3-.15-1.78-.88-2.05-.98-.28-.1-.48-.15-.68.15-.2.3-.78.98-.95 1.18-.18.2-.35.23-.65.08-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.18-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.38-.03-.53-.07-.15-.68-1.63-.93-2.23-.24-.58-.49-.5-.68-.51h-.58c-.2 0-.53.08-.8.38-.28.3-1.05 1.03-1.05 2.51s1.08 2.91 1.23 3.11c.15.2 2.12 3.24 5.14 4.54.72.31 1.28.5 1.72.64.72.23 1.38.2 1.9.12.58-.09 1.78-.73 2.03-1.43.25-.7.25-1.31.18-1.43-.08-.13-.28-.2-.58-.35z" />
            </svg>
            <span>WhatsApp (03104824942)</span>
          </a>

          <button
            onClick={logout}
            className="btn btn-secondary"
            style={{
              width: '100%',
              justify: 'center',
              padding: '12px 16px',
              fontSize: 13,
              fontWeight: 700,
              background: 'rgba(239, 68, 68, 0.08)',
              color: '#f87171',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <LogOut size={16} /> Exit Control Panel
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="main-content">
        {/* Header */}
        <header className="header">
          <div className="page-title">
            <Radio size={22} color="#10b981" style={{ filter: 'drop-shadow(0 0 8px rgba(16,185,129,0.5))' }} />
            <span>{currentTabObj ? currentTabObj.label : 'Master System Controls'}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(99, 102, 241, 0.1)',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              fontSize: 12,
              fontWeight: 700,
              color: '#818cf8',
            }}>
              <Sparkles size={14} color="#818cf8" /> Super Admin Active
            </div>

            <span className="badge badge-active" style={{ fontSize: 12, padding: '6px 14px' }}>
              <span className="pulse-dot" style={{ width: 7, height: 7 }} /> REALTIME SYNC
            </span>
          </div>
        </header>

        {/* Content Body */}
        <main className="content-body">
          {children}
        </main>
      </div>
    </div>
  );
}

