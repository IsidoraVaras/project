import React, { useState } from 'react';
import { ClipboardList, BarChart3, User } from 'lucide-react';
import { Survey, SurveyResponse, User as UserType } from '../types';
import { mockSurveys, mockResponses, categories } from '../data/mockData';
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
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);
  const [responses] = useState<SurveyResponse[]>(mockResponses);

  const userResponses = responses.filter(r => r.userId === user.id);

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setCurrentView('category-surveys');
  };

  const handleSurveySelect = (survey: Survey) => {
    setSelectedSurvey(survey);
    setCurrentView('survey-form');
  };

  const handleSurveyComplete = (surveyId: string, answers: any[]) => {
    console.log('Encuesta completada:', { surveyId, answers });
    setCurrentView('results');
  };

  const getCategorySurveys = (categoryId: string) => {
    return mockSurveys.filter(s => s.category === categoryId && s.isActive);
  };

  const getCategoryTitle = (categoryId: string) => {
    return categories.find(c => c.id === categoryId)?.title || '';
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
        return (
          <CategorySurveys
            surveys={getCategorySurveys(selectedCategory)}
            categoryTitle={getCategoryTitle(selectedCategory)}
            onBack={() => setCurrentView('categories')}
            onSurveySelect={handleSurveySelect}
          />
        );

      case 'survey-form':
        return selectedSurvey ? (
          <SurveyForm
            survey={selectedSurvey}
            onComplete={handleSurveyComplete}
            onCancel={() => setCurrentView('category-surveys')}
          />
        ) : null;

      case 'results':
        return <ResultsView user={user} responses={userResponses} surveys={mockSurveys} />;

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
          {/* Sidebar */}
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

            {/* Stats Card */}
            <div className="mt-6 bg-white border-2 border-gray-300 rounded-xl p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">Mi Progreso</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Completadas</span>
                  <span className="font-medium text-gray-900">{userResponses.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Disponibles</span>
                  <span className="font-medium text-gray-900">{mockSurveys.length}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};