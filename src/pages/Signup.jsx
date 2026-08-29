import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

const Signup = () => {
  const [formData, setFormData] = useState({
    uniqueId: `OFF-${Math.floor(1000 + Math.random() * 9000)}`,
    username: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: ''
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear specific field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateClient = () => {
    const errors = {};

    if (!formData.username || formData.username.trim().length < 2) {
      errors.username = 'Username must be at least 2 characters.';
    }

    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = 'Please enter a valid email address (e.g. name@department.gov.in).';
    }

    const cleanPhone = formData.phoneNumber.replace(/[\s\-\(\)]/g, '');
    if (!cleanPhone || !/^(\+?\d{10,15})$/.test(cleanPhone)) {
      errors.phoneNumber = 'Phone number must contain 10 to 15 digits (e.g. 9876543210).';
    }

    if (!formData.password || formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters long.';
    }

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError('');
    setFieldErrors({});

    // 1. Client-Side Field Validation
    const clientErrors = validateClient();
    if (Object.keys(clientErrors).length > 0) {
      setFieldErrors(clientErrors);
      setGeneralError('Please correct the highlighted errors below before proceeding.');
      return;
    }

    setLoading(true);
    try {
      const cleanPhone = formData.phoneNumber.replace(/[\s\-\(\)]/g, '');
      const response = await signup({
        uniqueId: formData.uniqueId.trim(),
        username: formData.username.trim(),
        email: formData.email.trim().toLowerCase(),
        phoneNumber: cleanPhone,
        password: formData.password
      });

      navigate('/verify-otp', {
        state: {
          userId: response.userId || formData.username,
          email: formData.email,
          emailOtp: response.emailOtp
        }
      });
    } catch (err) {
      const data = err.response?.data;
      const backendErrors = data?.errors || data?.error;

      if (Array.isArray(backendErrors) && backendErrors.length > 0) {
        const mappedErrors = {};
        const messages = [];

        backendErrors.forEach(errItem => {
          const field = errItem.field || errItem.path;
          const msg = errItem.message || 'Invalid input value';
          if (field) {
            mappedErrors[field] = msg;
          }
          messages.push(msg);
        });

        setFieldErrors(mappedErrors);
        setGeneralError(`Validation failed on: ${messages.join(' • ')}`);
      } else if (typeof backendErrors === 'object' && backendErrors !== null) {
        setFieldErrors(backendErrors);
        setGeneralError(data?.message || 'Validation failed. Check highlighted fields.');
      } else {
        setGeneralError(data?.message || 'Failed to create account. Please check your details.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 bg-white p-8 sm:p-10 rounded-2xl shadow-sm border border-slate-200">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600 text-white text-2xl mb-3 shadow-sm">
            🛡️
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Create Officer Account
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            National Procurement Intelligence & Oversight Platform
          </p>
        </div>

        {generalError && (
          <div className="bg-red-50 border-l-4 border-red-500 p-3.5 rounded-r-xl">
            <div className="flex items-start">
              <span className="text-red-500 font-bold mr-2 text-sm">⚠️</span>
              <p className="text-xs font-semibold text-red-800 leading-relaxed">{generalError}</p>
            </div>
          </div>
        )}

        <form className="space-y-4 text-xs" onSubmit={handleSubmit}>
          {/* Unique Officer ID */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="font-bold text-slate-700 uppercase tracking-wider">Officer Unique ID</label>
              <span className="text-[10px] text-slate-400 font-mono">Auto-Generated / Editable</span>
            </div>
            <input
              type="text"
              name="uniqueId"
              className={`w-full px-3.5 py-2.5 border rounded-xl font-mono text-xs focus:outline-none focus:ring-2 ${
                fieldErrors.uniqueId ? 'border-red-400 focus:ring-red-300 bg-red-50/30' : 'border-slate-300 focus:ring-blue-500'
              }`}
              value={formData.uniqueId}
              onChange={handleChange}
              placeholder="e.g. OFF-8821"
            />
            {fieldErrors.uniqueId && (
              <p className="text-[11px] text-red-600 font-semibold mt-1">✗ {fieldErrors.uniqueId}</p>
            )}
          </div>

          {/* Username */}
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Username</label>
            <input
              type="text"
              name="username"
              required
              className={`w-full px-3.5 py-2.5 border rounded-xl text-xs focus:outline-none focus:ring-2 ${
                fieldErrors.username ? 'border-red-400 focus:ring-red-300 bg-red-50/30' : 'border-slate-300 focus:ring-blue-500'
              }`}
              value={formData.username}
              onChange={handleChange}
              placeholder="e.g. officer_kumar"
            />
            {fieldErrors.username && (
              <p className="text-[11px] text-red-600 font-semibold mt-1">✗ {fieldErrors.username}</p>
            )}
          </div>

          {/* Email Address */}
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Official Email Address</label>
            <input
              type="email"
              name="email"
              required
              className={`w-full px-3.5 py-2.5 border rounded-xl text-xs focus:outline-none focus:ring-2 ${
                fieldErrors.email ? 'border-red-400 focus:ring-red-300 bg-red-50/30' : 'border-slate-300 focus:ring-blue-500'
              }`}
              value={formData.email}
              onChange={handleChange}
              placeholder="officer@department.gov.in"
            />
            {fieldErrors.email && (
              <p className="text-[11px] text-red-600 font-semibold mt-1">✗ {fieldErrors.email}</p>
            )}
          </div>

          {/* Phone Number */}
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Mobile Phone Number (10 Digits)</label>
            <input
              type="tel"
              name="phoneNumber"
              required
              className={`w-full px-3.5 py-2.5 border rounded-xl text-xs focus:outline-none focus:ring-2 ${
                fieldErrors.phoneNumber ? 'border-red-400 focus:ring-red-300 bg-red-50/30' : 'border-slate-300 focus:ring-blue-500'
              }`}
              value={formData.phoneNumber}
              onChange={handleChange}
              placeholder="e.g. 9876543210"
            />
            {fieldErrors.phoneNumber && (
              <p className="text-[11px] text-red-600 font-semibold mt-1">✗ {fieldErrors.phoneNumber}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Password (Min 6 Chars)</label>
            <input
              type="password"
              name="password"
              required
              className={`w-full px-3.5 py-2.5 border rounded-xl text-xs focus:outline-none focus:ring-2 ${
                fieldErrors.password ? 'border-red-400 focus:ring-red-300 bg-red-50/30' : 'border-slate-300 focus:ring-blue-500'
              }`}
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
            />
            {fieldErrors.password && (
              <p className="text-[11px] text-red-600 font-semibold mt-1">✗ {fieldErrors.password}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              required
              className={`w-full px-3.5 py-2.5 border rounded-xl text-xs focus:outline-none focus:ring-2 ${
                fieldErrors.confirmPassword ? 'border-red-400 focus:ring-red-300 bg-red-50/30' : 'border-slate-300 focus:ring-blue-500'
              }`}
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="••••••••"
            />
            {fieldErrors.confirmPassword && (
              <p className="text-[11px] text-red-600 font-semibold mt-1">✗ {fieldErrors.confirmPassword}</p>
            )}
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-4 border border-transparent rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition ${
                loading ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {loading ? 'Creating Account & Sending OTP...' : 'Create Account →'}
            </button>
          </div>
        </form>

        <div className="pt-4 border-t border-slate-100 text-center text-xs">
          <span className="text-slate-500">Already registered? </span>
          <Link to="/login" className="font-bold text-blue-600 hover:underline">
            Sign In to Platform
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;
