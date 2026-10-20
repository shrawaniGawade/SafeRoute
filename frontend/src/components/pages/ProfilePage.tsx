import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Lock,
  CheckCircle2,
  Save,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { fetchUserProfile, updateUserProfile } from '../../services/api';
import './ProfilePage.css';

export const ProfilePage: React.FC = () => {
  const { user, showToast } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [defaultPreset, setDefaultPreset] = useState<'night' | 'commute' | 'maximum' | 'custom'>('night');
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Password Change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        setLoadingProfile(true);
        const data = await fetchUserProfile();
        if (isMounted && data) {
          setName(data.name || '');
          setEmergencyPhone(data.emergencyContact || '');
          if (data.defaultPreset) {
            setDefaultPreset(data.defaultPreset);
          }
        }
      } catch (err) {
        console.warn('Could not load remote profile, using session defaults:', err);
      } finally {
        if (isMounted) setLoadingProfile(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Name cannot be empty.', 'error');
      return;
    }

    try {
      setSavingProfile(true);
      await updateUserProfile({
        name: name.trim(),
        emergencyContact: emergencyPhone.trim(),
        defaultPreset,
      });
      setSavedSuccess(true);
      showToast('Profile preferences updated successfully!', 'success');
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      showToast(err?.message || 'Failed to update profile.', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('Please fill out all password fields.');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('New password must contain at least 8 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    try {
      setSavingPassword(true);
      await updateUserProfile({
        currentPassword,
        newPassword,
        confirmPassword,
      });

      setPasswordSuccess('Password successfully updated! Your active session is protected.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showToast('Password updated successfully.', 'success');
    } catch (err: any) {
      setPasswordError(err?.message || 'Failed to update password. Verify your current password.');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="profile-page-container">
      {/* Profile Overview Card */}
      <div className="profile-card">
        <div className="profile-header-row">
          <div className="profile-avatar-large">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="profile-title-meta">
            <h2>{user?.name || 'Verified Commuter'}</h2>
            <p>Member since October 2026 &bull; Account Verified &bull; Role: <strong>{user?.role || 'User'}</strong></p>
          </div>
        </div>

        {loadingProfile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0d9488', fontSize: '13px', marginBottom: '12px' }}>
            <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
            <span>Synchronizing profile from database...</span>
          </div>
        )}

        <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="profile-fields-grid">
            <div className="profile-field-group">
              <label htmlFor="prof-name">Full Name</label>
              <input
                id="prof-name"
                type="text"
                className="profile-field-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="profile-field-group">
              <label htmlFor="prof-email">Email Address</label>
              <input
                id="prof-email"
                type="email"
                className="profile-field-input"
                value={user?.email || 'user@saferoute.com'}
                disabled
                title="Email address cannot be changed directly"
              />
            </div>

            <div className="profile-field-group">
              <label htmlFor="prof-phone">Emergency Contact Phone</label>
              <input
                id="prof-phone"
                type="tel"
                className="profile-field-input"
                value={emergencyPhone}
                onChange={(e) => setEmergencyPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
              />
            </div>

            <div className="profile-field-group">
              <label htmlFor="prof-preset">Default Safety Profile</label>
              <select
                id="prof-preset"
                className="profile-field-input"
                value={defaultPreset}
                onChange={(e) => setDefaultPreset(e.target.value as 'night' | 'commute' | 'maximum' | 'custom')}
              >
                <option value="night">🌙 Night Corridor (Maximum Lighting)</option>
                <option value="commute">⚡ Fast & Safe (Balanced)</option>
                <option value="maximum">👥 Maximum Crowd Density</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <button type="submit" className="profile-save-btn" disabled={savingProfile}>
              {savingProfile ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={16} />}
              <span>{savingProfile ? 'Saving...' : 'Save Preferences'}</span>
            </button>
            {savedSuccess && (
              <span style={{ fontSize: '13px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle2 size={16} /> Preferences Saved
              </span>
            )}
          </div>
        </form>
      </div>

      {/* Password & Security Card */}
      <div className="profile-card">
        <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: '0 0 6px' }}>
          Account Security & Credentials
        </h3>
        <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 16px' }}>
          Manage your password and authentication tokens.
        </p>

        <div className="security-badge-row">
          <ShieldCheck size={24} color="#0d9488" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
              Two-Factor OTP Verification Active
            </div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>
              Your account utilizes 6-digit numeric email verification and Refresh Token Rotation (RTR).
            </div>
          </div>
        </div>

        <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '10px' }}>
          {passwordError && (
            <div style={{ padding: '10px 14px', borderRadius: '8px', background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={16} />
              <span>{passwordError}</span>
            </div>
          )}

          {passwordSuccess && (
            <div style={{ padding: '10px 14px', borderRadius: '8px', background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={16} />
              <span>{passwordSuccess}</span>
            </div>
          )}

          <div className="profile-fields-grid">
            <div className="profile-field-group">
              <label htmlFor="curr-pass">Current Password</label>
              <input
                id="curr-pass"
                type="password"
                className="profile-field-input"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
              />
            </div>

            <div className="profile-field-group">
              <label htmlFor="new-pass">New Password</label>
              <input
                id="new-pass"
                type="password"
                className="profile-field-input"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 8 characters"
              />
            </div>
          </div>

          <div className="profile-field-group" style={{ maxWidth: '400px' }}>
            <label htmlFor="confirm-new-pass">Confirm New Password</label>
            <input
              id="confirm-new-pass"
              type="password"
              className="profile-field-input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
            />
          </div>

          <button type="submit" className="profile-save-btn" style={{ background: '#0f172a' }} disabled={savingPassword}>
            {savingPassword ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Lock size={16} />}
            <span>{savingPassword ? 'Updating...' : 'Update Password'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
