import { useState, useEffect } from 'react';
import { ref, onValue, update } from 'firebase/database';
import { database } from '../../firebase';
import { Search, Building2, User, KeyRound, Users, CheckCircle2, XCircle, AlertTriangle, Layers } from 'lucide-react';

export default function CompaniesTab() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [togglingId, setTogglingId] = useState(null);

  useEffect(() => {
    const compsRef = ref(database, 'companies');

    const unsubComps = onValue(compsRef, (snap) => {
      const list = [];
      if (snap.exists()) {
        snap.forEach((child) => {
          const c = child.val();
          const info = c ? c.info : null;
          const employees = c ? c.employees : null;
          const empCount = employees ? Object.keys(employees).length : 0;

          if (info) {
            list.push({
              id: child.key,
              name: info.name || 'Unnamed Company',
              owner: info.owner || 'Admin',
              ownerEmail: info.email || '',
              ownerUid: info.ownerUid || '',
              joinCode: info.joinCode || '',
              phone: info.phone || '',
              currency: info.currency || 'Rs',
              status: info.status || 'active',
              createdAt: info.createdAt || Date.now(),
              employeeCount: empCount,
            });
          }
        });
      }
      setCompanies(list);
      setLoading(false);
    });

    return () => unsubComps();
  }, []);

  const handleToggleCompanyStatus = async (companyId, currentStatus) => {
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

  const filteredCompanies = companies.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.owner.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.ownerEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.joinCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div style={{ padding: 60, textAlign: 'center', color: '#94a3b8' }}>
        <div className="loading-spinner lg" style={{ margin: '0 auto 20px auto' }} />
        <div style={{ fontSize: 16, fontWeight: 700, color: '#ffffff' }}>Loading Company Workspaces...</div>
        <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>Syncing registered companies, join codes, and active status</div>
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
            placeholder="Search companies by name, owner, or join code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="badge badge-active">
            {companies.filter(c => c.status !== 'closed' && c.status !== 'disabled').length} Active Workspaces
          </span>
          <span className="badge badge-closed">
            {companies.filter(c => c.status === 'closed' || c.status === 'disabled').length} Closed Workspaces
          </span>
        </div>
      </div>

      {/* Table Card */}
      <div className="table-card">
        <div className="table-container">
          <table className="control-table">
            <thead>
              <tr>
                <th>Company Name & Join Code</th>
                <th>Owner Admin</th>
                <th>Staff Count</th>
                <th>Currency</th>
                <th>Created Date</th>
                <th>Real-time Company Access Toggle</th>
              </tr>
            </thead>
            <tbody>
              {filteredCompanies.length > 0 ? (
                filteredCompanies.map((comp) => {
                  const isClosed = comp.status === 'closed' || comp.status === 'disabled';
                  const isProcessing = togglingId === comp.id;

                  return (
                    <tr key={comp.id}>
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                          <div style={{
                            width: 44,
                            height: 44,
                            borderRadius: 'var(--radius-md)',
                            background: isClosed ? 'rgba(239, 68, 68, 0.15)' : 'linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(5, 150, 105, 0.1) 100%)',
                            color: isClosed ? '#f87171' : '#34d399',
                            border: isClosed ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}>
                            <Building2 size={24} />
                          </div>
                          <div>
                            <div style={{ fontWeight: 800, color: '#ffffff', fontSize: 15 }}>
                              {comp.name}
                            </div>
                            <div style={{ fontSize: 12, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                              <span style={{ fontFamily: 'var(--font-mono)', color: '#fbbf24', background: 'rgba(251, 191, 36, 0.1)', border: '1px solid rgba(251, 191, 36, 0.25)', padding: '2px 8px', borderRadius: 6, fontWeight: 700 }}>
                                <KeyRound size={12} style={{ display: 'inline', marginRight: 4 }} />
                                Code: {comp.joinCode}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: '16px 20px' }}>
                        <div>
                          <div style={{ fontWeight: 700, color: '#e2e8f0', fontSize: 14, display: 'flex', alignItems: 'center', gap: 5 }}>
                            <User size={14} color="#818cf8" /> {comp.owner}
                          </div>
                          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                            {comp.ownerEmail}
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#cbd5e1', fontWeight: 700, fontSize: 13.5 }}>
                          <Users size={15} color="#818cf8" /> {comp.employeeCount} member(s)
                        </div>
                      </td>

                      <td style={{ color: '#94a3b8', fontSize: 13, fontWeight: 600, padding: '16px 20px' }}>
                        {comp.currency}
                      </td>

                      <td style={{ color: '#94a3b8', fontSize: 12.5, padding: '16px 20px' }}>
                        {comp.createdAt ? new Date(comp.createdAt).toLocaleDateString() : 'N/A'}
                      </td>

                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                          <label className="toggle-switch">
                            <input
                              type="checkbox"
                              checked={!isClosed}
                              disabled={isProcessing}
                              onChange={() => handleToggleCompanyStatus(comp.id, comp.status)}
                            />
                            <span className="toggle-slider" />
                          </label>

                          <span className={isClosed ? 'badge badge-closed' : 'badge badge-active'}>
                            {isClosed ? (
                              <><XCircle size={13} /> Access Closed</>
                            ) : (
                              <><CheckCircle2 size={13} /> Active Workspace</>
                            )}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" style={{ padding: 60, textAlign: 'center', color: '#64748b' }}>
                    <Layers size={40} style={{ margin: '0 auto 12px auto', opacity: 0.5 }} />
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#94a3b8' }}>No companies found matching search query</div>
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

