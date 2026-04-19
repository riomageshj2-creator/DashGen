import { useState, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { useAuth } from './hooks/useAuth';
import { useFileUpload } from './hooks/useFileUpload';
import Sidebar from './components/Layout/Sidebar';
import Navbar from './components/Layout/Navbar';
import LoginPage from './pages/LoginPage';
import UploadPage from './pages/UploadPage';
import DashboardPage from './pages/DashboardPage';
import HistoryPage from './pages/HistoryPage';
import SharedDashboardPage from './pages/SharedDashboardPage';
import './App.css';

function AppContent() {
  const { user, loading: authLoading, signIn, signUp, signOut } = useAuth();
  const { uploading, progress, error, parsedResult, uploadAndParse, loadFromHistory, saveDashboardToCloud, toggleDashboardPublic, deleteDashboard, reset } = useFileUpload();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleFileAccepted = useCallback(
    async (file) => {
      if (!user) return;
      try {
        await uploadAndParse(file, user.id);
      } catch (err) {
        console.error('Upload error:', err);
      }
    },
    [user, uploadAndParse]
  );

  const handleLoadFromHistory = useCallback(
    async (fileRecord) => {
      try {
        await loadFromHistory(fileRecord);
      } catch (err) {
        console.error('Load history error:', err);
      }
    },
    [loadFromHistory]
  );

  const handleBack = useCallback(() => {
    reset();
  }, [reset]);

  const isSharedRoute = location.pathname.startsWith('/shared/');

  // Auth loading state
  if (authLoading) {
    return (
      <div className="loading-overlay" style={{ minHeight: '100vh' }}>
        <div className="spinner spinner-lg" />
        <p>Loading...</p>
      </div>
    );
  }

  // Not authenticated
  if (!user && !isSharedRoute) {
    return <LoginPage onLogin={signIn} onSignup={signUp} />;
  }

  // If unauthenticated but on shared route, render just that:
  if (!user && isSharedRoute) {
    return (
      <Routes>
        <Route path="/shared/:id" element={<SharedDashboardPage />} />
      </Routes>
    );
  }

  // Authenticated — show app
  return (
    <div className="app-layout">
      <Sidebar
        user={user}
        onSignOut={signOut}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <Navbar onMenuClick={() => setSidebarOpen(true)} />

      <main className="app-main">
        <div className="app-content">
          <Routes>
            <Route path="/shared/:id" element={<SharedDashboardPage />} />
            <Route path="/history" element={<HistoryPage onSelectDashboard={handleLoadFromHistory} onDeleteDashboard={deleteDashboard} />} />
            <Route path="*" element={
              parsedResult ? (
                <DashboardPage 
                  parsedResult={parsedResult} 
                  onBack={handleBack} 
                  onSave={() => saveDashboardToCloud(user.id)}
                  isSaving={uploading}
                  onShare={toggleDashboardPublic}
                  onDeleteDashboard={deleteDashboard}
                />
              ) : (
                <UploadPage
                  userId={user.id}
                  onFileAccepted={handleFileAccepted}
                  onLoadFromHistory={handleLoadFromHistory}
                  uploading={uploading}
                  progress={progress}
                  error={error}
                />
              )
            } />
          </Routes>
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </ThemeProvider>
  );
}
