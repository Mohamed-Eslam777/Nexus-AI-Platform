import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { SocketProvider } from './context/SocketContext';

// --- 1. استدعاء الكومبوننت الجديد ---
import ProtectedRoute from './components/ProtectedRoute'; // (عدل المسار لو حطيته في مكان تاني)
import ScrollToTop from './components/ScrollToTop';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import AdminPage from './pages/AdminPage';
import TaskPage from './pages/TaskPage';
import ProfilePage from './pages/ProfilePage';
import RegisterPage from './pages/RegisterPage';
import ApplicationPage from './pages/ApplicationPage';
import WalletPage from './pages/WalletPage';
import AboutUs from './pages/AboutUs';
import Analytics from './pages/Analytics';
import UserManagementPage from './pages/UserManagementPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import NotificationsPage from './pages/NotificationsPage';
import AuditLogPage from './pages/AuditLogPage';
import QualificationCenterPage from './pages/QualificationCenterPage';
import QualificationTestPage from './pages/QualificationTestPage';

function AppContent() {
  const { dir } = useLanguage();

  return (
    <div className="App min-h-screen bg-gray-100" dir={dir}>
      <ScrollToTop />
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={dir === 'rtl'}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        toastClassName="bg-slate-800/90 backdrop-blur-xl text-slate-300 rounded-xl shadow-lg border border-slate-700/50"
        bodyClassName="text-sm font-medium"
      />

        <Navbar />
        <Routes>
        
        {/* --- المسارات العامة (متاحة لأي حد) --- */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
        <Route path="/about" element={<AboutUs />} />
        
        {/* ملحوظة: لو صفحة "ApplicationPage" لازم يكون مسجل دخول عشان يقدم،
          حطها هي كمان جوه <ProtectedRoute> زي اللي تحت.
          لو هي صفحة عامة، سيبها زي ما هي.
        */}
        <Route path="/apply" element={<ApplicationPage />} />


        {/* --- 2. المسارات المحمية (للي مسجل دخول بس) --- */}
        
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute>
              <AdminPage />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/task/:id" 
          element={
            <ProtectedRoute>
              <TaskPage />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/wallet" 
          element={
            <ProtectedRoute>
              <WalletPage />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/analytics" 
          element={
            <ProtectedRoute>
              <Analytics />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/admin/users" 
          element={
            <ProtectedRoute>
              <UserManagementPage />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/notifications" 
          element={
            <ProtectedRoute>
              <NotificationsPage />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/admin/audit-logs" 
          element={
            <ProtectedRoute>
              <AuditLogPage />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/qualification-center" 
          element={
            <ProtectedRoute>
              <QualificationCenterPage />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/qualification/test/:id" 
          element={
            <ProtectedRoute>
              <QualificationTestPage />
            </ProtectedRoute>
          } 
        />

      </Routes>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <LanguageProvider>
      <SocketProvider>
        <AppContent />
      </SocketProvider>
    </LanguageProvider>
  );
}

export default App;