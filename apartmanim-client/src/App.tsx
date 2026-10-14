import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './pages/Login';
import { DashboardPage } from './pages/Dashboard';
import { AnnouncementsPage } from './pages/Announcements';
import { DuesPage } from './pages/Dues';
import { MaintenancePage } from './pages/Maintenance';
import type { ReactNode } from 'react';
import './App.css';

// ============================================
// KORUNAN ROTA — Giriş yapılmamışsa yönlendir
// ============================================
function PrivateRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

// ============================================
// UYGULAMA ROUTER'I
// ============================================
function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Giriş sayfası */}
      <Route
        path="/login"
        element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />
        }
      />

      {/* Korunan sayfalar */}
      <Route path="/dashboard"     element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
      <Route path="/announcements" element={<PrivateRoute><AnnouncementsPage /></PrivateRoute>} />
      <Route path="/dues"          element={<PrivateRoute><DuesPage /></PrivateRoute>} />
      <Route path="/maintenance"   element={<PrivateRoute><MaintenancePage /></PrivateRoute>} />

      {/* Varsayılan yönlendirme */}
      <Route
        path="/"
        element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />}
      />
      <Route
        path="*"
        element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />}
      />
    </Routes>
  );
}

// ============================================
// KÖK BİLEŞEN
// ============================================
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
