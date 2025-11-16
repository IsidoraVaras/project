import React, { useState, useEffect } from 'react';
import { ArrowLeft, User, ChevronRight, Loader2 } from 'lucide-react';
import { Survey, Question } from '../types';

// Interfaz de datos esperados 
interface DBSurvey {
  id: number;
  titulo: string;
  descripcion: string;
  id_categoria: number;
}

interface CategorySurveysProps {
  categoryId: number;
  categoryTitle: string;
  onBack: () => void;
  onSurveySelect: (survey: Survey) => void;
  completedSurveyIds?: string[]; 
}

export const CategorySurveys: React.FC<CategorySurveysProps> = ({
  categoryId,
  categoryTitle,
  onBack,
  onSurveySelect,
  completedSurveyIds = [],
}) => {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!categoryId) {
      setError('ID de categoría no proporcionado.');
      setLoading(false);
      return;
    }

    const fetchSurveys = async () => {
      setLoading(true);
      try {
        const response = await fetch(`http://localhost:3001/api/categories/${categoryId}/surveys`);
        if (!response.ok) {
          const errorText = response.statusText || 'Error desconocido';
          throw new Error(`Error al cargar las encuestas. Estado: ${response.status} - ${errorText}`);
        }

        const data: DBSurvey[] = await response.json();

        // Mapear encuestas y obtener el conteo real de preguntas
        const baseSurveys: Survey[] = data.map((dbSurvey) => ({
          id: String(dbSurvey.id),
          title: dbSurvey.titulo,
          description: '',
          category: String(dbSurvey.id_categoria),
          questions: [],
          createdAt: new Date(),
          isActive: true,
        }));

        const withCounts: Survey[] = await Promise.all(
          baseSurveys.map(async (s) => {
            try {
              const qRes = await fetch(`http://localhost:3001/api/surveys/${s.id}/questions`);
              const qData: any[] = qRes.ok ? await qRes.json() : [];
              const count = Array.isArray(qData) ? qData.length : 0;
              return { ...s, questions: new Array(count).fill({} as Question) };
            } catch {
              return { ...s, questions: [] };
            }
          })
        );

        setSurveys(withCounts);
        setError(null);
      } catch (err: any) {
        console.error('Error al obtener las encuestas:', err);
        setError('No se pudieron cargar las encuestas. Intente nuevamente.');
      } finally {
        setLoading(false);
      }
    };

    fetchSurveys();
  }, [categoryId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48 text-orange-500">
        <Loader2 className="h-8 w-8 animate-spin mr-3" />
        Cargando encuestas de {categoryTitle}...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8 bg-red-100 border border-red-400 text-red-700 rounded">
        <p className="font-bold">Error:</p>
        <p>{error}</p>
        <button onClick={onBack} className="mt-4 text-gray-600 hover:text-gray-900 transition-colors underline">
          Volver
        </button>
      </div>
    );
  }

  if (surveys.length === 0) {
    return (
      <div className="text-center p-8 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
        <p className="font-bold">¡Vaya!</p>
        <p>No se encontraron encuestas disponibles para la categoría: {categoryTitle}.</p>
        <button onClick={onBack} className="mt-4 text-gray-600 hover:text-gray-900 transition-colors underline">
          Volver a categorías
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <button onClick={onBack} className="flex items-center text-gray-600 hover:text-gray-900 transition-colors">
          <ArrowLeft className="h-5 w-5 mr-2" />
          Volver a categorías
        </button>
        <div className="mt-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">{categoryTitle}</h2>
          <p className="text-gray-500">{surveys.length} encuestas disponibles.</p>
        </div>
      </div>

      <div className="grid gap-6">
        {surveys.map((survey) => {
          const completed = completedSurveyIds.includes(String(survey.id));
          return (
            <div
              key={survey.id}
              className={`bg-white border-2 rounded-xl p-6 transition-all duration-300 group ${
                completed
                  ? 'border-green-400 opacity-70 cursor-not-allowed'
                  : 'border-gray-300 hover:border-orange-500 hover:shadow-lg cursor-pointer'
              }`}
              onClick={() => {
                if (!completed) onSurveySelect(survey);
              }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-orange-600 transition-colors">
                      {survey.title}
                    </h3>
                    {completed && (
                      <span className="text-xs text-green-800 bg-green-100 px-2 py-1 rounded-full">Completada</span>
                    )}
                  </div>

                  <div className="flex items-center space-x-6 text-sm text-gray-600">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4" />
                      <span>{survey.questions.length} preguntas</span>
                    </div>
                  </div>
                </div>

                {!completed ? (
                  <div className="flex items-center space-x-2 text-orange-600 font-semibold group-hover:text-orange-700 ml-6">
                    <span>IR</span>
                    <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 text-gray-500 font-semibold ml-6">
                    <span>Respondida</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

