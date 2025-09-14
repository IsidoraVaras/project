import React from 'react';
import { BarChart3, Users, CheckCircle, TrendingUp } from 'lucide-react';
import logoudla from '../assets/logoudla.png';
import logoCIPAES from '../assets/LogoCIPAES.png';

interface HomePageProps {
  onLoginClick: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onLoginClick }) => {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="w-full bg-gray-100 shadow-sm border-b border-gray-300">
        <div className="flex justify-between items-center h-16 px-4 sm:px-6 lg:px-8">
          {/* Logo + Título */}
          <div className="flex items-center space-x-3">
            <img src={logoudla} alt="Logo UDLA" className="h-12 w-auto" />
          </div>

          <button
            onClick={onLoginClick}
            className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200"
          >
            Iniciar Sesión
          </button>
        </div>
      </header>



      {/* Hero Section */}
      <section className="relative py-20 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto text-center">
          <div className="mb-8">
            <BarChart3 className="h-16 w-16 text-orange-500 mx-auto mb-6" />
            <h1 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
              Plataforma de Encuestas
              <span className="text-orange-500"> Profesional</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Accede a tus encuestas de forma rápida, segura y sencilla. Responde desde
              cualquier dispositivo y contribuye con información valiosa.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <button
              onClick={onLoginClick}
              className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-3 rounded-lg font-medium text-lg transition-all duration-200 transform hover:scale-105"
            >
              Comenzar Ahora
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-gray-200">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            ¿Por qué elegir nuestra plataforma?
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white border border-gray-300 rounded-xl p-6 hover:border-orange-500/50 hover:shadow-lg transition-all duration-300">
              <Users className="h-10 w-10 text-orange-500 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Fácil de Usar</h3>
              <p className="text-gray-700">
                Encuestas claras y directas, listas para responder en pocos minutos.
              </p>
            </div>

            <div className="bg-white border border-gray-300 rounded-xl p-6 hover:border-orange-500/50 hover:shadow-lg transition-all duration-300">
              <CheckCircle className="h-10 w-10 text-orange-500 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Acceso desde cualquier lugar</h3>
              <p className="text-gray-700">
                Ingresa desde tu computadora, tablet o celular sin complicaciones.
              </p>
            </div>

            <div className="bg-white border border-gray-300 rounded-xl p-6 hover:border-orange-500/50 hover:shadow-lg transition-all duration-300">
              <TrendingUp className="h-10 w-10 text-orange-500 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Respuestas seguras</h3>
              <p className="text-gray-700">
                Tus datos son confidenciales y estaran siempre protegidos.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-gray-100">
        <div className="max-w-4xl mx-auto text-center bg-white border border-gray-300 rounded-2xl p-12 shadow-lg">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            ¿Listo para comenzar?
          </h2>
          <p className="text-gray-700 mb-8 text-lg">
            Únete a miles de empresas que ya confían en nuestra plataforma 
            para obtener insights valiosos de sus clientes.
          </p>
          <button
            onClick={onLoginClick}
            className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-3 rounded-lg font-medium text-lg transition-all duration-200 transform hover:scale-105"
          >
            Iniciar Sesión
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 border-t border-gray-600 py-8 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <BarChart3 className="h-6 w-6 text-orange-500" />
            <span className="text-white font-semibold">Encuestas Pro</span>
          </div>
          <p className="text-gray-400">
            © 2025 Encuestas Pro. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
};