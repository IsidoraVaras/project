import React from 'react';
import { BarChart3, CheckCircle, Calendar } from 'lucide-react';
import { User, SurveyResponse, Survey } from '../types';

interface ResultsViewProps {
  user: User;
  responses: SurveyResponse[];
  surveys: Survey[];
}

export const ResultsView: React.FC<ResultsViewProps> = ({ responses, surveys }) => {
  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Mis Resultados</h2>
        <p className="text-gray-700">Resumen de las encuestas que has completado</p>
      </div>

      {responses.length === 0 ? (
        <div className="text-center py-12">
          <BarChart3 className="h-12 w-12 text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">
            No hay resultados disponibles
          </h3>
          <p className="text-gray-600">
            Completa tu primera encuesta para ver los resultados aquí.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {responses.map((response) => {
            const survey = surveys.find(s => s.id === response.surveyId);
            
            return (
              <div key={response.id} className="bg-white border border-gray-300 rounded-xl p-6 shadow-sm">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-6 w-6 text-green-500" />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{survey?.title}</h3>
                      <p className="text-gray-700 text-sm">{survey?.description}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 text-gray-600 text-sm">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(response.completedAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="border-t border-gray-300 pt-4">
                  <h4 className="text-gray-900 font-medium mb-3">Tus respuestas:</h4>
                  <div className="grid gap-3">
                    {response.answers.map((answer, index) => {
                      const question = survey?.questions.find(q => q.id === answer.questionId);
                      
                      return (
                        <div key={index} className="bg-gray-100 p-4 rounded-lg border border-gray-300">
                          <p className="text-gray-700 text-sm mb-2">{question?.text}</p>
                          <div className="flex items-center space-x-2">
                            {question?.type === 'rating' ? (
                              <div className="flex space-x-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <div
                                    key={star}
                                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                                      star <= (answer.answer as number)
                                        ? 'bg-orange-600 text-white'
                                        : 'bg-gray-400 text-gray-700'
                                    }`}
                                  >
                                    {star}
                                  </div>
                                ))}
                                <span className="text-gray-900 font-medium ml-2">
                                  {answer.answer}/5
                                </span>
                              </div>
                            ) : (
                              <span className="text-gray-900 font-medium">
                                {answer.answer.toString()}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};