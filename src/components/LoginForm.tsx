import React, { useState } from 'react';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import logocipaes from '../assets/LogoCIPAES.png';

interface LoginFormProps {
  onLogin: (email: string, password: string) => Promise<boolean>;
  onRegister: (
    nombre: string,
    apellido: string,
    email: string,
    password: string
  ) => Promise<boolean>;
  onBack: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onLogin, onRegister, onBack }) => {
  const [isLogin, setIsLogin] = useState(true);

  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    password: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let success = false;

      if (isLogin) {
        success = await onLogin(formData.email, formData.password);
        if (!success) {
          setError('Credenciales inválidas');
        }
      } else {
        success = await onRegister(
          formData.nombre,
          formData.apellido,
          formData.email,
          formData.password
        );
        if (!success) {
          setError('Error al registrar usuario');
        }
      }
    } catch (err) {
      if (!isLogin && err instanceof Error && err.message === 'EMAIL_TAKEN') {
        setError('Este correo ya está registrado.');
      } else {
        setError('Ha ocurrido un error. Inténtalo de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  return (
    <div className="min-h-screen bg-gray-200 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white border border-gray-300 rounded-2xl shadow-xl p-8">
          <button
            onClick={onBack}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
          </button>

          <div className="text-center mb-8">
            <img src={logocipaes} alt="Logo CIPAES" className="h-12 w-auto mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
            </h2>
            <p className="text-gray-700">
              {isLogin ? 'Ingresa al portal con tus credenciales' : 'Regístrate para comenzar'}
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLogin && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nombre</label>
                  <input
                    type="text"
                    name="nombre"
                    required
                    value={formData.nombre}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-400 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Tu nombre"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Apellido</label>
                  <input
                    type="text"
                    name="apellido"
                    required
                    value={formData.apellido}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-400 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Tu apellido"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Correo electrónico</label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-400 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                placeholder="correo@gmail.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Contraseña</label>
              <div className="flex items-center bg-gray-50 border border-gray-400 rounded-lg focus-within:ring-2 focus-within:ring-orange-500 focus-within:border-orange-500">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="flex-1 px-4 py-3 bg-transparent border-none outline-none"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="px-3 text-gray-500 hover:text-gray-700"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>


            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-orange-800 text-white py-3 rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
            >
              {loading ? 'Procesando...' : isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsLogin((prev) => !prev);
                setError('');
                setFormData({ nombre: '', apellido: '', email: '', password: '' });
              }}
              className="text-orange-500 hover:text-orange-400 font-medium transition-colors"
            >
              {isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

