import { useControlAuth } from '../../contexts/AuthContext';
import { ShieldCheck, LayoutDashboard, UserCheck, Users, Building2, LogOut, Radio, CreditCard, Activity, Sparkles } from 'lucide-react';

export default function ControlLayout({ activeTab, setActiveTab, children }) {
  const { logout } = useControlAuth();

  const navItems = [
    { id: 'overview', label: 'System Overview', icon: LayoutDashboard, category: 'Main' },
    { id: 'packages', label: 'Subscriptions & Packages', icon: CreditCard, category: 'Main' },
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
          <div className="brand">
            <div className="brand-icon">
              <ShieldCheck size={24} />
            </div>
            <div>
              <div className="brand-text">Control Panel</div>
              <div className="brand-sub">Real-time Master</div>
            </div>
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

