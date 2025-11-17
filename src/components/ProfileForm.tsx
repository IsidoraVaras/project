import React, { useState } from 'react';
import { Save, User } from 'lucide-react';
import { User as UserType } from '../types';

interface ProfileFormProps {
  user: UserType;
  onUpdateProfile: (updates: Partial<UserType>) => void;
}

export const ProfileForm: React.FC<ProfileFormProps> = ({ user, onUpdateProfile }) => {
  // Estado inicial del formulario con los datos del usuario
  const [formData, setFormData] = useState({
    nombre: user.nombre,
    apellido: user.apellido,
    email: user.email,
  });

  const [success, setSuccess] = useState(false);

  // Envía los datos actualizados 
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile(formData); 
    setSuccess(true);

    setTimeout(() => setSuccess(false), 3000);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Mi Perfil</h2>
        <p className="text-gray-700">Actualiza tu información personal</p>
      </div>

      <div className="max-w-2xl">
        <div className="bg-white border border-gray-300 rounded-xl p-8 shadow-sm">
          <div className="flex items-center mb-6">
            <div className="w-16 h-16 bg-orange-600 rounded-full flex items-center justify-center mr-4">
              <User className="h-8 w-8 text-white" />
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {`${user.nombre} ${user.apellido}`}
              </h3>
              <p className="text-gray-700 text-sm capitalize">{user.role}</p>
            </div>
          </div>
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
              Perfil actualizado correctamente
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">

            <div>
              <label className="block text-sm font-medium text-gray-800 mb-2">Nombre</label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 bg-gray-50 border border-gray-400 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-2">Apellido</label>
              <input
                type="text"
                name="apellido"
                value={formData.apellido}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 bg-gray-50 border border-gray-400 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-2">
                Correo electrónico
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 bg-gray-50 border border-gray-400 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900"
              />
            </div>
            <div className="pt-4">
              <button
                type="submit"
                className="flex items-center space-x-2 bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg transition-colors"
              >
                <Save className="h-4 w-4" />
                <span>Guardar Cambios</span>
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};
