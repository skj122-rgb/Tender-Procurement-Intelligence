import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/layout/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';

// Auth Pages
import Login from './pages/Login';
import Signup from './pages/Signup';
import OtpVerification from './pages/OtpVerification';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

// Main Pages
import Dashboard from './pages/Dashboard';
import DataCenter from './pages/DataCenter';
import Tenders from './pages/Tenders';
import TenderDetails from './pages/TenderDetails';
import Contractors from './pages/Contractors';
import ContractorDetails from './pages/ContractorDetails';
import RiskAnalysis from './pages/RiskAnalysis';
import CompareBidders from './pages/CompareBidders';
import Reports from './pages/Reports';
import Profile from './pages/Profile';

const App = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/verify-otp" element={<OtpVerification />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/data-center" element={<DataCenter />} />
          <Route path="/tenders" element={<Tenders />} />
          <Route path="/tenders/:id" element={<TenderDetails />} />
          <Route path="/contractors" element={<Contractors />} />
          <Route path="/contractors/:id" element={<ContractorDetails />} />
          <Route path="/risk-analysis" element={<RiskAnalysis />} />
          <Route path="/compare-bidders" element={<CompareBidders />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
      </Route>

      {/* Redirect root to dashboard */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      
      {/* Catch all */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default App;
