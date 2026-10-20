import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, ArrowRight, RotateCw, AlertCircle, Loader2, ArrowLeft } from 'lucide-react';

export const OtpForm: React.FC = () => {
  const {
    pendingOtpEmail,
    pendingOtpPurpose,
    verifyOtp,
    resendOtp,
    setAuthModalView,
  } = useAuth();

  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(60);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // 60-second cooldown timer
  useEffect(() => {
    if (countdown <= 0) return;
    const interval = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [countdown]);

  // Focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, val: string) => {
    // Only allow single numeric digit
    const cleaned = val.replace(/\D/g, '');
    if (!cleaned) {
      const updated = [...digits];
      updated[index] = '';
      setDigits(updated);
      return;
    }

    const char = cleaned.slice(-1);
    const updated = [...digits];
    updated[index] = char;
    setDigits(updated);

    // Advance focus
    if (index < 5 && char) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const updated = [...digits];
    for (let i = 0; i < 6; i++) {
      updated[i] = pasted[i] || '';
    }
    setDigits(updated);

    const nextFocusIndex = Math.min(pasted.length, 5);
    inputRefs.current[nextFocusIndex]?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = digits.join('');

    if (otpCode.length !== 6) {
      setError('Please enter all 6 digits of your verification code.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await verifyOtp({
        email: pendingOtpEmail,
        otp: otpCode,
        purpose: pendingOtpPurpose,
      });
    } catch (err: any) {
      setError(err?.message || 'Verification failed. Please check the code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || resending) return;

    setResending(true);
    setError('');

    try {
      await resendOtp({
        email: pendingOtpEmail,
        purpose: pendingOtpPurpose,
      });
      setCountdown(60);
      setDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      setError(err?.message || 'Failed to resend code. Please try again later.');
    } finally {
      setResending(false);
    }
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <div className="auth-header">
        <div className="otp-icon-badge">
          <ShieldCheck size={28} />
        </div>
        <h3>Verify Security Code</h3>
        <p>
          We sent a 6-digit confirmation code to{' '}
          <strong className="highlight-email">{pendingOtpEmail || 'your email'}</strong>
        </p>
      </div>

      {error && (
        <div className="auth-alert error">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      <div className="otp-boxes-container" onPaste={handlePaste}>
        {digits.map((digit, idx) => (
          <input
            key={idx}
            ref={(el) => {
              inputRefs.current[idx] = el;
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            className={`otp-digit-box ${digit ? 'filled' : ''}`}
            value={digit}
            onChange={(e) => handleChange(idx, e.target.value)}
            onKeyDown={(e) => handleKeyDown(idx, e)}
            disabled={loading}
            aria-label={`Digit ${idx + 1}`}
          />
        ))}
      </div>

      <button type="submit" className="auth-submit-btn" disabled={loading || digits.join('').length < 6}>
        {loading ? (
          <>
            <Loader2 className="spinner" size={18} />
            Verifying Code...
          </>
        ) : (
          <>
            Verify & Continue
            <ArrowRight size={18} />
          </>
        )}
      </button>

      <div className="resend-container">
        {countdown > 0 ? (
          <p className="cooldown-text">
            Resend available in <span className="timer-badge">{countdown}s</span>
          </p>
        ) : (
          <button
            type="button"
            className="resend-action-btn"
            onClick={handleResend}
            disabled={resending}
          >
            {resending ? (
              <Loader2 className="spinner" size={14} />
            ) : (
              <RotateCw size={14} />
            )}
            Resend Verification Code
          </button>
        )}
      </div>

      <div className="auth-switch-footer">
        <button
          type="button"
          className="back-btn"
          onClick={() => setAuthModalView(pendingOtpPurpose === 'PASSWORD_RESET' ? 'forgot' : 'login')}
        >
          <ArrowLeft size={16} />
          Back to {pendingOtpPurpose === 'PASSWORD_RESET' ? 'Forgot Password' : 'Sign In'}
        </button>
      </div>
    </form>
  );
};
