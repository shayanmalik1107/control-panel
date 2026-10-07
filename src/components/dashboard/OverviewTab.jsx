import { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { database } from '../../firebase';
import { UserCheck, Users, Building2, ShieldCheck, ArrowRight, Activity, Zap, CheckCircle2 } from 'lucide-react';

export default function OverviewTab({ setActiveTab }) {
  const [stats, setStats] = useState({
    totalAdmins: 0,
    activeAdmins: 0,
    disabledAdmins: 0,
    totalEmployees: 0,
    activeEmployees: 0,
    disabledEmployees: 0,
    totalCompanies: 0,
    activeCompanies: 0,
    closedCompanies: 0,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const usersRef = ref(database, 'users');
    const compsRef = ref(database, 'companies');

    const unsubUsers = onValue(usersRef, (snap) => {
      let tAdmin = 0, aAdmin = 0, dAdmin = 0;
      let tEmp = 0, aEmp = 0, dEmp = 0;

      if (snap.exists()) {
        snap.forEach((child) => {
          const u = child.val();
          if (u.role === 'admin') {
            tAdmin++;
            if (u.status === 'disabled') dAdmin++;
            else aAdmin++;
          } else if (u.role === 'employee') {
            tEmp++;
            if (u.status === 'disabled') dEmp++;
            else aEmp++;
          }
        });
      }

      setStats(prev => ({
        ...prev,
        totalAdmins: tAdmin, activeAdmins: aAdmin, disabledAdmins: dAdmin,
        totalEmployees: tEmp, activeEmployees: aEmp, disabledEmployees: dEmp,
      }));
    });

    const unsubComps = onValue(compsRef, (snap) => {
      let tComp = 0, aComp = 0, cComp = 0;

      if (snap.exists()) {
        snap.forEach((child) => {
          const val = child.val();
          const info = val ? val.info : null;
          tComp++;
          if (info && (info.status === 'closed' || info.status === 'disabled')) {
            cComp++;
          } else {
            aComp++;
          }
        });
      }

      setStats(prev => ({
        ...prev,
        totalCompanies: tComp, activeCompanies: aComp, closedCompanies: cComp,
      }));
      setLoading(false);
    });

    return () => {
      unsubUsers();
      unsubComps();
    };
  }, []);

  if (loading) {
    return (
      <div style={{ padding: 60, textAlign: 'center', color: '#94a3b8' }}>
        <div className="loading-spinner lg" style={{ margin: '0 auto 20px auto' }} />
        <div style={{ fontSize: 16, fontWeight: 700, color: '#ffffff' }}>Loading System Architecture...</div>
        <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>Establishing connection to Firebase Realtime Database</div>
      </div>
    );
  }

  return (
    <div>
      {/* Executive Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(15, 23, 42, 0.9) 60%, rgba(16, 185, 129, 0.1) 100%)',
        border: '1px solid rgba(99, 102, 241, 0.35)',
        borderRadius: 'var(--radius-xl)',
        padding: 32,
        marginBottom: 32,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 20,
        boxShadow: '0 16px 40px rgba(0, 0, 0, 0.4), 0 0 30px rgba(99, 102, 241, 0.15)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'relative', zIndex: 2, maxWidth: 650 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            color: '#818cf8',
            fontSize: 12,
            fontWeight: 800,
            marginBottom: 10,
            textTransform: 'uppercase',
            letterSpacing: '1px',
            background: 'rgba(99, 102, 241, 0.15)',
            padding: '4px 12px',
            borderRadius: 'var(--radius-full)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
          }}>
            <ShieldCheck size={16} /> Real-time Master Command Dashboard
          </div>
          <h2 style={{ fontSize: 28, fontWeight: 800, color: '#ffffff', margin: '0 0 8px 0', letterSpacing: '-0.8px' }}>
            System Infrastructure & Access Control
          </h2>
          <p style={{ fontSize: 14, color: '#94a3b8', margin: 0, lineHeight: 1.6 }}>
            Toggle state changes for Owner Admins, Employees, and Company Workspaces synchronously across all active user devices in real-time.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 14, zIndex: 2 }}>
          <div style={{
            background: 'rgba(15, 23, 42, 0.7)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            borderRadius: 'var(--radius-md)',
            padding: '16px 20px',
            textAlign: 'center',
            minWidth: 120,
          }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>STATUS</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#34d399', marginTop: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <CheckCircle2 size={16} /> ONLINE
            </div>
          </div>
          <div style={{
            background: 'rgba(15, 23, 42, 0.7)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            borderRadius: 'var(--radius-md)',
            padding: '16px 20px',
            textAlign: 'center',
            minWidth: 120,
          }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>DATABASE</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#818cf8', marginTop: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <Zap size={16} /> LIVE
            </div>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="stats-grid">
        {/* Admin Accounts */}
        <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('admins')}>
          <div className="stat-header">
            <span className="stat-label">Admin Owners</span>
            <div className="stat-icon indigo"><UserCheck size={22} /></div>
          </div>
          <div className="stat-value">{stats.totalAdmins}</div>
          <div className="stat-footer">
            <span style={{ color: '#34d399', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              ● {stats.activeAdmins} Active Access
            </span>
            <span style={{ color: '#64748b' }}>|</span>
            <span style={{ color: '#f87171', fontWeight: 700 }}>{stats.disabledAdmins} Disabled</span>
          </div>
        </div>

        {/* Employee Accounts */}
        <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('employees')}>
          <div className="stat-header">
            <span className="stat-label">Employee Users</span>
            <div className="stat-icon amber"><Users size={22} /></div>
          </div>
          <div className="stat-value">{stats.totalEmployees}</div>
          <div className="stat-footer">
            <span style={{ color: '#34d399', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              ● {stats.activeEmployees} Active Access
            </span>
            <span style={{ color: '#64748b' }}>|</span>
            <span style={{ color: '#f87171', fontWeight: 700 }}>{stats.disabledEmployees} Blocked</span>
          </div>
        </div>

        {/* Admin Companies */}
        <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('companies')}>
          <div className="stat-header">
            <span className="stat-label">Company Workspaces</span>
            <div className="stat-icon green"><Building2 size={22} /></div>
          </div>
          <div className="stat-value">{stats.totalCompanies}</div>
          <div className="stat-footer">
            <span style={{ color: '#34d399', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              ● {stats.activeCompanies} Active
            </span>
            <span style={{ color: '#64748b' }}>|</span>
            <span style={{ color: '#f87171', fontWeight: 700 }}>{stats.closedCompanies} Closed</span>
          </div>
        </div>
      </div>

      {/* Quick Action Navigation Modules */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h3 style={{ fontSize: 18, fontWeight: 800, color: '#ffffff', letterSpacing: '-0.4px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Activity size={20} color="#818cf8" /> Direct Management Modules
        </h3>
        <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>Click any module to configure</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 22 }}>
        <div className="stat-card" onClick={() => setActiveTab('admins')} style={{ cursor: 'pointer' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818cf8' }}>
                <UserCheck size={18} />
              </div>
              <h4 style={{ fontSize: 16, fontWeight: 800, color: '#ffffff', margin: 0 }}>Manage Admin Accounts</h4>
            </div>
            <ArrowRight size={18} color="#818cf8" />
          </div>
          <p style={{ fontSize: 13, color: '#94a3b8', margin: 0, lineHeight: 1.6 }}>
            Toggle Admin access active or disabled. When disabled, their real-time session terminates instantly across all devices.
          </p>
        </div>

        <div className="stat-card" onClick={() => setActiveTab('employees')} style={{ cursor: 'pointer' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fbbf24' }}>
                <Users size={18} />
              </div>
              <h4 style={{ fontSize: 16, fontWeight: 800, color: '#ffffff', margin: 0 }}>Manage Employee Accounts</h4>
            </div>
            <ArrowRight size={18} color="#818cf8" />
          </div>
          <p style={{ fontSize: 13, color: '#94a3b8', margin: 0, lineHeight: 1.6 }}>
            Toggle Employee accounts active or disabled. When toggled OFF, real-time POS & ledger access is blocked instantly.
          </p>
        </div>

        <div className="stat-card" onClick={() => setActiveTab('companies')} style={{ cursor: 'pointer' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34d399' }}>
                <Building2 size={18} />
              </div>
              <h4 style={{ fontSize: 16, fontWeight: 800, color: '#ffffff', margin: 0 }}>Manage Company Workspaces</h4>
            </div>
            <ArrowRight size={18} color="#818cf8" />
          </div>
          <p style={{ fontSize: 13, color: '#94a3b8', margin: 0, lineHeight: 1.6 }}>
            Toggle Company status active or closed. If an admin is logged into a closed company, they are redirected to selection screen.
          </p>
        </div>
      </div>
    </div>
  );
}

