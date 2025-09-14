import React, { useState } from 'react';
import { ArrowLeft, Send, Clock, User } from 'lucide-react';
import { Survey, Answer } from '../types';

interface SurveyFormProps {
  survey: Survey;
  onComplete: (surveyId: string, answers: Answer[]) => void;
  onCancel: () => void;
}

export const SurveyForm: React.FC<SurveyFormProps> = ({ survey, onComplete, onCancel }) => {
  const [answers, setAnswers] = useState<{ [key: string]: string | number }>({});
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [currentQuestion, setCurrentQuestion] = useState(0);

  const handleAnswerChange = (questionId: string, answer: string | number) => {
    setAnswers({ ...answers, [questionId]: answer });
    if (errors[questionId]) {
      setErrors({ ...errors, [questionId]: '' });
    }
  };

  const validateCurrentQuestion = () => {
    const question = survey.questions[currentQuestion];
    if (question.required && !answers[question.id]) {
      setErrors({ ...errors, [question.id]: 'Esta pregunta es obligatoria' });
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (validateCurrentQuestion()) {
      if (currentQuestion < survey.questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
      }
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateCurrentQuestion()) {
      const formattedAnswers: Answer[] = Object.entries(answers).map(([questionId, answer]) => ({
        questionId,
        answer,
      }));
      
      onComplete(survey.id, formattedAnswers);
    }
  };

  const renderQuestion = (question: any) => {
    const error = errors[question.id];
    const answer = answers[question.id];

    switch (question.type) {
      case 'multiple-choice':
        return (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-300">
              <pre className="whitespace-pre-wrap text-gray-800 font-medium">
                {question.text}
              </pre>
            </div>
            
            <div className="space-y-3">
              {question.options?.map((option: string, index: number) => (
                <label key={index} className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name={question.id}
                    value={option}
                    checked={answer === option}
                    onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                    className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-400"
                  />
                  <span className="text-gray-800">{option}</span>
                </label>
              ))}
            </div>
          </div>
        );

      case 'scale':
        const scaleValues = [];
        for (let i = question.scaleMin!; i <= question.scaleMax!; i++) {
          scaleValues.push(i);
        }
        
        return (
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-300">
              <p className="text-gray-800 font-medium">{question.text}</p>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">{question.scaleLabels?.min}</span>
                <span className="text-sm text-gray-600">{question.scaleLabels?.max}</span>
              </div>
              
              <div className="flex justify-center space-x-2">
                {scaleValues.map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => handleAnswerChange(question.id, value)}
                    className={`w-12 h-12 rounded-full border-2 font-medium transition-all ${
                      answer === value
                        ? 'bg-orange-600 border-orange-600 text-white'
                        : 'border-gray-400 text-gray-700 hover:border-orange-500 hover:bg-orange-50'
                    }`}
                  >
                    {value}
                  </button>
                ))}
              </div>
              
              <div className="flex justify-between text-xs text-gray-500 px-2">
                {scaleValues.map((value) => (
                  <span key={value}>{value}</span>
                ))}
              </div>
            </div>
          </div>
        );

      case 'text':
        return (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-300">
              <p className="text-gray-800 font-medium">{question.text}</p>
            </div>
            
            <textarea
              value={answer || ''}
              onChange={(e) => handleAnswerChange(question.id, e.target.value)}
              placeholder="Escribe tu respuesta aquí..."
              rows={4}
              className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900 placeholder-gray-500 resize-none"
            />
          </div>
        );

      default:
        return null;
    }
  };

  const question = survey.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / survey.questions.length) * 100;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center mb-8">
        <button
          onClick={onCancel}
          className="flex items-center text-gray-600 hover:text-gray-900 mr-6 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Volver
        </button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{survey.title}</h2>
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4" />
              <span>{survey.estimatedTime}</span>
            </div>
            <div className="flex items-center space-x-1">
              <User className="h-4 w-4" />
              <span>{survey.author}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-600">
            Pregunta {currentQuestion + 1} de {survey.questions.length}
          </span>
          <span className="text-sm text-gray-600">{Math.round(progress)}% completado</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-orange-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-white border-2 border-gray-300 rounded-xl p-8 shadow-sm">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Pregunta {currentQuestion + 1}
              {question.required && <span className="text-orange-500 ml-1">*</span>}
            </h3>
          </div>
          
          {renderQuestion(question)}
          
          {errors[question.id] && (
            <p className="text-red-500 text-sm mt-4 bg-red-50 p-3 rounded-lg border border-red-200">
              {errors[question.id]}
            </p>
          )}
        </div>
        
        <div className="flex justify-between items-center pt-6">
          <button
            type="button"
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
            className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Anterior
          </button>
          
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            
            {currentQuestion === survey.questions.length - 1 ? (
              <button
                type="submit"
                className="flex items-center space-x-2 px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors"
              >
                <Send className="h-4 w-4" />
                <span>Enviar Respuestas</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors"
              >
                Siguiente
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};