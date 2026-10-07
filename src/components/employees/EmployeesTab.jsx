import { useState, useEffect } from 'react';
import { ref, onValue, update } from 'firebase/database';
import { database } from '../../firebase';
import { Search, Users, Mail, Building2, CheckCircle2, XCircle, KeyRound, Layers } from 'lucide-react';

export default function EmployeesTab() {
  const [employees, setEmployees] = useState([]);
  const [companies, setCompanies] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [togglingUid, setTogglingUid] = useState(null);

  useEffect(() => {
    const usersRef = ref(database, 'users');
    const compsRef = ref(database, 'companies');

    // Fetch companies map
    const unsubComps = onValue(compsRef, (snap) => {
      const compMap = {};
      if (snap.exists()) {
        snap.forEach((c) => {
          const val = c.val();
          if (val && val.info) {
            compMap[c.key] = val.info;
          }
        });
      }
      setCompanies(compMap);
    });

    // Fetch employee users
    const unsubUsers = onValue(usersRef, (snap) => {
      const list = [];
      if (snap.exists()) {
        snap.forEach((child) => {
          const u = child.val();
          if (u && u.role === 'employee') {
            list.push({ uid: child.key, ...u });
          }
        });
      }
      setEmployees(list);
      setLoading(false);
    });

    return () => {
      unsubComps();
      unsubUsers();
    };
  }, []);

  const handleToggleEmployeeStatus = async (uid, currentStatus, companyId) => {
    setTogglingUid(uid);
    const newStatus = currentStatus === 'disabled' ? 'active' : 'disabled';
    try {
      const updates = {};
      updates[`users/${uid}/status`] = newStatus;
      updates[`users/${uid}/updatedAt`] = Date.now();

      if (companyId) {
        updates[`companies/${companyId}/employees/${uid}/status`] = newStatus;
      }

      await update(ref(database), updates);
    } catch (err) {
      console.error('Error toggling employee status:', err);
      alert('Failed to update status');
    } finally {
      setTogglingUid(null);
    }
  };

  const filteredEmployees = employees.filter((e) =>
    e.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div style={{ padding: 60, textAlign: 'center', color: '#94a3b8' }}>
        <div className="loading-spinner lg" style={{ margin: '0 auto 20px auto' }} />
        <div style={{ fontSize: 16, fontWeight: 700, color: '#ffffff' }}>Loading Employee Registry...</div>
        <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>Retrieving employee accounts and company access permissions</div>
      </div>
    );
  }

  return (
    <div>
      {/* Toolbar Header */}
      <div className="toolbar">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search employees by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="badge badge-active">{employees.filter(e => e.status !== 'disabled').length} Active Access</span>
          <span className="badge badge-disabled">{employees.filter(e => e.status === 'disabled').length} Disabled Access</span>
        </div>
      </div>

      {/* Table Card */}
      <div className="table-card">
        <div className="table-container">
          <table className="control-table">
            <thead>
              <tr>
                <th>Employee Details</th>
                <th>Connected Workspace</th>
                <th>Join Code Used</th>
                <th>Registration Date</th>
                <th>Real-time Access Toggle</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.length > 0 ? (
                filteredEmployees.map((emp) => {
                  const isDisabled = emp.status === 'disabled';
                  const isProcessing = togglingUid === emp.uid;
                  const compInfo = companies[emp.companyId];

                  return (
                    <tr key={emp.uid}>
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                          <div style={{
                            width: 42,
                            height: 42,
                            borderRadius: '50%',
                            background: isDisabled ? 'rgba(239, 68, 68, 0.15)' : 'linear-gradient(135deg, rgba(245, 158, 11, 0.25) 0%, rgba(217, 119, 6, 0.1) 100%)',
                            color: isDisabled ? '#f87171' : '#fbbf24',
                            border: isDisabled ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontSize: 16,
                          }}>
                            {emp.name ? emp.name[0].toUpperCase() : 'E'}
                          </div>
                          <div>
                            <div style={{ fontWeight: 800, color: '#ffffff', fontSize: 14 }}>
                              {emp.name || 'Employee User'}
                            </div>
                            <div style={{ fontSize: 12, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
                              <Mail size={12} color="#fbbf24" /> {emp.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: '16px 20px' }}>
                        {compInfo ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#fbbf24', fontWeight: 700, fontSize: 13.5 }}>
                            <Building2 size={16} /> {compInfo.name}
                          </div>
                        ) : (
                          <span style={{ color: '#64748b', fontSize: 12.5 }}>No Company Assigned</span>
                        )}
                      </td>

                      <td style={{ padding: '16px 20px' }}>
                        {compInfo?.joinCode ? (
                          <span style={{ fontFamily: 'var(--font-mono)', color: '#38bdf8', fontWeight: 700, background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.25)', padding: '3px 10px', borderRadius: 6, fontSize: 12 }}>
                            <KeyRound size={12} style={{ display: 'inline', marginRight: 4 }} />
                            {compInfo.joinCode}
                          </span>
                        ) : (
                          <span style={{ color: '#64748b', fontSize: 12.5 }}>—</span>
                        )}
                      </td>

                      <td style={{ color: '#94a3b8', fontSize: 12.5, padding: '16px 20px' }}>
                        {emp.createdAt ? new Date(emp.createdAt).toLocaleDateString() : 'N/A'}
                      </td>

                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                          <label className="toggle-switch">
                            <input
                              type="checkbox"
                              checked={!isDisabled}
                              disabled={isProcessing}
                              onChange={() => handleToggleEmployeeStatus(emp.uid, emp.status, emp.companyId)}
                            />
                            <span className="toggle-slider" />
                          </label>

                          <span className={isDisabled ? 'badge badge-disabled' : 'badge badge-active'}>
                            {isDisabled ? (
                              <><XCircle size={13} /> Access Blocked</>
                            ) : (
                              <><CheckCircle2 size={13} /> Active Access</>
                            )}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="5" style={{ padding: 60, textAlign: 'center', color: '#64748b' }}>
                    <Layers size={40} style={{ margin: '0 auto 12px auto', opacity: 0.5 }} />
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#94a3b8' }}>No employee accounts found matching search query</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

