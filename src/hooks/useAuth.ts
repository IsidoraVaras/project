import { useState, useEffect } from 'react';
import { User } from '../types';

export const useAuth = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch('http://localhost:3001/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const user: User = { ...data.user, nombre: data.user.nombre, apellido: data.user.apellido };
        setCurrentUser(user);
        localStorage.setItem('currentUser', JSON.stringify(user));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      return false;
    }
  };

  const register = async (
    nombre: string,
    apellido: string,
    email: string,
    password: string
  ): Promise<boolean> => {
    try {
      const response = await fetch('http://localhost:3001/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, apellido, email, password }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        const newUser: User = { id: data.user.id, nombre, apellido, email, role: 'client' };
        setCurrentUser(newUser);
        localStorage.setItem('currentUser', JSON.stringify(newUser));
        return true;
      }

      if (response.status === 409) {
        throw new Error('EMAIL_TAKEN');
      }

      return false;
    } catch (error) {
      if (error instanceof Error && error.message === 'EMAIL_TAKEN') {
        throw error;
      }

      console.error('Error al registrar usuario:', error);
      return false;
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
  };

  const updateProfile = (updates: Partial<User>) => {
    if (currentUser) {
      const updatedUser = { ...currentUser, ...updates };
      setCurrentUser(updatedUser);
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    }
  };

  return {
    currentUser,
    loading,
    login,
    register,
    logout,
    updateProfile,
  };
};
