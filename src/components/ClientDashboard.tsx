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
  // Vista actual dentro del panel del cliente
  const [currentView, setCurrentView] = useState<View>(() => {
    try { return (window.sessionStorage.getItem('client.view') as View) || 'categories'; } catch { return 'categories'; }
  });

  // Categoría seleccionada 
  const [selectedCategory, setSelectedCategory] = useState<number | null>(() => {
    try {
      const v = window.sessionStorage.getItem('client.selectedCategory');
      return v ? parseInt(v, 10) : null;
    } catch { return null; }
  });

  // Encuesta seleccionada 
  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);
  const [selectedSurveyId, setSelectedSurveyId] = useState<string>(() => {
    try { return window.sessionStorage.getItem('client.selectedSurveyId') || ''; } catch { return ''; }
  });

  // Resultados del usuario, encuestas y categorías cargadas 
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try { window.sessionStorage.setItem('client.view', currentView); } catch {}
  }, [currentView]);

  // Persistir categoría seleccionada
  useEffect(() => {
    try {
      if (selectedCategory !== null) window.sessionStorage.setItem('client.selectedCategory', String(selectedCategory));
      else window.sessionStorage.removeItem('client.selectedCategory');
    } catch {}
  }, [selectedCategory]);

  // Persistir encuesta seleccionada 
  useEffect(() => {
    try {
      const id = selectedSurvey ? selectedSurvey.id : selectedSurveyId || '';
      window.sessionStorage.setItem('client.selectedSurveyId', id);
    } catch {}
  }, [selectedSurvey, selectedSurveyId]);

  // Cargar categorías, resultados del usuario y encuestas 
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriesRes, resultsRes, surveysRes] = await Promise.all([
          fetch('http://localhost:3001/api/categories'),
          fetch(`http://localhost:3001/api/users/${user.id}/results`),
          fetch('http://localhost:3001/api/surveys'),
        ]);

        if (!categoriesRes.ok) throw new Error('No se pudo obtener las categorías');
        if (!resultsRes.ok) throw new Error('No se pudieron obtener tus resultados');
        if (!surveysRes.ok) throw new Error('No se pudieron obtener las encuestas');

        const categoriesData: Category[] = await categoriesRes.json();
        const resultsData: SurveyResponse[] = await resultsRes.json();
        const surveysRaw = await surveysRes.json();

        const mappedSurveys: Survey[] = (surveysRaw || []).map((s: any) => ({
          id: String(s.id),
          title: s.titulo,
          description: s.descripcion || '',
          category: String(s.id_categoria),
          questions: [],
          createdAt: new Date(),
          isActive: true,
          author: s.categoria_nombre || 'Admin',
          estimatedTime: '5-15 min',
        }));

        setCategories(categoriesData);
        setResponses(resultsData);
        setSurveys(mappedSurveys);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user.id]);

  // Reasignar la encuesta seleccionada cuando se cargan todas las encuestas
  useEffect(() => {
    if (!selectedSurvey && selectedSurveyId && surveys.length > 0) {
      const found = surveys.find(s => String(s.id) === String(selectedSurveyId));
      if (found) setSelectedSurvey(found);
    }
  }, [selectedSurveyId, surveys, selectedSurvey]);

  // Corregir estados incoherentes de navegación
  useEffect(() => {
    if (currentView === 'category-surveys' && selectedCategory === null) {
      setCurrentView('categories');
    }
    if (currentView === 'survey-form' && !selectedSurveyId && !selectedSurvey) {
      setCurrentView('category-surveys');
    }
  }, [currentView, selectedCategory, selectedSurvey, selectedSurveyId]);

  if (loading) {
    return <div className="text-center py-12 text-gray-700">Cargando datos...</div>;
  }

  // Respuestas del usuario logueado
  const userResponses = responses.filter(r => String(r.userId) === String(user.id));

  // IDs de encuestas ya completadas por este usuario
  const completedSurveyIds = Array.from(new Set(userResponses.map(r => String(r.surveyId))));

  // Cálculo de encuestas activas y cuántas quedan por responder
  const totalActive = surveys.filter(s => s.isActive).length;
  const availableLeft = Math.max(0, totalActive - completedSurveyIds.length);

  const handleCategorySelect = (categoryId: string) => {
    const numericId = parseInt(categoryId, 10);
    if (!isNaN(numericId)) {
      setSelectedCategory(numericId);
      setCurrentView('category-surveys');
    }
  };

  const handleSurveySelect = (survey: Survey) => {
    // Bloquea responder encuestas ya completadas
    if (completedSurveyIds.includes(String(survey.id))) {
      alert('Ya completaste esta encuesta.');
      return;
    }
    setSelectedSurvey(survey);
    setSelectedSurveyId(String(survey.id));
    setCurrentView('survey-form');
  };

  // Enviar respuestas de la encuesta actualizar resultados locales
  const handleSurveyComplete = async (surveyId: string, answers: any[]) => {
    try {
      const newResponse = { surveyId, userId: user.id, answers };
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

  // Obtener nombre de la categoría
  const getCategoryTitle = (categoryId: number | null) => {
    if (categoryId === null) return '';
    return categories.find(c => String(c.id) === String(categoryId))?.nombre || `Categoría ID ${categoryId}`;
  };

  const renderContent = () => {
    switch (currentView) {
      case 'categories':
        return (
          <CategoryGrid
            categories={categories}
            onCategorySelect={handleCategorySelect}
            surveys={surveys.map(s => ({ id: s.id, category: s.category, isActive: s.isActive }))}
          />
        );
      case 'category-surveys':
        return selectedCategory !== null ? (
          <CategorySurveys
            categoryId={selectedCategory}
            categoryTitle={getCategoryTitle(selectedCategory)}
            onBack={() => setCurrentView('categories')}
            onSurveySelect={handleSurveySelect}
            completedSurveyIds={completedSurveyIds}
          />
        ) : null;
      case 'survey-form':
        return selectedSurvey ? (
          <SurveyForm
            survey={selectedSurvey}
            userId={String(user.id)}
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
                    currentView === 'results' ? 'bg-orange-600 text-white' : 'text-gray-800 hover:bg-gray-100'
                  }`}
                >
                  <BarChart3 className="h-5 w-5" />
                  <span>Mis Resultados</span>
                </button>

                <button
                  onClick={() => setCurrentView('profile')}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    currentView === 'profile' ? 'bg-orange-600 text-white' : 'text-gray-800 hover:bg-gray-100'
                  }`}
                >
                  <User className="h-5 w-5" />
                  <span>Mi Perfil</span>
                </button>
              </div>
            </nav>

            {/* Resumen de progreso del usuario */}
            <div className="mt-6 bg-white border-2 border-gray-300 rounded-xl p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">Mi Progreso</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Completadas</span>
                  <span className="font-medium text-gray-900">{completedSurveyIds.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Disponibles</span>
                  <span className="font-medium text-gray-900">{availableLeft}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1">{renderContent()}</div>
        </div>
      </div>
    </div>
  );
};
