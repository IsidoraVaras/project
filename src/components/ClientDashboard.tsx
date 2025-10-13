import React, { useState, useEffect } from 'react';
import { ClipboardList, BarChart3, User } from 'lucide-react';
import { Survey, SurveyResponse, User as UserType, Category } from '../types';
import { CategoryGrid } from './CategoryGrid';
import { CategorySurveys } from './CategorySurveys';
import { SurveyForm } from './SurveyForm';
import { ProfileForm } from './ProfileForm';
import { ResultsView } from './ResultsView';

interface ClientDashboardProps {
  user: UserType;
  onUpdateProfile: (updates: Partial<UserType>) => void;
}

type View = 'categories' | 'category-surveys' | 'survey-form' | 'results' | 'profile';

export const ClientDashboard: React.FC<ClientDashboardProps> = ({ user, onUpdateProfile }) => {
  const [currentView, setCurrentView] = useState<View>('categories');
  // CAMBIO 1: El ID de la categoría seleccionada ahora es number | null
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null); 
  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const categoriesRes = await fetch('http://localhost:3001/api/categories');
      
        if (!categoriesRes.ok) {
          throw new Error('No se pudo obtener las categorías');
        }

        const categoriesData: Category[] = await categoriesRes.json();
      
        setCategories(categoriesData);

        setResponses([]); 
        setSurveys([]); 

      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <div className="text-center py-12 text-gray-700">Cargando datos...</div>;
  }

  const userResponses = responses.filter(r => r.userId === user.id);

  const handleCategorySelect = (categoryId: string) => {
    // CAMBIO 2: Convertir el ID de string a número antes de guardarlo en el estado
    const numericId = parseInt(categoryId, 10);
    if (!isNaN(numericId)) {
        setSelectedCategory(numericId);
        setCurrentView('category-surveys');
    } else {
        console.error("ID de categoría inválido:", categoryId);
    }
  };

  const handleSurveySelect = (survey: Survey) => {
    setSelectedSurvey(survey);
    setCurrentView('survey-form');
  };

  const handleSurveyComplete = async (surveyId: string, answers: any[]) => {
    try {
      const newResponse = {
        surveyId,
        userId: user.id,
        answers,
      };

      const res = await fetch('http://localhost:3001/api/responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newResponse),
      });

      if (res.ok) {
        const savedResponse = await res.json();
        setResponses(prev => [...prev, savedResponse]);
      } else {
        console.error('Error al guardar la respuesta de la encuesta.');
      }
    } catch (error) {
      console.error('Error al enviar la respuesta:', error);
    }
    setCurrentView('results');
  };

  // FUNCIÓN ELIMINADA: getCategorySurveys ya no es necesaria, CategorySurveys.tsx se encarga.

  // Ajustar getCategoryTitle para que acepte number | null
  const getCategoryTitle = (categoryId: number | null) => {
    if (categoryId === null) return '';
    // Comparamos el number del estado con el string del array categories
    return categories.find(c => String(c.id) === String(categoryId))?.nombre || `Categoría ID ${categoryId}`;
  };

  const renderContent = () => {
    switch (currentView) {
      case 'categories':
        return (
          <CategoryGrid 
            categories={categories}
            onCategorySelect={handleCategorySelect}
          />
        );

      case 'category-surveys':
        // CAMBIO 3: Eliminar la prop 'surveys' y pasar 'categoryId'
        return selectedCategory !== null ? (
          <CategorySurveys
            categoryId={selectedCategory}
            categoryTitle={getCategoryTitle(selectedCategory)}
            onBack={() => setCurrentView('categories')}
            onSurveySelect={handleSurveySelect}
          />
        ) : null;

      case 'survey-form':
        return selectedSurvey ? (
          <SurveyForm
            survey={selectedSurvey}
            onComplete={handleSurveyComplete}
            onCancel={() => setCurrentView('category-surveys')}
          />
        ) : null;

      case 'results':
        return <ResultsView user={user} responses={userResponses} surveys={surveys} />;

      case 'profile':
        return <ProfileForm user={user} onUpdateProfile={onUpdateProfile} />;

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          <div className="w-64 flex-shrink-0">
            <nav className="bg-white border-2 border-gray-300 rounded-xl p-4 shadow-sm">
              <div className="space-y-2">
                <button
                  onClick={() => setCurrentView('categories')}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    currentView === 'categories' || currentView === 'category-surveys' || currentView === 'survey-form'
                      ? 'bg-orange-600 text-white'
                      : 'text-gray-800 hover:bg-gray-100'
                  }`}
                >
                  <ClipboardList className="h-5 w-5" />
                  <span>Encuestas</span>
                </button>

                <button
                  onClick={() => setCurrentView('results')}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    currentView === 'results'
                      ? 'bg-orange-600 text-white'
                      : 'text-gray-800 hover:bg-gray-100'
                  }`}
                >
                  <BarChart3 className="h-5 w-5" />
                  <span>Mis Resultados</span>
                </button>

                <button
                  onClick={() => setCurrentView('profile')}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    currentView === 'profile'
                      ? 'bg-orange-600 text-white'
                      : 'text-gray-800 hover:bg-gray-100'
                  }`}
                >
                  <User className="h-5 w-5" />
                  <span>Mi Perfil</span>
                </button>
              </div>
            </nav>

            <div className="mt-6 bg-white border-2 border-gray-300 rounded-xl p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">Mi Progreso</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Completadas</span>
                  <span className="font-medium text-gray-900">{userResponses.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Disponibles</span>
                  <span className="font-medium text-gray-900">{surveys.length}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex-1">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};