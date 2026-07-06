// src/components/settings/AccountSettings.tsx
import { useEffect, useState, useRef } from 'react';
import { getAuthHeaders } from '@/lib/auth-client';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUser, faEnvelope, faPhone, faKey, faSave, faShieldAlt, 
  faQrcode, faCamera, faCheckCircle, faCopy, faEye, faEyeSlash,
  faExclamationTriangle, faArrowLeft
} from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from '@/hooks/useTranslation';

// ========== DESIGN TOKENS ==========
const COLORS = {
  primary: "#f59e0b",
  primaryDark: "#d97706",
  success: "#10b981",
  danger: "#ef4444",
  info: "#3b82f6",
  textPrimary: "#111827",
  textSecondary: "#6b7280",
  textMuted: "#9ca3af",
  bgGray: "#f9fafb",
  border: "#e5e7eb",
  shadow: "0 1px 3px rgba(0,0,0,0.06)",
  shadowHover: "0 8px 25px rgba(0,0,0,0.08)",
};

export default function AccountSettings() {
  const { t } = useTranslation();
  const [user, setUser] = useState({ name: '', email: '', phone: '', avatar: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Password change state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // 2FA state
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFactorSecret, setTwoFactorSecret] = useState('');
  const [twoFactorQrCode, setTwoFactorQrCode] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [twoFactorLoading, setTwoFactorLoading] = useState(false);
  const [twoFactorMessage, setTwoFactorMessage] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchProfile();
    fetchTwoFactorStatus();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/user/profile', { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setUser({
          name: data.full_name || data.fullName || '',
          email: data.email || '',
          phone: data.phone || '',
          avatar: data.profile_image || data.avatar_url || '',
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTwoFactorStatus = async () => {
    try {
      const res = await fetch('/api/user/two-factor/status', { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setTwoFactorEnabled(data.enabled);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploading(true);
    const formData = new FormData();
    formData.append('image', file);
    
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Authorization': getAuthHeaders().Authorization as string },
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.url) {
        const updateRes = await fetch('/api/user/profile', {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify({ profile_image: data.url }),
        });
        if (updateRes.ok) {
          setUser({ ...user, avatar: data.url });
          setMessage('Profile picture updated');
          setTimeout(() => setMessage(''), 3000);
        }
      }
    } catch (err: any) {
      setError(err.message);
      setTimeout(() => setError(''), 3000);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ full_name: user.name, email: user.email, phone: user.phone }),
      });
      if (res.ok) {
        setMessage(t('profileUpdated') || 'Profile updated successfully');
        setTimeout(() => setMessage(''), 3000);
      } else {
        const data = await res.json();
        throw new Error(data.error || 'Update failed');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError(t('passwordsDoNotMatch') || 'Passwords do not match');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setPasswordError(t('passwordMinLength') || 'Password must be at least 6 characters');
      return;
    }

    setPasswordLoading(true);
    setPasswordError('');
    setPasswordMessage('');

    try {
      const res = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          current_password: passwordForm.currentPassword,
          new_password: passwordForm.newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Password change failed');
      setPasswordMessage(t('passwordChanged') || 'Password changed successfully');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => {
        setShowPasswordModal(false);
        setPasswordMessage('');
      }, 2000);
    } catch (err: any) {
      setPasswordError(err.message);
    } finally {
      setPasswordLoading(false);
    }
  };

  const setupTwoFactor = async () => {
    setTwoFactorLoading(true);
    setTwoFactorMessage('');
    try {
      const res = await fetch('/api/user/two-factor/setup', {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Setup failed');
      setTwoFactorSecret(data.secret);
      setTwoFactorQrCode(data.qrCode);
      setBackupCodes(data.backupCodes || []);
      setShow2FAModal(true);
    } catch (err: any) {
      setTwoFactorMessage(err.message);
    } finally {
      setTwoFactorLoading(false);
    }
  };

  const verifyTwoFactor = async () => {
    if (!verificationCode) {
      setTwoFactorMessage('Please enter verification code');
      return;
    }
    setTwoFactorLoading(true);
    try {
      const res = await fetch('/api/user/two-factor/verify', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ secret: twoFactorSecret, code: verificationCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Verification failed');
      setTwoFactorEnabled(true);
      setShow2FAModal(false);
      setBackupCodes(data.backupCodes || []);
      setTwoFactorMessage('2FA enabled successfully!');
      setTimeout(() => setTwoFactorMessage(''), 3000);
    } catch (err: any) {
      setTwoFactorMessage(err.message);
    } finally {
      setTwoFactorLoading(false);
    }
  };

  const disableTwoFactor = async () => {
    if (!confirm('Disable two-factor authentication? This will reduce account security.')) return;
    setTwoFactorLoading(true);
    try {
      const res = await fetch('/api/user/two-factor/disable', {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Disable failed');
      setTwoFactorEnabled(false);
      setTwoFactorMessage('2FA disabled');
      setTimeout(() => setTwoFactorMessage(''), 3000);
    } catch (err: any) {
      setTwoFactorMessage(err.message);
    } finally {
      setTwoFactorLoading(false);
    }
  };

  const copyBackupCodes = () => {
    const codesText = backupCodes.join('\n');
    navigator.clipboard.writeText(codesText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      {/* Profile Header with Avatar */}
      <div style={{ 
        background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryDark})`, 
        borderRadius: '16px', 
        padding: '2rem',
        marginBottom: '2rem',
        color: 'white',
        textAlign: 'center',
        boxShadow: COLORS.shadowHover,
      }}>
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <div style={{
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            background: user.avatar ? `url(${user.avatar}) center/cover` : 'rgba(255,255,255,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto',
            border: '4px solid white',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          }}>
            {!user.avatar && <FontAwesomeIcon icon={faUser} size="3x" style={{ color: 'white' }} />}
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              position: 'absolute',
              bottom: '5px',
              right: '5px',
              background: 'white',
              border: 'none',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: COLORS.primary,
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <FontAwesomeIcon icon={faCamera} />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            style={{ display: 'none' }}
          />
        </div>
        <h2 style={{ marginTop: '1rem', marginBottom: '0.25rem', fontSize: '1.5rem' }}>{user.name}</h2>
        <p style={{ opacity: 0.9, marginBottom: 0 }}>{user.email} • {user.phone}</p>
        {uploading && <p style={{ fontSize: '0.8rem', marginTop: '0.5rem', opacity: 0.8 }}>Uploading...</p>}
      </div>

      {/* Profile Form */}
      <div style={{ 
        background: 'white', 
        padding: '1.5rem', 
        borderRadius: '12px', 
        marginBottom: '1.5rem',
        boxShadow: COLORS.shadow,
      }}>
        <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: COLORS.textPrimary }}>
          <FontAwesomeIcon icon={faUser} style={{ color: COLORS.primary }} /> Profile Information
        </h3>
        
        {message && (
          <div style={{ marginBottom: '1rem', padding: '12px', background: '#d1fae5', borderRadius: '8px', color: '#065f46', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FontAwesomeIcon icon={faCheckCircle} /> {message}
          </div>
        )}
        {error && (
          <div style={{ marginBottom: '1rem', padding: '12px', background: '#fee2e2', borderRadius: '8px', color: '#dc2626', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FontAwesomeIcon icon={faExclamationTriangle} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500', fontSize: '0.85rem', color: COLORS.textSecondary }}>
              {t('fullName') || 'Full Name'}
            </label>
            <input
              type="text"
              value={user.name}
              onChange={e => setUser({ ...user, name: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: `1px solid ${COLORS.border}`,
                borderRadius: '8px',
                fontSize: '0.9rem',
                transition: 'all 0.2s',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = COLORS.primary;
                e.currentTarget.style.boxShadow = `0 0 0 3px ${COLORS.primary}20`;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = COLORS.border;
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500', fontSize: '0.85rem', color: COLORS.textSecondary }}>
              {t('email') || 'Email'}
            </label>
            <input
              type="email"
              value={user.email}
              onChange={e => setUser({ ...user, email: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: `1px solid ${COLORS.border}`,
                borderRadius: '8px',
                fontSize: '0.9rem',
                transition: 'all 0.2s',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = COLORS.primary;
                e.currentTarget.style.boxShadow = `0 0 0 3px ${COLORS.primary}20`;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = COLORS.border;
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500', fontSize: '0.85rem', color: COLORS.textSecondary }}>
              {t('phone') || 'Phone'}
            </label>
            <input
              type="tel"
              value={user.phone}
              onChange={e => setUser({ ...user, phone: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: `1px solid ${COLORS.border}`,
                borderRadius: '8px',
                fontSize: '0.9rem',
                transition: 'all 0.2s',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = COLORS.primary;
                e.currentTarget.style.boxShadow = `0 0 0 3px ${COLORS.primary}20`;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = COLORS.border;
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
          </div>
          <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button
              type="submit"
              disabled={saving}
              style={{
                padding: '10px 20px',
                background: COLORS.primary,
                border: 'none',
                borderRadius: '8px',
                cursor: saving ? 'not-allowed' : 'pointer',
                color: 'white',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s',
                opacity: saving ? 0.6 : 1,
              }}
              onMouseEnter={(e) => {
                if (!saving) {
                  e.currentTarget.style.backgroundColor = COLORS.primaryDark;
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }
              }}
              onMouseLeave={(e) => {
                if (!saving) {
                  e.currentTarget.style.backgroundColor = COLORS.primary;
                  e.currentTarget.style.transform = 'translateY(0)';
                }
              }}
            >
              <FontAwesomeIcon icon={faSave} /> {saving ? (t('saving') || 'Saving...') : (t('saveChanges') || 'Save Changes')}
            </button>
            <button
              type="button"
              onClick={() => setShowPasswordModal(true)}
              style={{
                padding: '10px 20px',
                background: COLORS.bgGray,
                border: `1px solid ${COLORS.border}`,
                borderRadius: '8px',
                cursor: 'pointer',
                color: COLORS.textSecondary,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = COLORS.primary;
                e.currentTarget.style.color = COLORS.primary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = COLORS.border;
                e.currentTarget.style.color = COLORS.textSecondary;
              }}
            >
              <FontAwesomeIcon icon={faKey} /> {t('changePassword') || 'Change Password'}
            </button>
          </div>
        </form>
      </div>

      {/* 2FA Status Card */}
      <div style={{ 
        background: 'white', 
        padding: '1.5rem', 
        borderRadius: '12px',
        boxShadow: COLORS.shadow,
      }}>
        <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: COLORS.textPrimary }}>
          <FontAwesomeIcon icon={faShieldAlt} style={{ color: COLORS.primary }} /> Two-Factor Authentication
        </h3>
        <p style={{ color: COLORS.textMuted, marginBottom: '1rem', fontSize: '0.85rem' }}>
          Add an extra layer of security to your account.
        </p>
        <div style={{ 
          background: twoFactorEnabled ? '#d1fae5' : '#fef3c7', 
          padding: '1rem', 
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <strong style={{ color: twoFactorEnabled ? '#065f46' : '#92400e' }}>
              {twoFactorEnabled ? '✅ 2FA is ENABLED' : '⚠️ 2FA is DISABLED'}
            </strong>
            <p style={{ fontSize: '0.8rem', marginTop: '0.25rem', marginBottom: 0, color: COLORS.textSecondary }}>
              {twoFactorEnabled 
                ? 'Your account is protected with two-factor authentication.' 
                : 'Enable 2FA to add an extra layer of security to your account.'}
            </p>
          </div>
          {!twoFactorEnabled ? (
            <button
              onClick={setupTwoFactor}
              disabled={twoFactorLoading}
              style={{
                padding: '8px 16px',
                background: COLORS.primary,
                border: 'none',
                borderRadius: '6px',
                cursor: twoFactorLoading ? 'not-allowed' : 'pointer',
                color: 'white',
                fontWeight: '500',
                transition: 'all 0.2s',
                opacity: twoFactorLoading ? 0.6 : 1,
              }}
              onMouseEnter={(e) => {
                if (!twoFactorLoading) {
                  e.currentTarget.style.backgroundColor = COLORS.primaryDark;
                }
              }}
              onMouseLeave={(e) => {
                if (!twoFactorLoading) {
                  e.currentTarget.style.backgroundColor = COLORS.primary;
                }
              }}
            >
              {twoFactorLoading ? 'Loading...' : 'Enable 2FA'}
            </button>
          ) : (
            <button
              onClick={disableTwoFactor}
              disabled={twoFactorLoading}
              style={{
                padding: '8px 16px',
                background: COLORS.danger,
                border: 'none',
                borderRadius: '6px',
                cursor: twoFactorLoading ? 'not-allowed' : 'pointer',
                color: 'white',
                fontWeight: '500',
                transition: 'all 0.2s',
                opacity: twoFactorLoading ? 0.6 : 1,
              }}
              onMouseEnter={(e) => {
                if (!twoFactorLoading) {
                  e.currentTarget.style.backgroundColor = '#dc2626';
                }
              }}
              onMouseLeave={(e) => {
                if (!twoFactorLoading) {
                  e.currentTarget.style.backgroundColor = COLORS.danger;
                }
              }}
            >
              {twoFactorLoading ? 'Loading...' : 'Disable 2FA'}
            </button>
          )}
        </div>
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          backdropFilter: 'blur(4px)',
        }} onClick={() => setShowPasswordModal(false)}>
          <div style={{ 
            background: 'white', 
            padding: '24px', 
            borderRadius: '16px', 
            width: '450px', 
            maxWidth: '90%',
            boxShadow: COLORS.shadowHover,
            animation: 'slideUp 0.3s ease',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, color: COLORS.textPrimary }}>
                <FontAwesomeIcon icon={faKey} style={{ color: COLORS.primary, marginRight: '0.5rem' }} />
                {t('changePassword') || 'Change Password'}
              </h3>
              <button
                onClick={() => setShowPasswordModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: COLORS.textMuted,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = COLORS.textPrimary;
                  e.currentTarget.style.transform = 'rotate(90deg)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = COLORS.textMuted;
                  e.currentTarget.style.transform = 'rotate(0)';
                }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handlePasswordChange}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.85rem', color: COLORS.textSecondary }}>
                  {t('currentPassword') || 'Current Password'}
                </label>
                <div style={{ display: 'flex', alignItems: 'center', border: `1px solid ${COLORS.border}`, borderRadius: '8px', overflow: 'hidden' }}>
                  <input 
                    type={showCurrentPassword ? "text" : "password"} 
                    value={passwordForm.currentPassword} 
                    onChange={e => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} 
                    required 
                    style={{ flex: 1, padding: '10px 12px', border: 'none', outline: 'none', fontSize: '0.9rem' }} 
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)} 
                    style={{ background: 'none', border: 'none', padding: '0 10px', cursor: 'pointer', color: COLORS.textMuted }}
                  >
                    <FontAwesomeIcon icon={showCurrentPassword ? faEyeSlash : faEye} />
                  </button>
                </div>
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.85rem', color: COLORS.textSecondary }}>
                  {t('newPassword') || 'New Password'}
                </label>
                <div style={{ display: 'flex', alignItems: 'center', border: `1px solid ${COLORS.border}`, borderRadius: '8px', overflow: 'hidden' }}>
                  <input 
                    type={showNewPassword ? "text" : "password"} 
                    value={passwordForm.newPassword} 
                    onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} 
                    required 
                    minLength={6}
                    style={{ flex: 1, padding: '10px 12px', border: 'none', outline: 'none', fontSize: '0.9rem' }} 
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowNewPassword(!showNewPassword)} 
                    style={{ background: 'none', border: 'none', padding: '0 10px', cursor: 'pointer', color: COLORS.textMuted }}
                  >
                    <FontAwesomeIcon icon={showNewPassword ? faEyeSlash : faEye} />
                  </button>
                </div>
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.85rem', color: COLORS.textSecondary }}>
                  {t('confirmPassword') || 'Confirm Password'}
                </label>
                <input 
                  type="password" 
                  value={passwordForm.confirmPassword} 
                  onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} 
                  required 
                  style={{ width: '100%', padding: '10px 12px', border: `1px solid ${COLORS.border}`, borderRadius: '8px', fontSize: '0.9rem' }} 
                />
              </div>
              {passwordError && <div style={{ color: COLORS.danger, marginBottom: '1rem', fontSize: '0.875rem' }}>{passwordError}</div>}
              {passwordMessage && <div style={{ color: COLORS.success, marginBottom: '1rem', fontSize: '0.875rem' }}>{passwordMessage}</div>}
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  style={{
                    padding: '8px 16px',
                    background: COLORS.bgGray,
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: '6px',
                    cursor: 'pointer',
                    color: COLORS.textSecondary,
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = COLORS.border;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = COLORS.bgGray;
                  }}
                >
                  {t('cancel') || 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={passwordLoading}
                  style={{
                    padding: '8px 16px',
                    background: COLORS.primary,
                    border: 'none',
                    borderRadius: '6px',
                    cursor: passwordLoading ? 'not-allowed' : 'pointer',
                    color: 'white',
                    fontWeight: '500',
                    transition: 'all 0.2s',
                    opacity: passwordLoading ? 0.6 : 1,
                  }}
                  onMouseEnter={(e) => {
                    if (!passwordLoading) {
                      e.currentTarget.style.backgroundColor = COLORS.primaryDark;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!passwordLoading) {
                      e.currentTarget.style.backgroundColor = COLORS.primary;
                    }
                  }}
                >
                  {passwordLoading ? (t('saving') || 'Saving...') : (t('update') || 'Update')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2FA Setup Modal */}
      {show2FAModal && twoFactorSecret && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          backdropFilter: 'blur(4px)',
        }} onClick={() => setShow2FAModal(false)}>
          <div style={{ 
            background: 'white', 
            padding: '24px', 
            borderRadius: '16px', 
            width: '500px', 
            maxWidth: '90%', 
            maxHeight: '90vh', 
            overflowY: 'auto',
            boxShadow: COLORS.shadowHover,
            animation: 'slideUp 0.3s ease',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, color: COLORS.textPrimary }}>
                <FontAwesomeIcon icon={faQrcode} style={{ color: COLORS.primary, marginRight: '0.5rem' }} />
                {t('setup2fa') || 'Set up Two-Factor Authentication'}
              </h3>
              <button
                onClick={() => setShow2FAModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: COLORS.textMuted,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = COLORS.textPrimary;
                  e.currentTarget.style.transform = 'rotate(90deg)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = COLORS.textMuted;
                  e.currentTarget.style.transform = 'rotate(0)';
                }}
              >
                ×
              </button>
            </div>

            <p style={{ color: COLORS.textSecondary, fontSize: '0.9rem' }}>
              Scan the QR code with your authenticator app (Google Authenticator, Microsoft Authenticator, or Authy).
            </p>
            {twoFactorQrCode && (
              <div style={{ textAlign: 'center', margin: '1rem 0' }}>
                <img src={twoFactorQrCode} alt="2FA QR Code" style={{ width: '200px', height: '200px', border: `2px solid ${COLORS.border}`, borderRadius: '8px' }} />
              </div>
            )}
            <p style={{ fontWeight: '500', fontSize: '0.85rem', color: COLORS.textSecondary }}>Or enter this secret manually:</p>
            <code style={{ 
              display: 'block', 
              background: COLORS.bgGray, 
              padding: '8px 12px', 
              borderRadius: '6px', 
              wordBreak: 'break-all', 
              marginBottom: '1rem',
              fontFamily: 'monospace',
              fontSize: '0.85rem',
            }}>{twoFactorSecret}</code>
            {backupCodes.length > 0 && (
              <>
                <p style={{ fontWeight: '500', fontSize: '0.85rem', color: COLORS.textSecondary }}>
                  <FontAwesomeIcon icon={faCopy} style={{ marginRight: '0.5rem', color: COLORS.primary }} />
                  Backup codes (save these somewhere safe):
                </p>
                <div style={{ 
                  background: COLORS.bgGray, 
                  padding: '8px 12px', 
                  borderRadius: '6px', 
                  marginBottom: '1rem', 
                  position: 'relative',
                }}>
                  {backupCodes.map((code, i) => (
                    <div key={i} style={{ fontFamily: 'monospace', fontSize: '14px', padding: '2px 0' }}>{code}</div>
                  ))}
                  <button 
                    onClick={copyBackupCodes} 
                    style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      background: COLORS.primary,
                      border: 'none',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '11px',
                      color: 'white',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = COLORS.primaryDark;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = COLORS.primary;
                    }}
                  >
                    <FontAwesomeIcon icon={faCopy} /> {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </>
            )}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.85rem', color: COLORS.textSecondary }}>
                {t('verificationCode') || 'Verification Code'}
              </label>
              <input 
                type="text" 
                value={verificationCode} 
                onChange={e => setVerificationCode(e.target.value)} 
                placeholder="000000" 
                maxLength={6} 
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: '8px',
                  fontSize: '1rem',
                  textAlign: 'center',
                  transition: 'all 0.2s',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = COLORS.primary;
                  e.currentTarget.style.boxShadow = `0 0 0 3px ${COLORS.primary}20`;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = COLORS.border;
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>
            {twoFactorMessage && (
              <div style={{ 
                color: twoFactorMessage.includes('success') ? COLORS.success : COLORS.danger, 
                marginBottom: '1rem',
                padding: '8px 12px',
                background: twoFactorMessage.includes('success') ? '#d1fae5' : '#fee2e2',
                borderRadius: '6px',
                fontSize: '0.85rem',
              }}>
                {twoFactorMessage}
              </div>
            )}
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button
                type="button"
                onClick={() => setShow2FAModal(false)}
                style={{
                  padding: '8px 16px',
                  background: COLORS.bgGray,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: '6px',
                  cursor: 'pointer',
                  color: COLORS.textSecondary,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = COLORS.border;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = COLORS.bgGray;
                }}
              >
                {t('cancel') || 'Cancel'}
              </button>
              <button
                type="button"
                onClick={verifyTwoFactor}
                disabled={twoFactorLoading}
                style={{
                  padding: '8px 16px',
                  background: COLORS.primary,
                  border: 'none',
                  borderRadius: '6px',
                  cursor: twoFactorLoading ? 'not-allowed' : 'pointer',
                  color: 'white',
                  fontWeight: '500',
                  transition: 'all 0.2s',
                  opacity: twoFactorLoading ? 0.6 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!twoFactorLoading) {
                    e.currentTarget.style.backgroundColor = COLORS.primaryDark;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!twoFactorLoading) {
                    e.currentTarget.style.backgroundColor = COLORS.primary;
                  }
                }}
              >
                {twoFactorLoading ? (t('verifying') || 'Verifying...') : (t('verifyAndEnable') || 'Verify & Enable')}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid ${COLORS.border};
          border-top-color: ${COLORS.primary};
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}