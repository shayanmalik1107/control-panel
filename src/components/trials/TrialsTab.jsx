import { useState, useEffect } from 'react';
import { ref, onValue, update, get } from 'firebase/database';
import { database } from '../../firebase';
import {
  Clock, FastForward, CheckCircle2, XCircle, Search, ShieldAlert,
  Building2, Users, Phone, Mail, Calendar, RotateCcw, Sparkles,
  Layers, ArrowUpRight, AlertCircle, Ban, Check
} from 'lucide-react';

export default function TrialsTab() {
  const [users, setUsers] = useState([]);
  const [companies, setCompanies] = useState({});
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState('all'); // 'all' | 'active' | 'expired' | 'disabled'
  const [searchQuery, setSearchQuery] = useState('');
  const [processingUid, setProcessingUid] = useState(null);

  // Convert to paid modal
  const [convertingUser, setConvertingUser] = useState(null);
  const [convertPlan, setConvertPlan] = useState('basic');

  useEffect(() => {
    // Listen for users
    const usersRef = ref(database, 'users');
    const unsubUsers = onValue(usersRef, (snap) => {
      const list = [];
      if (snap.exists()) {
        snap.forEach((child) => {
          list.push({ uid: child.key, ...child.val() });
        });
      }
      setUsers(list);
      setLoading(false);
    });

    // Listen for companies & staff counts
    const compsRef = ref(database, 'companies');
    const unsubComps = onValue(compsRef, (snap) => {
      const map = {};
      if (snap.exists()) {
        snap.forEach((child) => {
          const comp = child.val();
          const info = comp?.info;
          if (info && info.ownerUid) {
            const empObj = comp.employees || {};
            // Count staff excluding owner
            let staffCount = 0;
            Object.entries(empObj).forEach(([empUid, empVal]) => {
              if (empVal.role !== 'admin' && empUid !== info.ownerUid) {
                staffCount++;
              }
            });

            if (!map[info.ownerUid]) {
              map[info.ownerUid] = [];
            }
            map[info.ownerUid].push({
              id: child.key,
              name: info.name || 'Unnamed Company',
              joinCode: info.joinCode || '',
              staffCount,
              status: info.status || 'active',
            });
          }
        });
      }
      setCompanies(map);
    });

    return () => {
      unsubUsers();
      unsubComps();
    };
  }, []);

  // Filter trial users
  const trialUsers = users.filter((u) => {
    const isTrialPkg = u.package?.planId === 'trial';
    const isTrialSub = u.subscription?.isTrial || u.subscription?.planId === 'trial';
    const hasTrialInfo = !!u.trialInfo?.isTrial;
    return isTrialPkg || isTrialSub || hasTrialInfo;
  });

  // Action: Pass 1 Day (Testing)
  const handlePassOneDay = async (uid) => {
    setProcessingUid(uid);
    try {
      const userRef = ref(database, `users/${uid}`);
      const snap = await get(userRef);
      if (!snap.exists()) return;

      const userData = snap.val();
      const sub = userData.subscription || {};
      const currentExtra = sub.extraDaysPassed || 0;
      const newExtra = currentExtra + 1;

      const now = Date.now();
      const oneDayMs = 24 * 60 * 60 * 1000;
      const threeDaysMs = 3 * oneDayMs;
      const startTime = sub.startDate || userData.approvedAt || userData.createdAt || now;
      const expTime = sub.expiryDate || (startTime + threeDaysMs);
      const todayTime = now + (newExtra * oneDayMs);

      const updates = {};
      updates[`users/${uid}/subscription/extraDaysPassed`] = newExtra;

      if (todayTime >= expTime) {
        updates[`users/${uid}/subscription/status`] = 'expired';
      }

      await update(ref(database), updates);
    } catch (err) {
      console.error('Failed to pass 1 day on trial:', err);
      alert('Failed to advance trial day');
    } finally {
      setProcessingUid(null);
    }
  };

  // Action: Reset simulated days passed to 0
  const handleResetDays = async (uid) => {
    setProcessingUid(uid);
    try {
      const userRef = ref(database, `users/${uid}`);
      const snap = await get(userRef);
      if (!snap.exists()) return;

      const userData = snap.val();
      const sub = userData.subscription || {};
      const now = Date.now();
      const startTime = sub.startDate || userData.approvedAt || userData.createdAt || now;
      const expTime = sub.expiryDate || (startTime + (3 * 24 * 60 * 60 * 1000));

      const updates = {};
      updates[`users/${uid}/subscription/extraDaysPassed`] = 0;
      if (now < expTime) {
        updates[`users/${uid}/subscription/status`] = 'active';
      }

      await update(ref(database), updates);
    } catch (err) {
      console.error('Failed to reset days:', err);
      alert('Failed to reset days');
    } finally {
      setProcessingUid(null);
    }
  };

  // Action: Toggle Trial Account status (Disable / Enable)
  const handleToggleTrialStatus = async (uid, currentAccountStatus) => {
    const isCurrentlyDisabled = currentAccountStatus === 'disabled';
    const actionWord = isCurrentlyDisabled ? 'enable' : 'disable';

    if (!window.confirm(`Are you sure you want to ${actionWord} this trial account?`)) return;

    setProcessingUid(uid);
    try {
      const newStatus = isCurrentlyDisabled ? 'active' : 'disabled';
      const updates = {};
      updates[`users/${uid}/status`] = newStatus;
      updates[`users/${uid}/accountStatus`] = newStatus;

      await update(ref(database), updates);
    } catch (err) {
      console.error('Failed to toggle trial status:', err);
      alert('Failed to update status');
    } finally {
      setProcessingUid(null);
    }
  };

  // Action: Convert Trial to Paid Subscription
  const handleConvertTrial = async (uid, targetPlan) => {
    setProcessingUid(uid);
    try {
      const userRef = ref(database, `users/${uid}`);
      const snap = await get(userRef);
      if (!snap.exists()) return;

      const isPro = targetPlan === 'pro';
      const finalLimit = isPro ? 3 : 1;
      const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
      const now = Date.now();

      const updates = {};
      updates[`users/${uid}/accountStatus`] = 'active';
      updates[`users/${uid}/approvalStatus`] = 'approved';
      updates[`users/${uid}/status`] = 'active';
      updates[`users/${uid}/maxCompanies`] = finalLimit;
      updates[`users/${uid}/package`] = {
        planId: isPro ? 'pro' : 'basic',
        name: isPro ? 'Pro Multi-Company Package' : 'Basic Package',
        price: isPro ? 10000 : 5000,
        maxCompanies: finalLimit,
        status: 'active',
        convertedFromTrialAt: now,
      };
      updates[`users/${uid}/subscription`] = {
        startDate: now,
        expiryDate: now + thirtyDaysMs,
        planId: isPro ? 'pro' : 'basic',
        price: isPro ? 10000 : 5000,
        status: 'active',
        extraDaysPassed: 0,
        isTrial: false,
        convertedFromTrialAt: now,
        lastApprovedAt: now,
      };
      updates[`users/${uid}/upgradeRequest`] = null;

      await update(ref(database), updates);
      setConvertingUser(null);
      alert(`Trial account successfully converted to ${isPro ? 'Pro (3 Slots)' : 'Basic (1 Slot)'} 30-day paid subscription! All data has been preserved.`);
    } catch (err) {
      console.error('Failed to convert trial:', err);
      alert('Failed to convert trial account');
    } finally {
      setProcessingUid(null);
    }
  };

  // Calculate statistics
  const now = Date.now();
  const oneDayMs = 24 * 60 * 60 * 1000;

  const enrichedTrials = trialUsers.map((user) => {
    const sub = user.subscription || {};
    const extraDays = sub.extraDaysPassed || 0;
    const todayTime = now + (extraDays * oneDayMs);
    const startTime = sub.startDate || user.approvedAt || user.createdAt || now;
    const expTime = sub.expiryDate || (startTime + (3 * oneDayMs));

    const daysRemaining = Math.max(0, Math.ceil((expTime - todayTime) / oneDayMs));
    const isExpired = sub.status === 'expired' || todayTime >= expTime || daysRemaining <= 0;
    const isDisabled = user.accountStatus === 'disabled' || user.status === 'disabled';

    const userComps = companies[user.uid] || [];
    const totalStaff = userComps.reduce((acc, c) => acc + (c.staffCount || 0), 0);

    return {
      ...user,
      extraDays,
      todayTime,
      startTime,
      expTime,
      daysRemaining,
      isExpired,
      isDisabled,
      userComps,
      totalStaff,
      verifiedEmail: user.trialInfo?.email || user.verifiedTrialEmail || user.email,
      verifiedPhone: user.trialInfo?.phone || user.phone || '',
      verifiedWith: user.trialInfo?.verifiedWith || (user.trialInfo?.email ? 'email' : 'phone'),
    };
  });

  const activeCount = enrichedTrials.filter(t => !t.isExpired && !t.isDisabled).length;
  const expiredCount = enrichedTrials.filter(t => t.isExpired && !t.isDisabled).length;
  const disabledCount = enrichedTrials.filter(t => t.isDisabled).length;

  let filteredList = enrichedTrials;
  if (filterTab === 'active') {
    filteredList = enrichedTrials.filter(t => !t.isExpired && !t.isDisabled);
  } else if (filterTab === 'expired') {
    filteredList = enrichedTrials.filter(t => t.isExpired);
  } else if (filterTab === 'disabled') {
    filteredList = enrichedTrials.filter(t => t.isDisabled);
  }

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filteredList = filteredList.filter(t =>
      t.name?.toLowerCase().includes(q) ||
      t.email?.toLowerCase().includes(q) ||
      t.verifiedPhone?.includes(q)
    );
  }

  if (loading) {
    return (
      <div style={{ padding: 60, textAlign: 'center', color: '#94a3b8' }}>
        <div className="loading-spinner lg" style={{ margin: '0 auto 20px auto' }} />
        <div style={{ fontSize: 16, fontWeight: 700, color: '#ffffff' }}>Loading 3-Day Trial Accounts...</div>
        <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>Syncing mobile OTP registrations and testing controls</div>
      </div>
    );
  }

  return (
    <div>
      {/* Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(15, 23, 42, 0.9) 60%, rgba(14, 165, 233, 0.1) 100%)',
        border: '1px solid rgba(16, 185, 129, 0.35)',
        borderRadius: 'var(--radius-xl)',
        padding: 28,
        marginBottom: 24,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 20,
        boxShadow: 'var(--shadow-md)',
      }}>
        <div>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            color: '#34d399',
            fontSize: 12,
            fontWeight: 800,
            marginBottom: 8,
            textTransform: 'uppercase',
            letterSpacing: '1px',
            background: 'rgba(16, 185, 129, 0.15)',
            padding: '4px 12px',
            borderRadius: 'var(--radius-full)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
          }}>
            <Clock size={15} /> 3-Day Free Trial Management
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: '#ffffff', margin: '0 0 6px 0', letterSpacing: '-0.5px' }}>
            Trial Accounts & Simulated Day Testing Controls
          </h2>
          <p style={{ fontSize: 13.5, color: '#94a3b8', margin: 0 }}>
            Monitor self-activated trial accounts, test 3-day expiry with "Pass 1 Day", disable/enable access, and convert trials to paid packages with full data preservation.
          </p>
        </div>

        {/* Stats Counters */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div style={{
            background: 'rgba(15, 23, 42, 0.8)',
            padding: '12px 18px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            minWidth: 120,
          }}>
            <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>TOTAL TRIALS</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#ffffff', marginTop: 2 }}>{trialUsers.length}</div>
          </div>
          <div style={{
            background: 'rgba(16, 185, 129, 0.15)',
            padding: '12px 18px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            minWidth: 120,
          }}>
            <div style={{ fontSize: 11, color: '#34d399', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>ACTIVE</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#34d399', marginTop: 2 }}>{activeCount}</div>
          </div>
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            padding: '12px 18px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            minWidth: 120,
          }}>
            <div style={{ fontSize: 11, color: '#f87171', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>EXPIRED</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#f87171', marginTop: 2 }}>{expiredCount}</div>
          </div>
        </div>
      </div>

      {/* Toolbar & Filters */}
      <div className="toolbar" style={{ flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 8, background: '#0a0d16', padding: 5, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', flexWrap: 'wrap' }}>
          <button
            onClick={() => setFilterTab('all')}
            style={{
              background: filterTab === 'all' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'transparent',
              color: '#ffffff',
              border: 'none',
              padding: '9px 18px',
              borderRadius: 'var(--radius-sm)',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: filterTab === 'all' ? '0 4px 14px rgba(16, 185, 129, 0.4)' : 'none',
            }}
          >
            All Trials ({trialUsers.length})
          </button>
          <button
            onClick={() => setFilterTab('active')}
            style={{
              background: filterTab === 'active' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'transparent',
              color: filterTab === 'active' ? '#ffffff' : '#34d399',
              border: 'none',
              padding: '9px 18px',
              borderRadius: 'var(--radius-sm)',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: filterTab === 'active' ? '0 4px 14px rgba(16, 185, 129, 0.4)' : 'none',
            }}
          >
            🟢 Active ({activeCount})
          </button>
          <button
            onClick={() => setFilterTab('expired')}
            style={{
              background: filterTab === 'expired' ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' : 'transparent',
              color: filterTab === 'expired' ? '#ffffff' : '#f87171',
              border: 'none',
              padding: '9px 18px',
              borderRadius: 'var(--radius-sm)',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: filterTab === 'expired' ? '0 4px 14px rgba(239, 68, 68, 0.4)' : 'none',
            }}
          >
            🔒 Expired ({expiredCount})
          </button>
          <button
            onClick={() => setFilterTab('disabled')}
            style={{
              background: filterTab === 'disabled' ? 'linear-gradient(135deg, #64748b 0%, #475569 100%)' : 'transparent',
              color: '#ffffff',
              border: 'none',
              padding: '9px 18px',
              borderRadius: 'var(--radius-sm)',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            🚫 Disabled ({disabledCount})
          </button>
        </div>

        <div className="search-box" style={{ maxWidth: 320 }}>
          <Search size={16} />
          <input
            type="text"
            placeholder="Search by name, email, or mobile..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Trial Table */}
      <div className="table-card">
        {filteredList.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: '#64748b' }}>
            <Clock size={44} style={{ margin: '0 auto 12px auto', opacity: 0.5 }} />
            <div style={{ fontSize: 16, fontWeight: 700, color: '#94a3b8' }}>No Trial Accounts in this view</div>
            <div style={{ fontSize: 13, marginTop: 4 }}>
              Trial accounts will appear here automatically when users self-verify with mobile OTP.
            </div>
          </div>
        ) : (
          <table className="control-table">
            <thead>
              <tr>
                <th>Admin & Verification</th>
                <th>Company & Staff</th>
                <th>Start Date</th>
                <th>Simulated Today</th>
                <th>3-Day Expiry</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Testing & Admin Controls</th>
              </tr>
            </thead>
            <tbody>
              {filteredList.map((user) => {
                const isProcessing = processingUid === user.uid;
                const startFormatted = new Date(user.startTime).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
                const todayFormatted = new Date(user.todayTime).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
                const expFormatted = new Date(user.expTime).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

                const comp = user.userComps[0];

                return (
                  <tr key={user.uid} style={{ opacity: user.isDisabled ? 0.65 : 1 }}>
                    {/* Admin & Verification */}
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ fontWeight: 800, color: '#ffffff', fontSize: 14 }}>
                        {user.name || 'Trial Admin'}
                      </div>
                      <div style={{ fontSize: 12.5, color: '#94a3b8', marginTop: 2, display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Mail size={12} /> {user.email}
                      </div>
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                        marginTop: 6,
                        background: 'rgba(16, 185, 129, 0.15)',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        padding: '2px 8px',
                        borderRadius: 6,
                        color: '#34d399',
                        fontSize: 12,
                        fontWeight: 700,
                      }}>
                        <CheckCircle2 size={12} /> Verified: {user.verifiedEmail || user.verifiedPhone}
                      </div>
                    </td>

                    {/* Company & Staff */}
                    <td style={{ padding: '16px 20px' }}>
                      {comp ? (
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Building2 size={14} color="#60a5fa" /> {comp.name}
                          </div>
                          <div style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 3 }}>
                            Code: <strong style={{ fontFamily: 'monospace', color: '#e2e8f0' }}>{comp.joinCode}</strong>
                          </div>
                        </div>
                      ) : (
                        <span style={{ fontSize: 12, color: '#64748b', fontStyle: 'italic' }}>
                          No company created yet
                        </span>
                      )}

                      <div style={{
                        marginTop: 6,
                        fontSize: 11.5,
                        fontWeight: 700,
                        color: user.totalStaff >= 3 ? '#f87171' : '#38bdf8',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                      }}>
                        <Users size={12} />
                        {user.totalStaff} / 3 Staff Members
                      </div>
                    </td>

                    {/* Start Date */}
                    <td style={{ padding: '16px 20px', fontSize: 13, color: '#cbd5e1' }}>
                      {startFormatted}
                    </td>

                    {/* Simulated Today */}
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Calendar size={14} /> {todayFormatted}
                      </div>
                      {user.extraDays > 0 && (
                        <div style={{ fontSize: 11, color: '#fbbf24', marginTop: 3 }}>
                          +{user.extraDays} day{user.extraDays > 1 ? 's' : ''} simulated
                        </div>
                      )}
                    </td>

                    {/* Expiry */}
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: user.isExpired ? '#f87171' : '#34d399' }}>
                        {expFormatted}
                      </div>
                      <div style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 3 }}>
                        {user.isExpired ? (
                          <span style={{ color: '#f87171', fontWeight: 800 }}>Ended</span>
                        ) : (
                          <span>{user.daysRemaining} day{user.daysRemaining > 1 ? 's' : ''} left</span>
                        )}
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td style={{ padding: '16px 20px' }}>
                      {user.isDisabled ? (
                        <span style={{
                          fontSize: 11.5,
                          fontWeight: 800,
                          background: 'rgba(239, 68, 68, 0.2)',
                          color: '#f87171',
                          padding: '4px 10px',
                          borderRadius: 6,
                          border: '1px solid rgba(239, 68, 68, 0.35)',
                        }}>
                          🚫 Disabled
                        </span>
                      ) : user.isExpired ? (
                        <span style={{
                          fontSize: 11.5,
                          fontWeight: 800,
                          background: 'rgba(239, 68, 68, 0.15)',
                          color: '#f87171',
                          padding: '4px 10px',
                          borderRadius: 6,
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                        }}>
                          🔒 Expired
                        </span>
                      ) : (
                        <span style={{
                          fontSize: 11.5,
                          fontWeight: 800,
                          background: 'rgba(16, 185, 129, 0.18)',
                          color: '#34d399',
                          padding: '4px 10px',
                          borderRadius: 6,
                          border: '1px solid rgba(16, 185, 129, 0.35)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                        }}>
                          <span className="pulse-dot" style={{ width: 6, height: 6 }} /> Active Trial
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, flexWrap: 'wrap' }}>
                        {/* Pass 1 Day Button */}
                        <button
                          disabled={isProcessing}
                          onClick={() => handlePassOneDay(user.uid)}
                          style={{
                            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: 'var(--radius-sm)',
                            padding: '6px 10px',
                            fontSize: 11.5,
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            boxShadow: '0 2px 6px rgba(245, 158, 11, 0.3)',
                          }}
                          title="Pass 1 day for testing (advances simulated date by 24h)"
                        >
                          <FastForward size={13} /> Pass 1 Day
                        </button>

                        {/* Reset Days (if extraDays > 0) */}
                        {user.extraDays > 0 && (
                          <button
                            disabled={isProcessing}
                            onClick={() => handleResetDays(user.uid)}
                            style={{
                              background: 'rgba(255, 255, 255, 0.08)',
                              color: '#94a3b8',
                              border: '1px solid rgba(255, 255, 255, 0.15)',
                              borderRadius: 'var(--radius-sm)',
                              padding: '6px 9px',
                              fontSize: 11.5,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                            title="Reset extra simulated days back to 0"
                          >
                            <RotateCcw size={12} /> Reset
                          </button>
                        )}

                        {/* Disable / Enable Toggle */}
                        <button
                          disabled={isProcessing}
                          onClick={() => handleToggleTrialStatus(user.uid, user.accountStatus || user.status)}
                          style={{
                            background: user.isDisabled
                              ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                              : 'rgba(239, 68, 68, 0.15)',
                            color: user.isDisabled ? '#ffffff' : '#f87171',
                            border: user.isDisabled ? 'none' : '1px solid rgba(239, 68, 68, 0.3)',
                            borderRadius: 'var(--radius-sm)',
                            padding: '6px 11px',
                            fontSize: 11.5,
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                          title={user.isDisabled ? 'Re-enable trial access' : 'Disable trial access immediately'}
                        >
                          {user.isDisabled ? (
                            <>
                              <Check size={13} /> Enable
                            </>
                          ) : (
                            <>
                              <Ban size={13} /> Disable
                            </>
                          )}
                        </button>

                        {/* Convert to Paid Plan */}
                        <button
                          disabled={isProcessing}
                          onClick={() => {
                            setConvertingUser(user);
                            setConvertPlan('basic');
                          }}
                          style={{
                            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: 'var(--radius-sm)',
                            padding: '6px 11px',
                            fontSize: 11.5,
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            boxShadow: '0 2px 6px rgba(99, 102, 241, 0.3)',
                          }}
                          title="Convert this trial user to a 30-day paid subscription without losing data"
                        >
                          <Sparkles size={13} /> Convert to Paid
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Convert to Paid Modal */}
      {convertingUser && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: 20,
        }}>
          <div style={{
            background: '#0f172a',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-xl)',
            padding: 30,
            maxWidth: 460,
            width: '100%',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <Sparkles size={22} color="#818cf8" />
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#ffffff', margin: 0 }}>
                Convert Trial to Paid Subscription
              </h3>
            </div>

            <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.5, marginBottom: 20 }}>
              Instantly upgrade <strong>{convertingUser.name}</strong> ({convertingUser.email}) to a full 30-day paid plan. All company workspaces, orders, products, and employee accounts will be 100% preserved.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
              <div
                onClick={() => setConvertPlan('basic')}
                style={{
                  background: convertPlan === 'basic' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                  border: convertPlan === 'basic' ? '2px solid #6366f1' : '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: 16,
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#ffffff' }}>Basic Plan (1 Company)</div>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Unlimited products, orders & staff</div>
                </div>
                <div style={{ fontSize: 15, fontWeight: 900, color: '#818cf8' }}>Rs. 5,000 / mo</div>
              </div>

              <div
                onClick={() => setConvertPlan('pro')}
                style={{
                  background: convertPlan === 'pro' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                  border: convertPlan === 'pro' ? '2px solid #6366f1' : '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: 16,
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#ffffff' }}>Pro Multi-Company (3 Companies)</div>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Up to 3 distinct workspace entities</div>
                </div>
                <div style={{ fontSize: 15, fontWeight: 900, color: '#818cf8' }}>Rs. 10,000 / mo</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setConvertingUser(null)}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={() => handleConvertTrial(convertingUser.uid, convertPlan)}
                disabled={processingUid === convertingUser.uid}
              >
                {processingUid === convertingUser.uid ? 'Converting...' : `Confirm & Upgrade to ${convertPlan === 'pro' ? 'Pro' : 'Basic'}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
