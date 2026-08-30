import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import apiClient from '../api/client';

const OtpVerification = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const { userId, email, emailOtp: devEmailOtp } = location.state || {};

  const [emailOtp, setEmailOtp] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) {
      navigate('/login');
    }
  }, [userId, navigate]);

  const handleAutoFill = () => {
    if (devEmailOtp) {
      setEmailOtp(devEmailOtp);
      setError('');
    }
  };

  const handleVerify = async (e) => {
    if (e) e.preventDefault();
    if (!emailOtp || emailOtp.length !== 6) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await apiClient.post('/auth/verify-email-otp', { userId, otp: emailOtp });
      setIsVerified(true);
      setTimeout(() => {
        navigate('/login', { 
          state: { message: '✓ Account successfully verified and activated. Please log in.' } 
        });
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 bg-white p-8 sm:p-10 rounded-2xl shadow-sm border border-slate-200">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600 text-white text-2xl mb-3 shadow-sm">
            ✉️
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Email Verification
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Enter the 6-digit verification code sent to <strong className="text-slate-700">{email || 'your email address'}</strong>.
          </p>
        </div>

        {/* Local Dev / Testing Helper Banner */}
        {devEmailOtp && (
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1">
                <span>⚡</span> Verification Code
              </span>
              <button
                type="button"
                onClick={handleAutoFill}
                className="text-[11px] font-bold text-blue-700 hover:text-blue-900 bg-white px-2.5 py-1 rounded-lg border border-amber-200 shadow-xs"
              >
                Auto-Fill Code
              </button>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono font-bold">
              <span className="text-slate-600">Code:</span>
              <span className="bg-white px-2.5 py-1 rounded border border-amber-200 text-blue-700 text-sm">
                {devEmailOtp}
              </span>
            </div>
          </div>
        )}

        {isVerified && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-xs font-bold text-center animate-in fade-in">
            ✓ Account verified successfully! Redirecting to login...
          </div>
        )}

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded-r-xl text-xs font-semibold text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-2">
              6-Digit Email OTP
            </label>
            <input
              type="text"
              maxLength="6"
              disabled={isVerified}
              value={emailOtp}
              onChange={(e) => {
                setEmailOtp(e.target.value.trim());
                if (error) setError('');
              }}
              placeholder="123456"
              className="w-full px-4 py-3 border border-slate-300 rounded-xl font-mono text-center text-lg font-bold tracking-widest focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-slate-100 shadow-xs"
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={isVerified || loading || !emailOtp}
              className={`w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm transition text-xs uppercase tracking-wider ${
                (isVerified || loading || !emailOtp) ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading ? 'Verifying Code...' : isVerified ? 'Verified ✓' : 'Verify & Activate Account'}
            </button>
          </div>
        </form>

        <div className="pt-4 border-t border-slate-100 text-center text-xs space-y-2">
          <p className="text-slate-400 text-[11px]">
            To deliver real emails to your Gmail inbox, configure Gmail App Password in <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">backend/.env</code>.
          </p>
          <div>
            <Link to="/login" className="font-bold text-blue-600 hover:underline">
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OtpVerification;
