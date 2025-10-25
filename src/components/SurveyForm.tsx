// src/components/SurveyForm.tsx

import React, { useState, useEffect } from 'react';
import { Survey, Question, Answer, QuestionOption } from '../types';
import { Loader2, AlertTriangle, ArrowLeft } from 'lucide-react';

// Estructuras que devuelve el backend
interface DBOption {
  id: number;
  orden: number;
  etiqueta: string;
  valor: number;
  tipo_escala: string | null;
  subescala: string | null;
  id_pregunta: number;
}

interface DBQuestion {
  id: number;
  texto: string;
  opciones?: DBOption[];
}

interface SurveyFormProps {
  survey: Survey;
  onComplete: (surveyId: string, answers: Answer[]) => void;
  onCancel: () => void;
}

export const SurveyForm: React.FC<SurveyFormProps> = ({ survey, onComplete, onCancel }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string | number>>({});

  // Cargar preguntas desde el backend
  useEffect(() => {
    const fetchQuestions = async () => {
      setLoading(true);
      try {
        const response = await fetch(`http://localhost:3001/api/surveys/${survey.id}/questions`);
        if (!response.ok) {
          throw new Error(`Error ${response.status}: No se pudieron obtener las preguntas.`);
        }

        const data: DBQuestion[] = await response.json();

        const mappedQuestions: Question[] = data.map((dbQuestion) => {
          const hasOptions = Array.isArray(dbQuestion.opciones) && dbQuestion.opciones.length > 0;
          let options: QuestionOption[] | undefined;
          let type: Question['type'] = 'text';
          if (hasOptions) {
            const subescales = new Set(
              dbQuestion.opciones!.map((o) => (o.subescala || '').toLowerCase())
            );
            if (subescales.has('miedo') || subescales.has('evitacion')) {
              type = 'lsas';
            } else {
              type = 'multiple-choice';
            }
            options = dbQuestion.opciones!
              .sort((a, b) => a.orden - b.orden)
              .map((o) => ({ label: o.etiqueta, value: o.valor, orden: o.orden, group: o.subescala || undefined }));
          }

          return {
            id: String(dbQuestion.id),
            text: dbQuestion.texto,
            type,
            required: true,
            options,
          };
        });

        setQuestions(mappedQuestions);
        setError(null);
      } catch (err) {
        console.error('Error fetching questions:', err);
        setError('Hubo un problema al cargar las preguntas de la encuesta.');
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [survey.id]);

  const handleChange = (questionId: string, value: string | number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const finalAnswers: Answer[] = Object.keys(answers).map((questionId) => ({
      questionId,
      answer: answers[questionId],
    }));

    onComplete(survey.id, finalAnswers);
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-orange-600" />
        <p className="mt-4 text-gray-700">Cargando preguntas de la encuesta...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8 bg-red-100 border border-red-400 text-red-700 rounded">
        <AlertTriangle className="h-6 w-6 mx-auto mb-3" />
        <p className="font-bold">Error:</p>
        <p>{error}</p>
        <button onClick={onCancel} className="mt-4 text-gray-600 hover:text-gray-900 transition-colors underline">
          <ArrowLeft className="h-4 w-4 inline mr-1" /> Volver
        </button>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="text-center p-8 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
        <p className="font-bold">Información:</p>
        <p>Esta encuesta no tiene preguntas asociadas aún.</p>
        <button onClick={onCancel} className="mt-4 text-gray-600 hover:text-gray-900 transition-colors underline">
          <ArrowLeft className="h-4 w-4 inline mr-1" /> Volver
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-gray-200">
      <h2 className="text-3xl font-extrabold text-gray-900 mb-2">{survey.title}</h2>
      <p className="text-gray-600 mb-8">{survey.description}</p>

      <form onSubmit={handleSubmit} className="space-y-8">
        {questions.some(q => q.type === 'lsas') && (
          <div className="p-4 border rounded bg-orange-50 text-sm text-gray-800">
            <p className="font-semibold mb-1">Escala de Ansiedad Social de Liebowitz (LSAS)</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="font-medium">Miedo o ansiedad</p>
                <p>0 = Nada de miedo o ansiedad</p>
                <p>1 = Un poco de miedo o ansiedad</p>
                <p>2 = Bastante miedo o ansiedad</p>
                <p>3 = Mucho miedo o ansiedad</p>
              </div>
              <div>
                <p className="font-medium">Evitación</p>
                <p>0 = Nunca lo evito (0%)</p>
                <p>1 = En ocasiones lo evito (1–33%)</p>
                <p>2 = Frecuentemente lo evito (33–67%)</p>
                <p>3 = Habitualmente lo evito (67–100%)</p>
              </div>
            </div>
          </div>
        )}
        {questions.map((q, index) => (
          <div key={q.id} className="p-4 border-l-4 border-orange-500 bg-gray-50 rounded-r-lg shadow-sm">
            <label className="block text-lg font-semibold text-gray-800 mb-3">
              {index + 1}. {q.text} {q.required && <span className="text-red-500">*</span>}
            </label>

            {q.type === 'lsas' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Miedo/ansiedad (0–3)</label>
                  <input
                    type="number"
                    min={0}
                    max={3}
                    step={1}
                    value={answers[`${q.id}|miedo`] ?? ''}
                    onChange={(e) => handleChange(`${q.id}|miedo`, Number(e.target.value))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                    required={q.required}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Evitación (0–3)</label>
                  <input
                    type="number"
                    min={0}
                    max={3}
                    step={1}
                    value={answers[`${q.id}|evitacion`] ?? ''}
                    onChange={(e) => handleChange(`${q.id}|evitacion`, Number(e.target.value))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                    required={q.required}
                  />
                </div>
              </div>
            ) : q.type === 'multiple-choice' && q.options && q.options.length > 0 ? (
              <div className="space-y-2">
                {q.options.map((opt) => (
                  <label key={`${q.id}-${opt.value}`} className="flex items-center space-x-3">
                    <input
                      type="radio"
                      name={`q-${q.id}`}
                      value={String(opt.value)}
                      checked={String(answers[q.id] ?? '') === String(opt.value)}
                      onChange={(e) => handleChange(q.id, Number(e.target.value))}
                      required={q.required}
                      className="text-orange-600 focus:ring-orange-500"
                    />
                    <span className="text-gray-800">{opt.label}</span>
                  </label>
                ))}
              </div>
            ) : (
              <input
                type="text"
                value={answers[q.id] || ''}
                onChange={(e) => handleChange(q.id, e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                required={q.required}
              />
            )}
          </div>
        ))}

        <div className="flex justify-between pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-6 py-3 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition-colors"
          >
            Completar Encuesta
          </button>
        </div>
      </form>
    </div>
  );
};
