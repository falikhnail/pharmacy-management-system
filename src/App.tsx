import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import { toast } from 'sonner';
import Sidebar from './components/layout/Sidebar';
import Dashboard from './pages/Dashboard';
import Obat from './pages/Obat';
import Pasien from './pages/Pasien';
import Resep from './pages/Resep';
import Stok from './pages/Stok';
import Supplier from './pages/Supplier';
import Return from './pages/Return';
import Laporan from './pages/Laporan';
import User from './pages/User';
import Settings from './pages/Settings';
import Login from './pages/Login';
import POS from './pages/POS';
import Reports from './pages/Reports';
import DigitalPrescription from './pages/DigitalPrescription';
import PurchaseOrder from './pages/PurchaseOrder';
import SupplierPerformance from './pages/SupplierPerformance';
import ReorderSuggestions from './pages/ReorderSuggestions';
import StockOpname from './pages/StockOpname';
import { initializeBackupScheduler } from './lib/backup';
import { canAccessRoute } from './lib/permissions';
import { User as UserType } from './types';
import './App.css';

// Protected Route Component
interface ProtectedRouteProps {
  children: React.ReactNode;
  currentUser: UserType | null;
  requiredPath: string;
}

function ProtectedRoute({ children, currentUser, requiredPath }: ProtectedRouteProps) {
  const location = useLocation();
  
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  
  if (!canAccessRoute(currentUser, requiredPath)) {
    toast.error('Anda tidak memiliki akses ke halaman ini');
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
}

function AppContent() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);

  useEffect(() => {
    // Check if user is logged in
    const loggedInUser = localStorage.getItem('currentUser');
    if (loggedInUser) {
      setCurrentUser(JSON.parse(loggedInUser));
      setIsAuthenticated(true);
    }

    // Initialize backup scheduler
    if (loggedInUser) {
      initializeBackupScheduler();
    }
  }, []);

  const handleLogin = (user: UserType) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    localStorage.setItem('currentUser', JSON.stringify(user));
    
    // Initialize backup scheduler after login
    initializeBackupScheduler();
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('currentUser');
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar currentUser={currentUser} onLogout={handleLogout} />
      <main className="flex-1 overflow-y-auto p-8">
        <Routes>
          {/* Dashboard - accessible to all */}
          <Route path="/" element={<Dashboard />} />
          
          {/* Sales/POS routes - Kasir and Admin */}
          <Route 
            path="/pos" 
            element={
              <ProtectedRoute currentUser={currentUser} requiredPath="/pos">
                <POS />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/stok" 
            element={
              <ProtectedRoute currentUser={currentUser} requiredPath="/stok">
                <Stok />
              </ProtectedRoute>
            } 
          />
          
          {/* Inventory/Medicine routes - Apoteker and Admin */}
          <Route 
            path="/obat" 
            element={
              <ProtectedRoute currentUser={currentUser} requiredPath="/obat">
                <Obat />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/stock-opname" 
            element={
              <ProtectedRoute currentUser={currentUser} requiredPath="/stock-opname">
                <StockOpname />
              </ProtectedRoute>
            } 
          />
          
          {/* Admin-only routes */}
          <Route 
            path="/pasien" 
            element={
              <ProtectedRoute currentUser={currentUser} requiredPath="/pasien">
                <Pasien />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/resep" 
            element={
              <ProtectedRoute currentUser={currentUser} requiredPath="/resep">
                <Resep />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/digital-prescription" 
            element={
              <ProtectedRoute currentUser={currentUser} requiredPath="/digital-prescription">
                <DigitalPrescription />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/supplier" 
            element={
              <ProtectedRoute currentUser={currentUser} requiredPath="/supplier">
                <Supplier />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/purchase-order" 
            element={
              <ProtectedRoute currentUser={currentUser} requiredPath="/purchase-order">
                <PurchaseOrder />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/supplier-performance" 
            element={
              <ProtectedRoute currentUser={currentUser} requiredPath="/supplier-performance">
                <SupplierPerformance />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/reorder-suggestions" 
            element={
              <ProtectedRoute currentUser={currentUser} requiredPath="/reorder-suggestions">
                <ReorderSuggestions />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/return" 
            element={
              <ProtectedRoute currentUser={currentUser} requiredPath="/return">
                <Return />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/laporan" 
            element={
              <ProtectedRoute currentUser={currentUser} requiredPath="/laporan">
                <Laporan />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/reports" 
            element={
              <ProtectedRoute currentUser={currentUser} requiredPath="/reports">
                <Reports />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/user" 
            element={
              <ProtectedRoute currentUser={currentUser} requiredPath="/user">
                <User />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/settings" 
            element={
              <ProtectedRoute currentUser={currentUser} requiredPath="/settings">
                <Settings />
              </ProtectedRoute>
            } 
          />
          
          {/* Catch all - redirect to dashboard */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
      <Toaster position="top-right" />
    </Router>
  );
}

export default App;