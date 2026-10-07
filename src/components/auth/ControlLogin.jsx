import { useState } from 'react';
import { useControlAuth } from '../../contexts/AuthContext';
import { ShieldCheck, KeyRound, ArrowRight, Lock } from 'lucide-react';

export default function ControlLogin() {
  const { login } = useControlAuth();
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!passcode) return;
    const success = login(passcode);
    if (!success) {
      setError('Invalid Access Key. Default keys: superadmin or 1107');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at 50% 20%, #1e1b4b 0%, #07090e 80%)',
      padding: 24,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Ambient background glow effects */}
      <div style={{
        position: 'absolute',
        top: '25%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 500,
        height: 500,
        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.25) 0%, rgba(0, 0, 0, 0) 70%)',
        pointerEvents: 'none',
        filter: 'blur(40px)',
      }} />

      <div style={{ width: '100%', maxWidth: 440, position: 'relative', zIndex: 10 }}>
        <div style={{
          background: 'rgba(15, 20, 32, 0.85)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          borderRadius: 'var(--radius-xl)',
          padding: 44,
          boxShadow: '0 30px 70px rgba(0, 0, 0, 0.7), 0 0 40px rgba(99, 102, 241, 0.18)',
        }}>
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <div style={{
              width: 64,
              height: 64,
              borderRadius: 'var(--radius-lg)',
              background: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 12px 30px -5px rgba(99, 102, 241, 0.6)',
              marginBottom: 20,
              border: '1px solid rgba(255, 255, 255, 0.2)',
            }}>
              <ShieldCheck size={32} />
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: '#ffffff', margin: '0 0 8px 0', letterSpacing: '-0.6px' }}>
              System Control Panel
            </h1>
            <p style={{ fontSize: 13.5, color: '#94a3b8', margin: 0, fontWeight: 500 }}>
              Master Security & Account Control Hub
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 11.5, fontWeight: 800, textTransform: 'uppercase', color: '#94a3b8', marginBottom: 10, letterSpacing: '0.8px' }}>
                Master Access Key
              </label>
              <div style={{ position: 'relative' }}>
                <KeyRound size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                <input
                  type="password"
                  placeholder="Enter passcode (e.g. superadmin)"
                  value={passcode}
                  onChange={(e) => { setPasscode(e.target.value); setError(''); }}
                  style={{
                    width: '100%',
                    padding: '14px 16px 14px 46px',
                    background: '#090d16',
                    border: error ? '1px solid #ef4444' : '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    color: '#ffffff',
                    fontSize: 14.5,
                    outline: 'none',
                    transition: 'all 0.25s ease',
                    boxShadow: error ? '0 0 0 4px rgba(239, 68, 68, 0.15)' : 'none',
                  }}
                  autoFocus
                />
              </div>
              {error && (
                <div style={{ color: '#f87171', fontSize: 12.5, marginTop: 10, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Lock size={13} /> {error}
                </div>
              )}
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '14px 20px', fontSize: 15, borderRadius: 'var(--radius-md)' }}
            >
              Enter Control Panel <ArrowRight size={18} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

