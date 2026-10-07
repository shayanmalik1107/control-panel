import { useState, useEffect } from 'react';
import { ref, onValue, update } from 'firebase/database';
import { database } from '../../firebase';
import {
  Search, UserCheck, Building2, Users, Phone, Mail,
  CheckCircle2, XCircle, KeyRound, ShieldAlert, ChevronDown, ChevronUp, Activity, Layers
} from 'lucide-react';

export default function AdminsTab() {
  const [admins, setAdmins] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [togglingId, setTogglingId] = useState(null);

  useEffect(() => {
    const usersRef = ref(database, 'users');
    const compsRef = ref(database, 'companies');

    // Real-time listener for companies
    const unsubComps = onValue(compsRef, (snap) => {
      const compList = [];
      if (snap.exists()) {
        snap.forEach((c) => {
          const val = c.val();
          if (val && val.info) {
            const empObj = val.employees || {};
            compList.push({
              id: c.key,
              ...val.info,
              employeeCount: Object.keys(empObj).length,
            });
          }
        });
      }
      setCompanies(compList);
    });

    // Real-time listener for users (admins + employees)
    const unsubUsers = onValue(usersRef, (snap) => {
      const adminList = [];
      const empList = [];

      if (snap.exists()) {
        snap.forEach((child) => {
          const u = child.val();
          if (u) {
            if (u.role === 'admin') {
              adminList.push({ uid: child.key, ...u });
            } else if (u.role === 'employee') {
              empList.push({ uid: child.key, ...u });
            }
          }
        });
      }

      setAdmins(adminList);
      setEmployees(empList);
      setLoading(false);
    });

    return () => {
      unsubComps();
      unsubUsers();
    };
  }, []);

  // Toggle Admin status
  const handleToggleAdmin = async (uid, currentStatus) => {
    setTogglingId(uid);
    const newStatus = currentStatus === 'disabled' ? 'active' : 'disabled';
    try {
      await update(ref(database, `users/${uid}`), {
        status: newStatus,
        updatedAt: Date.now(),
      });
    } catch (err) {
      console.error('Error toggling admin status:', err);
      alert('Failed to update admin status');
    } finally {
      setTogglingId(null);
    }
  };

  // Toggle Company status
  const handleToggleCompany = async (companyId, currentStatus) => {
    setTogglingId(companyId);
    const newStatus = (currentStatus === 'closed' || currentStatus === 'disabled') ? 'active' : 'closed';
    try {
      await update(ref(database, `companies/${companyId}/info`), {
        status: newStatus,
        updatedAt: Date.now(),
      });
    } catch (err) {
      console.error('Error toggling company status:', err);
      alert('Failed to update company status');
    } finally {
      setTogglingId(null);
    }
  };

  // Toggle Employee status
  const handleToggleEmployee = async (uid, currentStatus, companyId) => {
    setTogglingId(uid);
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
      alert('Failed to update employee status');
    } finally {
      setTogglingId(null);
    }
  };

  // Approve Company status
  const handleApproveCompany = async (companyId) => {
    setTogglingId(companyId);
    try {
      await update(ref(database, `companies/${companyId}/info`), {
        status: 'active',
        approvedAt: Date.now(),
        updatedAt: Date.now(),
      });
    } catch (err) {
      console.error('Error approving company:', err);
      alert('Failed to approve company workspace');
    } finally {
      setTogglingId(null);
    }
  };

  const filteredAdmins = admins.filter((a) =>
    a.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.phone?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pendingCompanies = companies.filter(c => c.status === 'pending');

  if (loading) {
    return (
      <div style={{ padding: 60, textAlign: 'center', color: '#94a3b8' }}>
        <div className="loading-spinner lg" style={{ margin: '0 auto 20px auto' }} />
        <div style={{ fontSize: 16, fontWeight: 700, color: '#ffffff' }}>Loading Admin Directory...</div>
        <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>Mapping owner accounts to company workspaces & staff associations</div>
      </div>
    );
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="toolbar">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search owner admins by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="badge badge-active">{admins.filter(a => a.status !== 'disabled').length} Active Admins</span>
          <span className="badge badge-disabled">{admins.filter(a => a.status === 'disabled').length} Disabled Admins</span>
        </div>
      </div>

      {/* Grouped Owner -> Companies -> Employees List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
        {filteredAdmins.length > 0 ? (
          filteredAdmins.map((admin, idx) => {
            const isAdminDisabled = admin.status === 'disabled';
            const ownerComps = companies.filter(c => c.ownerUid === admin.uid);
            const ownerCompIds = ownerComps.map(c => c.id);
            
            // Employees connected to any of this owner's companies
            const ownerEmps = employees.filter(e => 
              ownerCompIds.includes(e.companyId) || e.adminUid === admin.uid
            );

            return (
              <div
                key={admin.uid}
                style={{
                  background: 'linear-gradient(160deg, rgba(19, 25, 39, 0.95) 0%, rgba(14, 19, 31, 0.9) 100%)',
                  border: isAdminDisabled ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-xl)',
                  padding: 28,
                  boxShadow: isAdminDisabled ? '0 8px 24px rgba(239, 68, 68, 0.1)' : 'var(--shadow-md)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* OWNER HEADER */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingBottom: 22,
                  borderBottom: '1px solid var(--border-color)',
                  marginBottom: 24,
                  flexWrap: 'wrap',
                  gap: 16,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{
                      width: 52,
                      height: 52,
                      borderRadius: '50%',
                      background: isAdminDisabled ? 'rgba(239, 68, 68, 0.2)' : 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: 20,
                      boxShadow: isAdminDisabled ? 'none' : '0 4px 18px rgba(99, 102, 241, 0.45)',
                      border: '2px solid rgba(255, 255, 255, 0.15)',
                    }}>
                      {admin.name ? admin.name[0].toUpperCase() : 'O'}
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 19, fontWeight: 800, color: '#ffffff', letterSpacing: '-0.4px' }}>
                          {admin.name || 'Owner Admin'}
                        </span>
                        <span style={{
                          fontSize: 10.5,
                          fontWeight: 800,
                          padding: '3px 10px',
                          borderRadius: 'var(--radius-full)',
                          background: 'rgba(99, 102, 241, 0.2)',
                          color: '#818cf8',
                          border: '1px solid rgba(99, 102, 241, 0.35)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                        }}>
                          Owner #{idx + 1}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 6, fontSize: 13, color: '#94a3b8' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <Mail size={14} color="#818cf8" /> {admin.email}
                        </span>
                        {admin.phone && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <Phone size={14} color="#818cf8" /> {admin.phone}
                          </span>
                        )}
                        <span style={{ fontSize: 12, color: '#64748b' }}>Joined: {admin.createdAt ? new Date(admin.createdAt).toLocaleDateString() : 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Real-time Owner Status Toggle Switch */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: 'rgba(10, 13, 22, 0.6)', padding: '10px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Admin System Access
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: isAdminDisabled ? '#f87171' : '#34d399', marginTop: 1 }}>
                        {isAdminDisabled ? 'Access Disabled (Logged Out)' : 'Active System Access'}
                      </div>
                    </div>

                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={!isAdminDisabled}
                        disabled={togglingId === admin.uid}
                        onChange={() => handleToggleAdmin(admin.uid, admin.status)}
                      />
                      <span className="toggle-slider" />
                    </label>
                  </div>
                </div>

                {/* HIS COMPANIES SECTION */}
                <div style={{ marginBottom: 28 }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 12.5,
                    fontWeight: 800,
                    color: '#818cf8',
                    marginBottom: 14,
                    textTransform: 'uppercase',
                    letterSpacing: '0.8px',
                  }}>
                    <Building2 size={16} /> HIS COMPANIES ({ownerComps.length})
                  </div>

                  {ownerComps.length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                      {ownerComps.map((comp) => {
                        const isCompClosed = comp.status === 'closed' || comp.status === 'disabled';

                        return (
                          <div
                            key={comp.id}
                            style={{
                              background: '#090d16',
                              border: isCompClosed ? '1px solid rgba(239, 68, 68, 0.35)' : '1px solid rgba(255, 255, 255, 0.09)',
                              borderRadius: 'var(--radius-md)',
                              padding: 18,
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'space-between',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                              <div>
                                <div style={{ fontWeight: 800, color: '#ffffff', fontSize: 15.5 }}>
                                  {comp.name}
                                </div>
                                <div style={{ fontSize: 12, color: '#fbbf24', fontFamily: 'var(--font-mono)', fontWeight: 700, marginTop: 4 }}>
                                  <KeyRound size={12} style={{ display: 'inline', marginRight: 4 }} />
                                  Code: {comp.joinCode || 'N/A'}
                                </div>
                              </div>

                              <span className={isCompClosed ? 'badge badge-closed' : 'badge badge-active'} style={{ fontSize: 10.5 }}>
                                {isCompClosed ? 'Closed' : 'Active'}
                              </span>
                            </div>

                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              paddingTop: 12,
                              borderTop: '1px dashed rgba(255, 255, 255, 0.1)',
                              fontSize: 12.5,
                              color: '#94a3b8',
                            }}>
                              <span style={{ fontWeight: 600 }}><Users size={13} style={{ display: 'inline', marginRight: 4, color: '#818cf8' }} /> {comp.employeeCount} staff member(s)</span>

                              {/* Toggle Company Status Switch */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontSize: 11.5, color: isCompClosed ? '#f87171' : '#34d399', fontWeight: 700 }}>
                                  {isCompClosed ? 'Closed' : 'Active'}
                                </span>
                                <label className="toggle-switch" style={{ transform: 'scale(0.85)' }}>
                                  <input
                                    type="checkbox"
                                    checked={!isCompClosed}
                                    disabled={togglingId === comp.id}
                                    onChange={() => handleToggleCompany(comp.id, comp.status)}
                                  />
                                  <span className="toggle-slider" />
                                </label>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={{ background: '#090d16', padding: '16px 20px', borderRadius: 'var(--radius-md)', color: '#64748b', fontSize: 13, border: '1px solid var(--border-color)' }}>
                      No companies created by this owner yet.
                    </div>
                  )}
                </div>

                {/* HIS EMPLOYEES SECTION */}
                <div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 12.5,
                    fontWeight: 800,
                    color: '#fbbf24',
                    marginBottom: 14,
                    textTransform: 'uppercase',
                    letterSpacing: '0.8px',
                  }}>
                    <Users size={16} /> HIS EMPLOYEES ({ownerEmps.length})
                  </div>

                  {ownerEmps.length > 0 ? (
                    <div className="table-card" style={{ background: '#090d16' }}>
                      <table className="control-table">
                        <thead>
                          <tr>
                            <th>Employee Name & Email</th>
                            <th>Connected Workspace</th>
                            <th>Status</th>
                            <th>Real-time Access Toggle</th>
                          </tr>
                        </thead>
                        <tbody>
                          {ownerEmps.map((emp) => {
                            const isEmpDisabled = emp.status === 'disabled';
                            const empComp = companies.find(c => c.id === emp.companyId);

                            return (
                              <tr key={emp.uid}>
                                <td style={{ padding: '12px 18px' }}>
                                  <div style={{ fontWeight: 700, color: '#ffffff', fontSize: 13.5 }}>{emp.name || 'Employee User'}</div>
                                  <div style={{ fontSize: 12, color: '#94a3b8' }}>{emp.email}</div>
                                </td>
                                <td style={{ padding: '12px 18px', color: '#fbbf24', fontSize: 12.5, fontWeight: 700 }}>
                                  {empComp?.name || 'Assigned Company'}
                                </td>
                                <td style={{ padding: '12px 18px' }}>
                                  <span className={isEmpDisabled ? 'badge badge-disabled' : 'badge badge-active'} style={{ fontSize: 11 }}>
                                    {isEmpDisabled ? 'Disabled' : 'Active'}
                                  </span>
                                </td>
                                <td style={{ padding: '12px 18px' }}>
                                  <label className="toggle-switch" style={{ transform: 'scale(0.85)' }}>
                                    <input
                                      type="checkbox"
                                      checked={!isEmpDisabled}
                                      disabled={togglingId === emp.uid}
                                      onChange={() => handleToggleEmployee(emp.uid, emp.status, emp.companyId)}
                                    />
                                    <span className="toggle-slider" />
                                  </label>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div style={{ background: '#090d16', padding: '16px 20px', borderRadius: 'var(--radius-md)', color: '#64748b', fontSize: 13, border: '1px solid var(--border-color)' }}>
                      No employees connected under this owner yet.
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div style={{ padding: 60, textAlign: 'center', color: '#64748b' }}>
            <Layers size={40} style={{ margin: '0 auto 12px auto', opacity: 0.5 }} />
            <div style={{ fontSize: 15, fontWeight: 700, color: '#94a3b8' }}>No admin accounts found matching your search</div>
          </div>
        )}
      </div>
    </div>
  );
}

