import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPhone, 
  faLock, 
  faShieldAlt, 
  faArrowRight,
  faEye,
  faEyeSlash,
  faSpinner,
  faCheckCircle,
  faExclamationTriangle,
  faKey
} from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from '@/hooks/useTranslation';

export default function LoginPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [step, setStep] = useState<'credentials' | '2fa'>('credentials');
  const [tempToken, setTempToken] = useState('');
  const [userId, setUserId] = useState<number | null>(null);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [twoFactorError, setTwoFactorError] = useState('');

  // Load saved phone from localStorage
  useEffect(() => {
    const savedPhone = localStorage.getItem('rememberedPhone');
    if (savedPhone) {
      setPhone(savedPhone);
      setRememberMe(true);
    }
  }, []);

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password }),
      });
      const data = await res.json();
      
      console.log('Login response:', data);
      
      if (!res.ok) throw new Error(data.error || 'Login failed');
      
      if (data.requiresTwoFactor) {
        setTempToken(data.tempToken);
        setUserId(data.userId);
        setStep('2fa');
        setLoading(false);
        return;
      }
      
      if (!data.token) {
        throw new Error('No token received from server');
      }
      
      // ✅ FIXED: Store user data properly
      if (rememberMe) {
        localStorage.setItem('rememberedPhone', phone);
      } else {
        localStorage.removeItem('rememberedPhone');
      }
      
      localStorage.setItem('token', data.token);
      
      // ✅ FIXED: Proper user object with all fields
      const userData = {
        id: data.user.id,
        fullName: data.user.fullName || data.user.full_name || 'User',
        full_name: data.user.fullName || data.user.full_name || 'User',
        role: data.user.role || 'user',
        branchId: data.user.branchId || data.user.branch_id || null,
        phone: data.user.phone || phone,
      };
      
      localStorage.setItem('user', JSON.stringify(userData));
      console.log('User data stored:', userData);
      
      document.cookie = `token=${data.token}; path=/; max-age=604800; SameSite=Lax`;
      
      // ✅ FIXED: Use router.push instead of window.location for better handling
      router.push('/dashboard');
      
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const handle2faSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTwoFactorError('');
    
    if (!code || code.length !== 6) {
      setTwoFactorError('Please enter a valid 6-digit code');
      setLoading(false);
      return;
    }
    
    try {
      const res = await fetch('/api/auth/verify-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tempToken, code }),
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Verification failed');
      
      if (rememberMe) {
        localStorage.setItem('rememberedPhone', phone);
      } else {
        localStorage.removeItem('rememberedPhone');
      }
      
      localStorage.setItem('token', data.token);
      
      // ✅ FIXED: Proper user object
      const userData = {
        id: data.user.id,
        fullName: data.user.fullName || data.user.full_name || 'User',
        full_name: data.user.fullName || data.user.full_name || 'User',
        role: data.user.role || 'user',
        branchId: data.user.branchId || data.user.branch_id || null,
        phone: data.user.phone || phone,
      };
      
      localStorage.setItem('user', JSON.stringify(userData));
      console.log('User data stored (2FA):', userData);
      
      document.cookie = `token=${data.token}; path=/; max-age=604800; SameSite=Lax`;
      
      router.push('/dashboard');
    } catch (err: any) {
      setTwoFactorError(err.message);
      setLoading(false);
    }
  };

  const goToForgotPassword = () => {
    router.push('/forgot-password');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Left side - Branding */}
      <div style={{ 
        flex: 1, 
        background: 'linear-gradient(135deg, #0f2b3d 0%, #1a4a6e 100%)', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        flexDirection: 'column', 
        padding: '2rem',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: 'url("https://images.pexels.com/photos/210182/pexels-photo-210182.jpeg?auto=compress&cs=tinysrgb&w=800&h=1200&fit=crop")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.15,
          zIndex: 0,
        }} />
        
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <svg width="160" height="160" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ margin: '0 auto', display: 'block' }}>
            <path d="M40 160 L80 80 L120 120 L160 40 L180 80 L140 160 Z" stroke="#f59e0b" strokeWidth="3" fill="none"/>
            <circle cx="100" cy="100" r="30" stroke="#f59e0b" strokeWidth="2" fill="none"/>
            <text x="100" y="180" textAnchor="middle" fill="white" fontSize="20" fontWeight="bold">HENG YUN</text>
            <text x="100" y="200" textAnchor="middle" fill="#cbd5e1" fontSize="14">Quarry ERP System</text>
          </svg>
          
          <h2 style={{ color: 'white', marginTop: '2rem', textAlign: 'center', fontSize: '1.5rem', fontWeight: 'bold' }}>
            Enterprise Resource Planning
          </h2>
          
          <p style={{ color: '#cbd5e1', textAlign: 'center', maxWidth: '300px', marginTop: '1rem', lineHeight: '1.6' }}>
            Manage your quarry business efficiently
          </p>
        </div>
      </div>

      {/* Right side – login form */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb', padding: '1rem' }}>
        <div style={{ background: 'white', padding: '2.5rem', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', width: '100%', maxWidth: '420px' }}>
          
          <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '0.25rem', textAlign: 'center' }}>Welcome Back</h1>
          <p style={{ textAlign: 'center', color: '#6b7280', marginBottom: '2rem' }}>Sign in to your account</p>

          {step === 'credentials' ? (
            <form onSubmit={handleCredentialsSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500', fontSize: '0.9rem', color: '#374151' }}>
                  Phone Number
                </label>
                <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #d1d5db', borderRadius: '8px', padding: '0.5rem' }}>
                  <FontAwesomeIcon icon={faPhone} style={{ color: '#9ca3af', marginRight: '0.5rem' }} />
                  <input 
                    type="tel" 
                    value={phone} 
                    onChange={e => setPhone(e.target.value)} 
                    required 
                    style={{ flex: 1, border: 'none', outline: 'none', fontSize: '1rem' }} 
                    placeholder="0788324580" 
                  />
                </div>
              </div>
              
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500', fontSize: '0.9rem', color: '#374151' }}>
                  Password
                </label>
                <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #d1d5db', borderRadius: '8px', padding: '0.5rem' }}>
                  <FontAwesomeIcon icon={faLock} style={{ color: '#9ca3af', marginRight: '0.5rem' }} />
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    required 
                    style={{ flex: 1, border: 'none', outline: 'none', fontSize: '1rem' }} 
                    placeholder="••••••••" 
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: '0 4px' }}
                  >
                    <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                  </button>
                </div>
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.5rem',
              }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.85rem',
                  color: '#6b7280',
                  cursor: 'pointer',
                }}>
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    style={{
                      width: '16px',
                      height: '16px',
                      accentColor: '#f59e0b',
                      cursor: 'pointer',
                    }}
                  />
                  Remember me
                </label>
                <button
                  type="button"
                  onClick={goToForgotPassword}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#f59e0b',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    fontWeight: '500',
                  }}
                >
                  Forgot Password?
                </button>
              </div>

              {error && (
                <div style={{ 
                  padding: '0.75rem 1rem', 
                  background: '#fee2e2', 
                  borderRadius: '8px', 
                  color: '#dc2626', 
                  fontSize: '0.875rem', 
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}>
                  <FontAwesomeIcon icon={faExclamationTriangle} />
                  {error}
                </div>
              )}

              <button 
                type="submit" 
                disabled={loading} 
                style={{ 
                  width: '100%', 
                  background: loading ? '#9ca3af' : '#f59e0b', 
                  color: '#1f2937', 
                  padding: '0.75rem', 
                  borderRadius: '8px', 
                  border: 'none', 
                  fontWeight: '600', 
                  cursor: loading ? 'not-allowed' : 'pointer', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '0.5rem',
                  transition: 'all 0.2s',
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? (
                  <><FontAwesomeIcon icon={faSpinner} spin /> Signing in...</>
                ) : (
                  <>Sign In <FontAwesomeIcon icon={faArrowRight} /></>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handle2faSubmit}>
              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: '#fef3c7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 0.75rem',
                }}>
                  <FontAwesomeIcon icon={faShieldAlt} style={{ fontSize: '28px', color: '#f59e0b' }} />
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#111827', margin: 0 }}>
                  Two-Factor Authentication
                </h3>
                <p style={{ color: '#6b7280', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                  Enter the 6-digit code from your authenticator app
                </p>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500', fontSize: '0.9rem', color: '#374151' }}>
                  Verification Code
                </label>
                <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #d1d5db', borderRadius: '8px', padding: '0.5rem' }}>
                  <FontAwesomeIcon icon={faKey} style={{ color: '#9ca3af', marginRight: '0.5rem' }} />
                  <input 
                    type="text" 
                    value={code} 
                    onChange={e => {
                      const val = e.target.value.replace(/\D/g, '');
                      setCode(val);
                      setTwoFactorError('');
                    }} 
                    required 
                    style={{ flex: 1, border: 'none', outline: 'none', fontSize: '1.2rem', letterSpacing: '0.3rem', textAlign: 'center' }} 
                    placeholder="000000" 
                    maxLength={6} 
                    autoFocus 
                  />
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.7rem',
                  color: '#9ca3af',
                  marginTop: '0.25rem',
                }}>
                  <span>Enter 6-digit code</span>
                  <span>{code.length}/6</span>
                </div>
              </div>

              {twoFactorError && (
                <div style={{ 
                  padding: '0.75rem 1rem', 
                  background: '#fee2e2', 
                  borderRadius: '8px', 
                  color: '#dc2626', 
                  fontSize: '0.875rem', 
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}>
                  <FontAwesomeIcon icon={faExclamationTriangle} />
                  {twoFactorError}
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => { 
                    setStep('credentials'); 
                    setTempToken(''); 
                    setUserId(null); 
                    setCode(''); 
                    setTwoFactorError('');
                  }}
                  style={{
                    flex: 1,
                    padding: '0.7rem',
                    background: '#f3f4f6',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    color: '#6b7280',
                    fontWeight: '500',
                  }}
                >
                  Back
                </button>
                <button 
                  type="submit" 
                  disabled={loading || code.length !== 6} 
                  style={{ 
                    flex: 2,
                    background: (loading || code.length !== 6) ? '#9ca3af' : '#f59e0b', 
                    color: '#1f2937', 
                    padding: '0.7rem', 
                    borderRadius: '8px', 
                    border: 'none', 
                    fontWeight: '600', 
                    cursor: (loading || code.length !== 6) ? 'not-allowed' : 'pointer', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    gap: '0.5rem',
                    opacity: (loading || code.length !== 6) ? 0.6 : 1,
                  }}
                >
                  {loading ? (
                    <><FontAwesomeIcon icon={faSpinner} spin /> Verifying...</>
                  ) : (
                    <><FontAwesomeIcon icon={faCheckCircle} /> Verify & Login</>
                  )}
                </button>
              </div>

              <div style={{
                marginTop: '1rem',
                padding: '0.75rem',
                background: '#fef3c7',
                borderRadius: '8px',
                fontSize: '0.8rem',
                color: '#92400e',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}>
                <FontAwesomeIcon icon={faKey} style={{ color: '#f59e0b' }} />
                <span>Open your authenticator app to get your 6-digit code</span>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}