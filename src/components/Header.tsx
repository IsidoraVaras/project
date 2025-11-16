import React from 'react';
import { LogOut, User as UserIcon } from 'lucide-react';
import { User } from '../types';
import logocipaes from '../assets/LogoCIPAES.png';

interface HeaderProps {
  user: User | null;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({ user, onLogout }) => {
  return (
    <header className="bg-gray-100 shadow-lg border-b border-gray-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <h1 className="text-xl font-bold text-gray-900">
              <img src={logocipaes} alt="Logo CIPAES" className="h-12 w-auto" />
            </h1>
          </div>
          
          {user && (
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-gray-800">
                <UserIcon className="h-5 w-5" />
                <span className="text-sm font-medium">
                  {`${user.nombre} ${user.apellido}`}
                </span>
                <span className="text-xs bg-orange-600 text-white px-2 py-1 rounded-full uppercase">
                  {user.role === 'admin' ? 'Administrador' : 'Cliente'}
                </span>
              </div>
              
              <button
                onClick={onLogout}
                className="flex items-center space-x-2 px-3 py-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-200 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span className="text-sm">Salir</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
