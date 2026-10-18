import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './pages/Login';
import { DashboardPage } from './pages/Dashboard';
import { AnnouncementsPage } from './pages/Announcements';
import { DuesPage } from './pages/Dues';
import { MaintenancePage } from './pages/Maintenance';
import { ResidentsPage } from './pages/Residents';
import { ApartmentSetupPage } from './pages/ApartmentSetup';
import { BuildingProvider } from './context/BuildingContext';
import type { ReactNode } from 'react';
import './App.css';

function SetupLoading() {
  return <p>Apartman kurulum durumu kontrol ediliyor...</p>;
}

// Giriş yapılmamış kullanıcıyı login'e yönlendir.
// Yönetici için kurulum tamamlanmamışsa kurulum sayfasını aç.
function PrivateRoute({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, setupComplete } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role === 'admin') {
    if (setupComplete === null) {
      return <SetupLoading />;
    }

    if (!setupComplete) {
      return <Navigate to="/apartment-setup" replace />;
    }
  }

  return <>{children}</>;
}

// Yönetici rotası. Kurulum sayfasına özel izin verebilir.
function AdminRoute({
  children,
  allowSetup = false,
}: {
  children: ReactNode;
  allowSetup?: boolean;
}) {
  const { user, isAuthenticated, setupComplete } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  if (allowSetup) {
    return setupComplete === true
      ? <Navigate to="/dashboard" replace />
      : <>{children}</>;
  }

  if (setupComplete === null) {
    return <SetupLoading />;
  }

  if (!setupComplete) {
    return <Navigate to="/apartment-setup" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Apartman kurulumu */}
      <Route
        path="/apartment-setup"
        element={
          <AdminRoute allowSetup>
            <ApartmentSetupPage />
          </AdminRoute>
        }
      />

      {/* Giriş */}
      <Route
        path="/login"
        element={
          isAuthenticated
            ? <Navigate to="/dashboard" replace />
            : <LoginPage />
        }
      />

      {/* Giriş gerektiren sayfalar */}
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <DashboardPage />
          </PrivateRoute>
        }
      />

      <Route
        path="/announcements"
        element={
          <PrivateRoute>
            <AnnouncementsPage />
          </PrivateRoute>
        }
      />

      <Route
        path="/dues"
        element={
          <PrivateRoute>
            <DuesPage />
          </PrivateRoute>
        }
      />

      <Route
        path="/maintenance"
        element={
          <PrivateRoute>
            <MaintenancePage />
          </PrivateRoute>
        }
      />

      {/* Yalnızca yönetici */}
      <Route
        path="/residents"
        element={
          <AdminRoute>
            <ResidentsPage />
          </AdminRoute>
        }
      />

      {/* Varsayılan yönlendirme */}
      <Route
        path="/"
        element={
          <Navigate
            to={isAuthenticated ? '/dashboard' : '/login'}
            replace
          />
        }
      />

      {/* Tanımlanmamış adresler */}
      <Route
        path="*"
        element={
          <Navigate
            to={isAuthenticated ? '/dashboard' : '/login'}
            replace
          />
        }
      />
    </Routes>
  );
}


export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

function AppContent() {
  const { user } = useAuth();

  return (
    <BuildingProvider key={user?.id ?? 'no-user'}>
      <AppRoutes />
    </BuildingProvider>
  );
}

