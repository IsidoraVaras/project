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

                {response.totals && (
                  <div className="mb-4 bg-gray-50 border border-gray-300 rounded-lg p-4">
                    <h4 className="text-gray-900 font-semibold mb-2">Puntajes</h4>
                    <p className="text-gray-800">Puntaje total de escala: <span className="font-bold">{response.totals.total}</span></p>
                    {response.totals.classification && (
                      <p className="text-gray-800 mt-1">
                        Interpretación: <span className="font-semibold">{response.totals.classification}</span>
                      </p>
                    )}
                    {Object.keys(response.totals.subscales || {}).length > 0 && (
                      <div className="mt-2">
                        <p className="text-gray-800 font-medium">Puntaje por subescala:</p>
                        <ul className="mt-1 list-disc list-inside text-gray-800">
                          {Object.entries(response.totals.subscales).map(([name, score]) => (
                            <li key={name}><span className="font-medium">{name}:</span> {score}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
                {/* Vista usuario: no mostramos detalle por pregunta */}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
