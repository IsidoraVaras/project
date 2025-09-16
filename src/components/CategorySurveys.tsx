import React from 'react';
import { ArrowLeft, Clock, User, ChevronRight } from 'lucide-react';
import { Survey } from '../types';

interface CategorySurveysProps {
  surveys: Survey[];
  categoryTitle: string;
  onBack: () => void;
  onSurveySelect: (survey: Survey) => void;
}

export const CategorySurveys: React.FC<CategorySurveysProps> = ({ 
  surveys, 
  categoryTitle, 
  onBack, 
  onSurveySelect 
}) => {
  return (
    <div>
      <div className="flex items-center mb-8">
        <button
          onClick={onBack}
          className="flex items-center text-gray-600 hover:text-gray-900 mr-6 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Volver a categorías
        </button>
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">{categoryTitle}</h2>
        </div>
      </div>

      <div className="grid gap-6">
        {surveys.map((survey) => (
          <div
            key={survey.id}
            className="bg-white border-2 border-gray-300 rounded-xl p-6 hover:border-orange-500 hover:shadow-lg transition-all duration-300 group cursor-pointer"
            onClick={() => onSurveySelect(survey)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-3">
                  <h3 className="text-xl font-bold text-gray-900 group-hover:text-orange-600 transition-colors">
                    {survey.title}
                  </h3>
                  {survey.author && (
                    <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {survey.author}
                    </span>
                  )}
                </div>
                
                <p className="text-gray-700 mb-4 leading-relaxed">
                  {survey.description}
                </p>
                
                <div className="flex items-center space-x-6 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4" />
                    <span>{survey.estimatedTime || '10-15 min'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <span>{survey.questions.length} preguntas</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 text-orange-600 font-semibold group-hover:text-orange-700 ml-6">
                <span>IR</span>
                <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};