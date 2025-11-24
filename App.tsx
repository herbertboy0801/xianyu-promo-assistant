
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { UserProvider, useUser } from './context/UserContext';
import { SelectionProvider } from './context/SelectionContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import NewsGenerator from './pages/NewsGenerator';
import Settings from './pages/Settings';
import AdminSelection from './pages/AdminSelection';
import Login from './pages/Login';
import MasterPoster from './pages/MasterPoster';

const ProtectedRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { isAuthenticated, hasRole } = useUser();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const MemberRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { isAuthenticated, hasRole } = useUser();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  // Allow Promoters to access Dashboard (they will see locked view)
  // Members, Admins, Selectors see full view
  if (!hasRole('member') && !hasRole('admin') && !hasRole('product_selector') && !hasRole('promoter')) {
    return <Navigate to="/master-poster" replace />;
  }
  return children;
};

const WorkbenchRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { isAuthenticated, hasRole } = useUser();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  // Check if user has ANY management role
  const canAccess = hasRole('admin') || hasRole('product_selector') || hasRole('promo_ambassador');

  if (!canAccess) {
    return <Navigate to="/" replace />;
  }
  return children;
};

function AppRoutes() {
  const { isLoading } = useUser();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-900 text-sm font-bold">正在加载数据...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<MemberRoute><Dashboard /></MemberRoute>} />
      <Route path="/admin" element={<WorkbenchRoute><AdminSelection /></WorkbenchRoute>} />
      <Route path="/news-generator" element={<ProtectedRoute><NewsGenerator /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="/master-poster" element={<ProtectedRoute><MasterPoster /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

import ErrorBoundary from './components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <UserProvider>
        <SelectionProvider>
          <HashRouter>
            <Layout>
              <AppRoutes />
            </Layout>
          </HashRouter>
        </SelectionProvider>
      </UserProvider>
    </ErrorBoundary>
  );
}

export default App;
