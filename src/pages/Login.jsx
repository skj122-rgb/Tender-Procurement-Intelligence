import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

const Login = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!identifier || !password) {
      setError('Please enter both identifier and password.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await login(identifier, password);
      navigate('/dashboard');
    } catch (err) {
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.message === 'Network Error' || !err.response) {
        setError('Cannot connect to backend server. Please ensure the backend (port 3000) and database are running.');
      } else {
        setError('Login failed. Please check your credentials and server connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-primary-900 via-slate-800 to-slate-900 py-12 px-4 sm:px-6 lg:px-8">
    <div className="max-w-md w-full space-y-8 bg-white/95 backdrop-blur-sm p-10 rounded-xl shadow-dossier border border-white/20">
        <div>
          <div className="flex justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="w-16 h-16 text-primary-800"
            >
              <path
                d="M12 2.25c-.14 0-.28.03-.4.1L4.2 5.85a1.5 1.5 0 0 0-.83 1.34v5.5c0 5.16 3.32 9.6 8.4 11.06.14.04.28.04.42 0 5.08-1.46 8.4-5.9 8.4-11.06v-5.5a1.5 1.5 0 0 0-.83-1.34L12.4 2.35a.9.9 0 0 0-.4-.1Z"
                fill="currentColor"
                fillOpacity="0.08"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 2.25c-.14 0-.28.03-.4.1L4.2 5.85a1.5 1.5 0 0 0-.83 1.34v5.5c0 5.16 3.32 9.6 8.4 11.06.14.04.28.04.42 0 5.08-1.46 8.4-5.9 8.4-11.06v-5.5a1.5 1.5 0 0 0-.83-1.34L12.4 2.35a.9.9 0 0 0-.4-.1Z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m9 12 2 2 4-4.5"
              />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-3xl font-heading font-bold text-primary-900 tracking-tight">
            Government Procurement Intel
          </h2>
          <p className="mt-2 text-center text-sm text-gray-500">
            Sign in to your account
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
           <div className="relative">
  <label htmlFor="identifier" className="sr-only">Unique ID / Username / Email</label>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
  </svg>
  <input
    id="identifier"
    name="identifier"
    type="text"
    required
    className="appearance-none rounded-none relative block w-full pl-10 pr-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
    placeholder="Unique ID / Username / Email"
    value={identifier}
    onChange={(e) => setIdentifier(e.target.value)}
  />
</div>
            <div className="relative">
  <label htmlFor="password" className="sr-only">Password</label>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
  </svg>
  <input
    id="password"
    name="password"
    type="password"
    required
    className="appearance-none rounded-none relative block w-full pl-10 pr-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
    placeholder="Password"
    value={password}
    onChange={(e) => setPassword(e.target.value)}
  />
</div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm">
              <Link to="/forgot-password" className="font-medium text-primary-600 hover:text-primary-500">
                Forgot your password?
              </Link>
            </div>
          </div>

          <div>
           <button
  type="submit"
  disabled={loading}
  className={`group relative w-full flex items-center justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-800 hover:bg-primary-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
>
  {loading && (
    <svg
      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      ></circle>
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      ></path>
    </svg>
  )}
  {loading ? 'Signing in...' : 'Sign in'}
</button>
          </div>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or</span>
            </div>
          </div>

          <div className="mt-6 text-center">
            <Link to="/signup" className="font-medium text-primary-600 hover:text-primary-500">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;