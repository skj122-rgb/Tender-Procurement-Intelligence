import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { post } from '../api/client';

const ResetPassword = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const identifier = location.state?.identifier || '';

  const [emailOtp, setEmailOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    try {
      await post('/auth/reset-password', { identifier, emailOtp, newPassword, confirmPassword });
      navigate('/login', { state: { message: '✓ Password reset successful. Please login with your new password.' } });
    } catch (err) {
      setError(err.response?.data?.message || 'Error resetting password. Please check your verification code.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-md border border-gray-100">
        <h2 className="text-center text-3xl font-extrabold text-gray-900">Set New Password</h2>
        
        {error && <div className="bg-red-50 text-red-700 p-3 rounded text-xs font-semibold">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">Email Verification Code (OTP)</label>
            <input 
              type="text" 
              required 
              maxLength={6}
              placeholder="6-digit verification code"
              className="mt-1 block w-full px-3 py-2 border rounded-lg text-sm font-mono focus:ring-blue-500 focus:border-blue-500" 
              value={emailOtp} 
              onChange={e => setEmailOtp(e.target.value)} 
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">New Password</label>
            <input 
              type="password" 
              required 
              placeholder="Enter new password"
              className="mt-1 block w-full px-3 py-2 border rounded-lg text-sm" 
              value={newPassword} 
              onChange={e => setNewPassword(e.target.value)} 
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">Confirm Password</label>
            <input 
              type="password" 
              required 
              placeholder="Confirm new password"
              className="mt-1 block w-full px-3 py-2 border rounded-lg text-sm" 
              value={confirmPassword} 
              onChange={e => setConfirmPassword(e.target.value)} 
            />
          </div>
          <button type="submit" className="w-full py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition">
            Reset Password
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
