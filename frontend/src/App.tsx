import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AppProvider } from './contexts/AppContext';
import { WelcomePage } from './pages/WelcomePage';
import { HomePage } from './pages/HomePage';
import { ErrorBoundary, hasWebGL } from './components/common/ErrorBoundary';

// The first two screens load with the app; the rest load when first opened, so the first download stays small.
const MapPage = lazy(() => import('./pages/MapPage').then((m) => ({ default: m.MapPage })));
const LiveVisionPage = lazy(() => import('./pages/LiveVisionPage'));
const ReportPage = lazy(() => import('./pages/ReportPage').then((m) => ({ default: m.ReportPage })));
const NavigationPage = lazy(() => import('./pages/NavigationPage').then((m) => ({ default: m.NavigationPage })));
const ProfilePage = lazy(() => import('./pages/ProfilePage').then((m) => ({ default: m.ProfilePage })));
const ControlRoomPage = lazy(() => import('./pages/ControlRoomPage'));
// three.js is only needed by the 3D studio, so it loads with that route instead of on every page.
const HouseStudio360 = lazy(() => import('./components/sandbox/HouseStudio360').then((m) => ({ default: m.HouseStudio360 })));

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function Loading() {
  return (
    <div role="status" className="flex min-h-screen items-center justify-center bg-[#F4F7FB] text-sm font-semibold text-slate-600">
      <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-[#1677FF] border-t-transparent motion-reduce:animate-none" aria-hidden="true" />
      Loading…
    </div>
  );
}

/** The 3D studio needs WebGL; without it the page explains instead of failing. */
function Studio() {
  if (!hasWebGL()) {
    return (
      <div role="alert" className="flex min-h-screen items-center justify-center bg-[#F4F7FB] p-6 text-center">
        <div className="max-w-md">
          <h1 className="font-heading text-xl font-bold text-slate-900">3D studio needs WebGL</h1>
          <p className="mt-2 text-sm/6 text-slate-600">This browser or device cannot draw 3D graphics. Every other FloodWay screen works without it.</p>
          <a href="/home" className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-[#0958D9] px-4 text-sm font-bold text-white">Go to Home</a>
        </div>
      </div>
    );
  }
  return <HouseStudio360 />;
}

export function App() {
  const { pathname } = useLocation();
  return (
    <AuthProvider>
      <AppProvider>
        {/* keyed on the path, so moving to another screen clears a crash on the last one */}
        <ErrorBoundary key={pathname}>
          <Suspense fallback={<Loading />}>
            <Routes>
              <Route path="/" element={<WelcomePage />} />
              <Route path="/home" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
              <Route path="/map" element={<ProtectedRoute><MapPage /></ProtectedRoute>} />
              <Route path="/shelters" element={<Navigate to="/map" replace />} />
              <Route path="/live" element={<ProtectedRoute><LiveVisionPage /></ProtectedRoute>} />
              <Route path="/simulation" element={<Navigate to="/live" replace />} />
              <Route path="/studio" element={<ProtectedRoute><ErrorBoundary what="The 3D studio"><Studio /></ErrorBoundary></ProtectedRoute>} />
              <Route path="/control" element={<ProtectedRoute><ControlRoomPage /></ProtectedRoute>} />
              <Route path="/reports" element={<ProtectedRoute><ReportPage /></ProtectedRoute>} />
              <Route path="/navigation/:shelterId" element={<ProtectedRoute><NavigationPage /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
              <Route path="*" element={<Navigate to="/home" replace />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </AppProvider>
    </AuthProvider>
  );
}

export default App;
