import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AppProvider } from './contexts/AppContext';
import { WelcomePage } from './pages/WelcomePage';
import { HomePage } from './pages/HomePage';
import { MapPage } from './pages/MapPage';
import { SimulationPage } from './pages/SimulationPage';
import { ReportPage } from './pages/ReportPage';
import { NavigationPage } from './pages/NavigationPage';
import { ProfilePage } from './pages/ProfilePage';
import { HouseStudio360 } from './components/sandbox/HouseStudio360';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <Routes>
          <Route path="/" element={<WelcomePage />} />
          <Route path="/home" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
          <Route path="/map" element={<ProtectedRoute><MapPage /></ProtectedRoute>} />
          <Route path="/shelters" element={<Navigate to="/map" replace />} />
          <Route path="/simulation" element={<ProtectedRoute><SimulationPage /></ProtectedRoute>} />
          <Route path="/studio" element={<ProtectedRoute><HouseStudio360 /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute><ReportPage /></ProtectedRoute>} />
          <Route path="/navigation/:shelterId" element={<ProtectedRoute><NavigationPage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </AppProvider>
    </AuthProvider>
  );
}

export default App;
