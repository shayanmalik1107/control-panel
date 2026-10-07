import { useState, useEffect } from 'react';
import { ref, onValue, update, get } from 'firebase/database';
import { database } from '../../firebase';
import {
  CreditCard, CheckCircle2, XCircle, Search, Edit2,
  Sparkles, Package, Building2, ShieldAlert, ArrowUpRight, Clock, AlertTriangle, Calendar, Plus, FastForward, Filter, Layers
} from 'lucide-react';

export default function PackagesTab() {
  const [users, setUsers] = useState([]);
  const [companies, setCompanies] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending_all'); // 'pending_all' | 'pending_new' | 'upgrades' | 'active'
  const [searchQuery, setSearchQuery] = useState('');

  // Editing modal state
  const [editingUser, setEditingUser] = useState(null);
  const [customLimit, setCustomLimit] = useState(1);
  const [customPlan, setCustomPlan] = useState('basic');
  const [processingUid, setProcessingUid] = useState(null);

  useEffect(() => {
    // Real-time listener for users
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

    // Real-time listener for companies created per owner
    const compsRef = ref(database, 'companies');
    const unsubComps = onValue(compsRef, (snap) => {
      const counts = {};
      if (snap.exists()) {
        snap.forEach((child) => {
          const compInfo = child.val()?.info;
          if (compInfo && compInfo.ownerUid) {
            counts[compInfo.ownerUid] = (counts[compInfo.ownerUid] || 0) + 1;
          }
        });
      }
      setCompanies(counts);
    });

    return () => {
      unsubUsers();
      unsubComps();
    };
  }, []);

  const handleApprove = async (uid, maxCompaniesOverride, planIdOverride) => {
    setProcessingUid(uid);
    try {
      const userRef = ref(database, `users/${uid}`);
      const snap = await get(userRef);
      if (!snap.exists()) return;

      const userData = snap.val();
      const req = userData.upgradeRequest || {};

      // Determine final plan: prioritize requestedPlanId from upgradeRequest or planIdOverride
      let finalPlan = 'basic';
      if (
        planIdOverride === 'pro' ||
        req.requestedPlanId === 'pro' ||
        Number(req.requestedMaxCompanies) === 3 ||
        (req.requestedPackageName && String(req.requestedPackageName).toLowerCase().includes('pro'))
      ) {
        finalPlan = 'pro';
      } else if (
        planIdOverride === 'basic' ||
        req.requestedPlanId === 'basic' ||
        (req.requestedPackageName && String(req.requestedPackageName).toLowerCase().includes('basic'))
      ) {
        finalPlan = 'basic';
      } else if (userData.package?.planId) {
        finalPlan = userData.package.planId;
      }

      const isBasic = finalPlan === 'basic';
      const defaultLimit = isBasic ? 1 : 3;

      let finalLimit = isBasic ? 1 : defaultLimit;
      if (!isBasic && req.requestedMaxCompanies) {
        finalLimit = req.requestedMaxCompanies;
      } else if (!isBasic && Number(maxCompaniesOverride) > 0) {
        finalLimit = Number(maxCompaniesOverride);
      }

      const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
      const oneDayMs = 24 * 60 * 60 * 1000;
      const now = Date.now();

      const existingSub = userData.subscription || {};
      const extraDays = existingSub.extraDaysPassed || 0;
      
      // Calculate current Today's Date
      const currentTodayTime = now + (extraDays * oneDayMs);

      // When upgrading or approving a plan, set subscription to exactly 30 days from today (prorated billing adjusts remaining days)
      const newExpiry = currentTodayTime + thirtyDaysMs;

      const updates = {};
      updates[`users/${uid}/accountStatus`] = 'active';
      updates[`users/${uid}/approvalStatus`] = 'approved';
      updates[`users/${uid}/maxCompanies`] = finalLimit;
      updates[`users/${uid}/approvedAt`] = now;
      updates[`users/${uid}/package/status`] = 'active';
      updates[`users/${uid}/package/planId`] = finalPlan;
      updates[`users/${uid}/package/name`] = isBasic ? 'Basic Package' : 'Pro Multi-Company Package';
      updates[`users/${uid}/package/price`] = isBasic ? 5000 : 10000;
      updates[`users/${uid}/package/maxCompanies`] = finalLimit;
      updates[`users/${uid}/upgradeRequest`] = null;

      // Save subscription dates: starting from current Today's Date, expiring 30 days from today
      updates[`users/${uid}/subscription`] = {
        startDate: currentTodayTime,
        expiryDate: newExpiry,
        planId: finalPlan,
        price: isBasic ? 5000 : 10000,
        status: 'active',
        lastApprovedAt: now,
        extraDaysPassed: extraDays,
      };

      await update(ref(database), updates);
      setEditingUser(null);
    } catch (err) {
      console.error('Failed to approve account:', err);
      alert('Error approving account');
    } finally {
      setProcessingUid(null);
    }
  };

  const handleAddMonth = async (uid) => {
    setProcessingUid(uid);
    try {
      const userRef = ref(database, `users/${uid}`);
      const snap = await get(userRef);
      if (!snap.exists()) return;

      const userData = snap.val();
      const sub = userData.subscription || {};
      const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
      const oneDayMs = 24 * 60 * 60 * 1000;
      const now = Date.now();

      const extraDays = sub.extraDaysPassed || 0;
      const currentTodayTime = now + (extraDays * oneDayMs);

      const currentExpiry = (sub.expiryDate && sub.expiryDate > currentTodayTime) ? sub.expiryDate : currentTodayTime;
      const newExpiry = currentExpiry + thirtyDaysMs;

      const updates = {};
      updates[`users/${uid}/subscription/startDate`] = sub.startDate || currentTodayTime;
      updates[`users/${uid}/subscription/expiryDate`] = newExpiry;
      updates[`users/${uid}/subscription/status`] = 'active';
      updates[`users/${uid}/accountStatus`] = 'active';
      updates[`users/${uid}/package/status`] = 'active';

      await update(ref(database), updates);
    } catch (err) {
      console.error('Failed to add 1 month:', err);
      alert('Failed to extend subscription expiry');
    } finally {
      setProcessingUid(null);
    }
  };

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

      const updates = {};
      updates[`users/${uid}/subscription/extraDaysPassed`] = newExtra;

      const now = Date.now();
      const oneDayMs = 24 * 60 * 60 * 1000;
      const todayTime = now + (newExtra * oneDayMs);
      const startTime = sub.startDate || userData.approvedAt || userData.createdAt || now;
      const expTime = sub.expiryDate || (startTime + (30 * oneDayMs));

      if (todayTime >= expTime) {
        updates[`users/${uid}/subscription/status`] = 'expired';
      }

      await update(ref(database), updates);
    } catch (err) {
      console.error('Failed to pass 1 day:', err);
      alert('Failed to advance current day');
    } finally {
      setProcessingUid(null);
    }
  };

  const handleReject = async (uid) => {
    if (!window.confirm('Reject payment and disable this admin account?')) return;
    setProcessingUid(uid);
    try {
      const updates = {};
      updates[`users/${uid}/accountStatus`] = 'disabled';
      updates[`users/${uid}/approvalStatus`] = 'rejected';
      await update(ref(database), updates);
    } catch (err) {
      alert('Failed to reject account');
    } finally {
      setProcessingUid(null);
    }
  };

  const handleRejectUpgrade = async (uid) => {
    if (!window.confirm('Reject this plan request? The admin will remain on their current active plan.')) return;
    setProcessingUid(uid);
    try {
      const updates = {};
      updates[`users/${uid}/upgradeRequest`] = null;
      await update(ref(database), updates);
    } catch (err) {
      alert('Failed to reject request');
    } finally {
      setProcessingUid(null);
    }
  };

  // Filter accounts
  const adminUsers = users.filter(u => u.role === 'admin' || !u.role);

  const pendingNewUsers = adminUsers.filter(u =>
    u.accountStatus === 'pending_approval' ||
    (u.package && u.package.status === 'pending_payment')
  );

  const upgradeUsers = adminUsers.filter(u =>
    u.upgradeRequest && u.upgradeRequest.status === 'pending'
  );

  const activeUsers = adminUsers.filter(u =>
    u.accountStatus === 'active' ||
    u.approvalStatus === 'approved' ||
    (!u.accountStatus && u.companyId)
  );

  let currentList = [];
  if (activeTab === 'pending_all') {
    currentList = [...upgradeUsers, ...pendingNewUsers];
  } else if (activeTab === 'upgrades') {
    currentList = upgradeUsers;
  } else if (activeTab === 'pending_new') {
    currentList = pendingNewUsers;
  } else {
    currentList = activeUsers;
  }

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    currentList = currentList.filter(u =>
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.phone?.includes(q)
    );
  }

  if (loading) {
    return (
      <div style={{ padding: 60, textAlign: 'center', color: '#94a3b8' }}>
        <div className="loading-spinner lg" style={{ margin: '0 auto 20px auto' }} />
        <div style={{ fontSize: 16, fontWeight: 700, color: '#ffffff' }}>Loading Subscription Directory...</div>
        <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>Syncing plan tiers, payment status, and 30-day billing cycles</div>
      </div>
    );
  }

  return (
    <div>
      {/* Top Header Summary */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(15, 23, 42, 0.9) 60%, rgba(59, 130, 246, 0.1) 100%)',
        border: '1px solid rgba(99, 102, 241, 0.35)',
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
            color: '#818cf8',
            fontSize: 12,
            fontWeight: 800,
            marginBottom: 8,
            textTransform: 'uppercase',
            letterSpacing: '1px',
            background: 'rgba(99, 102, 241, 0.15)',
            padding: '4px 12px',
            borderRadius: 'var(--radius-full)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
          }}>
            <CreditCard size={15} /> Billing & Subscriptions Center
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: '#ffffff', margin: '0 0 6px 0', letterSpacing: '-0.5px' }}>
            Package Verification & Subscription Expiry Controls
          </h2>
          <p style={{ fontSize: 13.5, color: '#94a3b8', margin: 0 }}>
            Approve payments, manage 30-day expiry dates, add extension months, and review prorated upgrades.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{
            background: 'rgba(15, 23, 42, 0.8)',
            padding: '12px 18px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            minWidth: 120,
          }}>
            <div style={{ fontSize: 11, color: '#fbbf24', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>NEW APPROVALS</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#ffffff', marginTop: 2 }}>{pendingNewUsers.length}</div>
          </div>
          <div style={{
            background: upgradeUsers.length > 0 ? 'rgba(99, 102, 241, 0.25)' : 'rgba(15, 23, 42, 0.8)',
            padding: '12px 18px',
            borderRadius: 'var(--radius-md)',
            border: upgradeUsers.length > 0 ? '1px solid #6366f1' : '1px solid rgba(255, 255, 255, 0.1)',
            minWidth: 130,
            boxShadow: upgradeUsers.length > 0 ? '0 0 20px rgba(99, 102, 241, 0.3)' : 'none',
          }}>
            <div style={{ fontSize: 11, color: '#818cf8', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              <Sparkles size={12} /> UPGRADES
            </div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#818cf8', marginTop: 2 }}>{upgradeUsers.length}</div>
          </div>
          <div style={{
            background: 'rgba(15, 23, 42, 0.8)',
            padding: '12px 18px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            minWidth: 130,
          }}>
            <div style={{ fontSize: 11, color: '#34d399', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>SUBSCRIBERS</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#ffffff', marginTop: 2 }}>{activeUsers.length}</div>
          </div>
        </div>
      </div>

      {/* Upgrade Requests Alert Banner if any pending */}
      {upgradeUsers.length > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.3) 0%, rgba(79, 70, 229, 0.2) 100%)',
          border: '1px solid #6366f1',
          borderRadius: 'var(--radius-md)',
          padding: '16px 24px',
          marginBottom: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          boxShadow: '0 8px 25px rgba(99, 102, 241, 0.25)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(99, 102, 241, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818cf8', border: '1px solid rgba(255,255,255,0.2)' }}>
              <Sparkles size={22} color="#818cf8" />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#ffffff' }}>
                ⚡ {upgradeUsers.length} Pending Package Request{upgradeUsers.length > 1 ? 's' : ''} — Review Required!
              </div>
              <div style={{ fontSize: 12.5, color: '#cbd5e1', marginTop: 2 }}>
                Admins have submitted requests for package renewals or Pro upgrades. Review proof and process immediately.
              </div>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('upgrades')}
            className="btn btn-primary"
            style={{ fontSize: 12.5, padding: '9px 18px', whiteSpace: 'nowrap' }}
          >
            Review Upgrade Requests ({upgradeUsers.length})
          </button>
        </div>
      )}

      {/* Toolbar & Filter Tabs */}
      <div className="toolbar" style={{ flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 8, background: '#0a0d16', padding: 5, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveTab('pending_all')}
            style={{
              background: activeTab === 'pending_all' ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' : 'transparent',
              color: '#ffffff',
              border: 'none',
              padding: '9px 18px',
              borderRadius: 'var(--radius-sm)',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: activeTab === 'pending_all' ? '0 4px 14px rgba(99, 102, 241, 0.4)' : 'none',
            }}
          >
            🔥 All Pending Actions ({pendingNewUsers.length + upgradeUsers.length})
          </button>
          <button
            onClick={() => setActiveTab('upgrades')}
            style={{
              background: activeTab === 'upgrades' ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' : 'transparent',
              color: activeTab === 'upgrades' ? '#ffffff' : '#818cf8',
              border: 'none',
              padding: '9px 18px',
              borderRadius: 'var(--radius-sm)',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 0.2s',
              boxShadow: activeTab === 'upgrades' ? '0 4px 14px rgba(99, 102, 241, 0.4)' : 'none',
            }}
          >
            <Sparkles size={14} /> Upgrade Requests ({upgradeUsers.length})
          </button>
          <button
            onClick={() => setActiveTab('pending_new')}
            style={{
              background: activeTab === 'pending_new' ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' : 'transparent',
              color: '#ffffff',
              border: 'none',
              padding: '9px 18px',
              borderRadius: 'var(--radius-sm)',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: activeTab === 'pending_new' ? '0 4px 14px rgba(99, 102, 241, 0.4)' : 'none',
            }}
          >
            🟡 New Registrations ({pendingNewUsers.length})
          </button>
          <button
            onClick={() => setActiveTab('active')}
            style={{
              background: activeTab === 'active' ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' : 'transparent',
              color: '#ffffff',
              border: 'none',
              padding: '9px 18px',
              borderRadius: 'var(--radius-sm)',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: activeTab === 'active' ? '0 4px 14px rgba(99, 102, 241, 0.4)' : 'none',
            }}
          >
            🟢 Active Subscriptions ({activeUsers.length})
          </button>
        </div>

        <div className="search-box" style={{ maxWidth: 320 }}>
          <Search size={16} />
          <input
            type="text"
            placeholder="Search admin name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Data Table */}
      <div className="table-card">
        {currentList.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: '#64748b' }}>
            <Layers size={40} style={{ margin: '0 auto 12px auto', opacity: 0.5 }} />
            <div style={{ fontSize: 15, fontWeight: 700, color: '#94a3b8' }}>No accounts in this category</div>
            <div style={{ fontSize: 12.5, marginTop: 4 }}>Try changing your tab selection or search term.</div>
          </div>
        ) : (
          <table className="control-table">
            <thead>
              <tr>
                <th>Admin Details</th>
                <th>Selected / Requested Package</th>
                <th>Allowed Slots</th>
                <th>Starting Date</th>
                <th>Today's Date</th>
                <th>Expiry Date</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentList.map((user) => {
                const isUpgradeReq = user.upgradeRequest && user.upgradeRequest.status === 'pending';
                const req = user.upgradeRequest || {};
                const isProReq = isUpgradeReq && (
                  req.requestedPlanId === 'pro' ||
                  req.requestedMaxCompanies === 3 ||
                  (req.requestedPackageName && req.requestedPackageName.toLowerCase().includes('pro'))
                );
                const isBasicReq = isUpgradeReq && !isProReq;
                const requestedPlanId = isUpgradeReq ? (isProReq ? 'pro' : 'basic') : null;

                const pkg = user.package || {};
                const sub = user.subscription || {};

                const planName = isUpgradeReq
                  ? (isProReq ? 'Pro Package Upgrade' : 'Basic Package Renewal')
                  : (pkg.name || (pkg.planId === 'pro' ? 'Pro Package' : 'Basic Package'));

                const price = isUpgradeReq
                  ? (user.upgradeRequest?.requestedPrice ?? (isProReq ? 10000 : 5000))
                  : (pkg.price || (pkg.planId === 'pro' ? 10000 : 5000));

                const currentMaxComp = user.maxCompanies || pkg.maxCompanies || 1;
                const requestedMaxComp = isUpgradeReq ? (user.upgradeRequest?.requestedMaxCompanies || (isProReq ? 3 : 1)) : currentMaxComp;
                const createdCount = companies[user.uid] || 0;
                const isProcessing = processingUid === user.uid;

                // Dates calculation
                const now = Date.now();
                const oneDayMs = 24 * 60 * 60 * 1000;
                const startTime = sub.startDate || user.approvedAt || user.createdAt || now;
                const startFormatted = new Date(startTime).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

                const extraDays = sub.extraDaysPassed || 0;
                const todayTimestamp = now + (extraDays * oneDayMs);
                const todayFormatted = new Date(todayTimestamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

                const expTime = sub.expiryDate || (startTime + (30 * oneDayMs));
                const expFormatted = new Date(expTime).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

                const daysRemaining = Math.max(0, Math.ceil((expTime - todayTimestamp) / oneDayMs));
                const isSubExpired = sub.status === 'expired' || todayTimestamp >= expTime || daysRemaining <= 0;

                const prorated = user.upgradeRequest?.prorated;
                const isScheduledDowngrade = user.scheduledDowngrade?.status === 'scheduled';

                return (
                  <tr key={user.uid} style={{ background: isUpgradeReq ? 'rgba(99, 102, 241, 0.04)' : 'transparent' }}>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ fontWeight: 800, color: '#ffffff', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                        {user.name || 'Admin Owner'}
                        {isUpgradeReq && (
                          <span style={{
                            fontSize: 10,
                            fontWeight: 800,
                            background: isProReq ? 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            color: '#ffffff',
                            padding: '2px 8px',
                            borderRadius: 'var(--radius-full)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                          }}>
                            {isProReq ? 'UPGRADE REQ' : 'RENEWAL REQ'}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 12.5, color: '#94a3b8', marginTop: 2 }}>{user.email}</div>
                      <div style={{ fontSize: 11.5, color: '#64748b' }}>{user.phone || 'No phone'}</div>
                    </td>

                    <td style={{ padding: '16px 20px' }}>
                      {isUpgradeReq ? (
                        <div>
                          <span style={{
                            fontSize: 12,
                            fontWeight: 800,
                            padding: '6px 14px',
                            borderRadius: 'var(--radius-sm)',
                            background: isProReq ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            color: '#ffffff',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                          }}>
                            {isProReq ? <Sparkles size={14} /> : <CheckCircle2 size={14} />}
                            {isProReq ? 'PRO UPGRADE' : 'BASIC RENEWAL'}
                          </span>

                          {prorated && prorated.isProrated ? (
                            <div style={{ marginTop: 8, fontSize: 11.5, background: '#090d16', padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(99, 102, 241, 0.35)' }}>
                              <div style={{ color: '#818cf8', fontWeight: 800 }}>⚡ Prorated Charge: Rs. {prorated.proratedCharge.toLocaleString()}</div>
                              <div style={{ color: '#34d399', marginTop: 2 }}>Unused Basic Credit ({prorated.remainingDays}d left): -Rs. {prorated.unusedBasicCredit.toLocaleString()}</div>
                              <div style={{ color: '#94a3b8', marginTop: 2 }}>Next Month Full Price: Rs. 10,000</div>
                            </div>
                          ) : (
                            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 6, fontWeight: 600 }}>
                              Price to Charge: <span style={{ color: '#ffffff', fontWeight: 800 }}>Rs. {price.toLocaleString()}</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div>
                          <span style={{
                            fontSize: 12.5,
                            fontWeight: 700,
                            padding: '5px 12px',
                            borderRadius: 'var(--radius-sm)',
                            background: pkg.planId === 'pro' ? 'rgba(99, 102, 241, 0.18)' : 'rgba(255,255,255,0.06)',
                            color: pkg.planId === 'pro' ? '#818cf8' : '#e2e8f0',
                            border: pkg.planId === 'pro' ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid var(--border-color)',
                          }}>
                            {planName} (Rs. {price.toLocaleString()})
                          </span>
                          {isScheduledDowngrade && (
                            <div style={{ marginTop: 6, fontSize: 11.5, color: '#f59e0b', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}>
                              <Calendar size={13} /> Scheduled Basic Downgrade at Expire
                            </div>
                          )}
                        </div>
                      )}
                    </td>

                    <td style={{ padding: '16px 20px', fontWeight: 800, color: '#818cf8', fontSize: 14 }}>
                      {isUpgradeReq ? (
                        <span>
                          <span style={{ textDecoration: 'line-through', color: '#64748b', marginRight: 6 }}>{currentMaxComp} Slot</span>
                          → <strong style={{ color: '#818cf8', background: 'rgba(99, 102, 241, 0.15)', padding: '2px 8px', borderRadius: 6 }}>{requestedMaxComp} Slots</strong>
                        </span>
                      ) : (
                        <span style={{ background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: 6, border: '1px solid var(--border-color)' }}>
                          {createdCount} / {currentMaxComp} Slots
                        </span>
                      )}
                    </td>

                    {/* Starting Date Column */}
                    <td style={{ padding: '16px 20px', fontSize: 13.5, fontWeight: 700, color: '#e2e8f0' }}>
                      {startFormatted}
                    </td>

                    {/* Today's Date Column */}
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ fontSize: 13.5, fontWeight: 800, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Calendar size={14} color="#38bdf8" />
                        {todayFormatted}
                      </div>
                      <div style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 3, fontWeight: 600 }}>
                        {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} left for expiry
                      </div>
                    </td>

                    {/* Expiry Date Column */}
                    <td style={{ padding: '16px 20px' }}>
                      {isSubExpired ? (
                        <span style={{ fontSize: 11, fontWeight: 800, background: 'rgba(239, 68, 68, 0.2)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.4)', padding: '4px 10px', borderRadius: 6 }}>
                          🔒 Expired ({expFormatted})
                        </span>
                      ) : (
                        <div style={{ fontSize: 13.5, fontWeight: 800, color: daysRemaining < 5 ? '#fbbf24' : '#34d399' }}>
                          ● {expFormatted}
                        </div>
                      )}
                    </td>

                    <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, flexWrap: 'wrap' }}>
                        {/* Pass 1 Day Button (Testing) */}
                        <button
                          disabled={isProcessing}
                          onClick={() => handlePassOneDay(user.uid)}
                          style={{
                            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: 'var(--radius-sm)',
                            padding: '7px 11px',
                            fontSize: 11.5,
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 5,
                            boxShadow: '0 2px 8px rgba(245, 158, 11, 0.35)',
                          }}
                          title="Pass 1 day (deduct 24h from expiry date for testing)"
                        >
                          <FastForward size={13} /> Pass 1 Day
                        </button>

                        {/* + Add 1 Month Button */}
                        <button
                          disabled={isProcessing}
                          onClick={() => handleAddMonth(user.uid)}
                          style={{
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: 'var(--radius-sm)',
                            padding: '7px 11px',
                            fontSize: 11.5,
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 5,
                            boxShadow: '0 2px 8px rgba(16, 185, 129, 0.35)',
                          }}
                          title="Add 30 Days extension to expiry"
                        >
                          <Plus size={13} /> + 1 Month
                        </button>

                        {isUpgradeReq ? (
                          <>
                            <button
                              disabled={isProcessing}
                              onClick={() => handleApprove(user.uid, requestedMaxComp, requestedPlanId || 'pro')}
                              style={{
                                background: isProReq ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: 'var(--radius-sm)',
                                padding: '7px 14px',
                                fontSize: 12,
                                fontWeight: 800,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 5,
                                boxShadow: isProReq ? '0 4px 14px rgba(99, 102, 241, 0.4)' : '0 4px 14px rgba(16, 185, 129, 0.4)',
                              }}
                            >
                              {isProReq ? <Sparkles size={14} /> : <CheckCircle2 size={14} />}
                              {isProReq ? 'Approve Pro (3 Slots)' : 'Approve Basic Renewal (1 Slot)'}
                            </button>

                            <button
                              disabled={isProcessing}
                              onClick={() => handleRejectUpgrade(user.uid)}
                              className="btn btn-danger"
                              style={{ padding: '7px 10px', fontSize: 12 }}
                              title="Reject Upgrade Request"
                            >
                              <XCircle size={14} />
                            </button>
                          </>
                        ) : (user.accountStatus === 'pending_approval' || pkg.status === 'pending_payment') ? (
                          <>
                            <button
                              disabled={isProcessing}
                              onClick={() => {
                                setEditingUser(user);
                                setCustomLimit(currentMaxComp);
                                setCustomPlan(pkg.planId || 'basic');
                              }}
                              style={{
                                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: 'var(--radius-sm)',
                                padding: '7px 14px',
                                fontSize: 12,
                                fontWeight: 800,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 5,
                                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)',
                              }}
                            >
                              <CheckCircle2 size={14} /> Review & Approve
                            </button>

                            <button
                              disabled={isProcessing}
                              onClick={() => handleReject(user.uid)}
                              className="btn btn-danger"
                              style={{ padding: '7px 10px', fontSize: 12 }}
                            >
                              <XCircle size={14} />
                            </button>
                          </>
                        ) : (
                          <button
                            disabled={isProcessing}
                            onClick={() => {
                              setEditingUser(user);
                              setCustomLimit(currentMaxComp);
                              setCustomPlan(pkg.planId || 'basic');
                            }}
                            className="btn btn-secondary"
                            style={{ padding: '7px 12px', fontSize: 12, fontWeight: 700 }}
                          >
                            <Edit2 size={13} /> Edit
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Limit & Approval Modal */}
      {editingUser && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3 style={{ fontSize: 20, fontWeight: 800, color: '#ffffff', marginBottom: 6, letterSpacing: '-0.4px' }}>
              {editingUser.accountStatus === 'pending_approval' ? 'Approve & Set Company Limit' : 'Update Company Limit & Package'}
            </h3>
            <p style={{ fontSize: 13.5, color: '#94a3b8', marginBottom: 24 }}>
              Admin: <strong style={{ color: '#ffffff' }}>{editingUser.name}</strong> ({editingUser.email})
            </p>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#cbd5e1', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Package Plan:
              </label>
              <select
                value={customPlan}
                onChange={(e) => {
                  const p = e.target.value;
                  setCustomPlan(p);
                  setCustomLimit(p === 'basic' ? 1 : 3);
                }}
                style={{
                  width: '100%',
                  background: '#090d16',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 14px',
                  color: '#ffffff',
                  fontSize: 14,
                  outline: 'none',
                }}
              >
                <option value="basic">Basic Plan (Rs. 5,000 / mo) — 1 Company Slot</option>
                <option value="pro">Pro Multi-Company Plan (Rs. 10,000 / mo) — 3 Company Slots</option>
              </select>
            </div>

            <div style={{ marginBottom: 28 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#cbd5e1', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Max Allowed Companies (Custom Limit Override):
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={customLimit}
                onChange={(e) => setCustomLimit(parseInt(e.target.value, 10) || 1)}
                style={{
                  width: '100%',
                  background: '#090d16',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 14px',
                  color: '#ffffff',
                  fontSize: 16,
                  fontWeight: 800,
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                disabled={processingUid !== null}
                onClick={() => handleApprove(editingUser.uid, customLimit, customPlan)}
                className="btn btn-primary"
                style={{ flex: 1, padding: '12px 16px', fontSize: 14 }}
              >
                {editingUser.accountStatus === 'pending_approval' ? 'Approve Account Now' : 'Save Changes'}
              </button>
              <button
                onClick={() => setEditingUser(null)}
                className="btn btn-secondary"
                style={{ padding: '12px 18px', fontSize: 14 }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

