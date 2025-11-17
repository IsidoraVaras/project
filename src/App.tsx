import { useEffect, useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { Header } from './components/Header';
import { HomePage } from './components/HomePage';
import { LoginForm } from './components/LoginForm';
import { ClientDashboard } from './components/ClientDashboard';
import { AdminDashboard } from './components/AdminDashboard';

type View = 'home' | 'login' | 'dashboard';

function App() {
  const { currentUser, loading, login, register, logout, updateProfile } = useAuth();

  // Vista actual de la app 
  const [currentView, setCurrentView] = useState<View>(() => {
    if (typeof window === 'undefined') return 'home';
    try {
      const v = window.sessionStorage.getItem('app.view') as View | null;
      return v ?? 'home';
    } catch {
      return 'home';
    }
  });

  // Guardar la vista actual para mantenerla al recargar (sólo durante la sesión actual del navegador)
  useEffect(() => {
    try {
      window.sessionStorage.setItem('app.view', currentView);
    } catch {}
  }, [currentView]);

  // Si se recarga estando en dashboard, redirigir a login
  useEffect(() => {
    if (!loading && !currentUser && currentView === 'dashboard') {
      setCurrentView('login');
    }
  }, [loading, currentUser, currentView]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-200 flex items-center justify-center">
        <div className="text-gray-900">Cargando...</div>
      </div>
    );
  }

  const handleLoginSuccess = () => {
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    logout();
    // Limpiar estado de vistas internas de admin y cliente
    try {
      const s = window.sessionStorage;
      s.removeItem('admin.view');
      s.removeItem('admin.selectedUserId');
      s.removeItem('admin.selectedResponseId');
      s.removeItem('client.view');
      s.removeItem('client.selectedCategory');
      s.removeItem('client.selectedSurveyId');
    } catch {
      // Ignorar errores de acceso a sessionStorage
    }
    setCurrentView('home');
  };

  const handleLoginClick = () => {
    setCurrentView('login');
  };

  const handleBackToHome = () => {
    setCurrentView('home');
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'home':
        return <HomePage onLoginClick={handleLoginClick} />;

      case 'login':
        return (
          <LoginForm
            onLogin={async (email, password) => {
              const success = await login(email, password);
              if (success) handleLoginSuccess();
              return success;
            }}
            // Registro 
            onRegister={async (nombre, apellido, email, password) => {
              const success = await register(nombre, apellido, email, password);
              if (success) handleLoginSuccess();
              return success;
            }}
            onBack={handleBackToHome}
          />
        );

      case 'dashboard':
        if (!currentUser) return null;

        return (
          <div>
            <Header user={currentUser} onLogout={handleLogout} />
            {currentUser.role === 'admin' ? (
              <AdminDashboard user={currentUser} />
            ) : (
              <ClientDashboard user={currentUser} onUpdateProfile={updateProfile} />
            )}
          </div>
        );

      default:
        return <HomePage onLoginClick={handleLoginClick} />;
    }
  };

  return <div className="app">{renderCurrentView()}</div>;
}

export default App;
