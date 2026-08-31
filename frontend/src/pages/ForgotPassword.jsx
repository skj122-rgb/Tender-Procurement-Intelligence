import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { post } from '../api/client';

const ForgotPassword = () => {
  const [step, setStep] = useState(1);
  const [identifier, setIdentifier] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSendOtp = async (e) => {
    e.preventDefault();
    try {
      await post('/auth/forgot-password', { identifier });
      navigate('/reset-password', { state: { identifier } });
    } catch (err) {
      setError(err.response?.data?.message || 'Error sending reset instructions.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-md border border-gray-100">
        <h2 className="text-center text-3xl font-extrabold text-gray-900">Reset Password</h2>
        
        {error && <div className="bg-red-50 text-red-700 p-3 rounded">{error}</div>}

        <form onSubmit={handleSendOtp} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Username, Email or Unique ID</label>
            <input type="text" required className="mt-1 block w-full px-3 py-2 border rounded-md" value={identifier} onChange={e => setIdentifier(e.target.value)} />
          </div>
          <button type="submit" className="w-full py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition">
            Send Verification Code
          </button>
        </form>
        <div className="text-center">
          <Link to="/login" className="text-sm font-medium text-blue-600 hover:text-blue-500">Back to login</Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
