import React, { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { Header } from './components/Header';
import { HomePage } from './components/HomePage';
import { LoginForm } from './components/LoginForm';
import { ClientDashboard } from './components/ClientDashboard';
import { AdminDashboard } from './components/AdminDashboard';

type View = 'home' | 'login' | 'dashboard';

function App() {
  const { currentUser, loading, login, register, logout, updateProfile } = useAuth();
  const [currentView, setCurrentView] = useState<View>(currentUser ? 'dashboard' : 'home');

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
            // CAMBIO CLAVE AQUÍ: AÑADIR 'apellido' a la lista de argumentos.
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