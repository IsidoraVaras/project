// src/components/SurveyForm.tsx

import React, { useState, useEffect } from 'react';
import { Survey, Question, Answer, QuestionOption } from '../types';
import { Loader2, AlertTriangle, ArrowLeft } from 'lucide-react';

interface DBQuestionOption {
  id: number;
  orden: number | null;
  etiqueta: string;
  valor: string | number;
  tipo_escala?: string | null;
  subescala?: string | null;
}

interface DBQuestion {
  id: number;
  texto: string;
  tipo_escala?: string | null;
  opciones?: DBQuestionOption[];
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

  const sanitize = (s: string) =>
    (s ?? '')
      .replace(/[\u0000-\u001F\u007F]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  const toQuestionOptions = (dbOpts?: DBQuestionOption[]): QuestionOption[] => {
    if (!dbOpts || dbOpts.length === 0) return [];
    return [...dbOpts]
      .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))
      .map((o) => ({
        label: sanitize(String(o.etiqueta)),
        value:
          typeof o.valor === 'number'
            ? o.valor
            : (isNaN(Number(o.valor)) ? String(o.valor) : Number(o.valor)),
        orden: o.orden ?? undefined,
        group: o.subescala ?? undefined,
      }));
  };

  const isLSAS = (dbq: DBQuestion): boolean => {
    const hasLsasType = dbq.opciones?.some(
      (o) => (o.tipo_escala ?? '').toLowerCase() === 'lsas'
    );
    const hasLsasSub = dbq.opciones?.some((o) => {
      const s = (o.subescala ?? '').toLowerCase();
      return s === 'miedo' || s === 'evitacion' || s === 'evitación';
    });
    return Boolean(hasLsasType || hasLsasSub);
  };

  useEffect(() => {
    const fetchQuestions = async () => {
      setLoading(true);
      try {
        const response = await fetch(`http://localhost:3001/api/surveys/${survey.id}/questions`);
        if (!response.ok) throw new Error(`Error ${response.status}`);

        const data: DBQuestion[] = await response.json();

        const mapped: Question[] = data.map((dbq) => {
          const opts = toQuestionOptions(dbq.opciones);

          if (isLSAS(dbq)) {
            return {
              id: String(dbq.id),
              text: sanitize(dbq.texto),
              type: 'lsas',
              required: true,
              options: [],
              scaleMin: 0,
              scaleMax: 3,
            };
          }

          if (opts.length > 0) {
            return {
              id: String(dbq.id),
              text: sanitize(dbq.texto),
              type: 'multiple-choice',
              required: true,
              options: opts,
            };
          }

          return {
            id: String(dbq.id),
            text: sanitize(dbq.texto),
            type: 'text',
            required: true,
            options: [] as QuestionOption[],
          };
        });

        setQuestions(mapped);
        setError(null);
      } catch (e: any) {
        console.error(e);
        setError('Hubo un problema al cargar las preguntas.');
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
    const finalAnswers: Answer[] = Object.keys(answers).map((questionKey) => ({
      questionId: questionKey,
      answer: answers[questionKey],
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
        <button
          onClick={onCancel}
          className="mt-4 text-gray-600 hover:text-gray-900 transition-colors underline"
        >
          <ArrowLeft className="h-4 w-4 inline mr-1" /> Volver
        </button>
      </div>
    );
  }

  const isLsasSurvey = questions.some((q) => q.type === 'lsas');

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-gray-200 min-w-0">
      <h2 className="text-3xl font-extrabold text-gray-900 mb-2">{survey.title}</h2>
      <p className="text-gray-600 mb-8">{survey.description || 'Cargando preguntas de la encuesta...'}</p>

      {/* 🔶 Recuadro informativo solo para LSAS */}
      {isLsasSurvey && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6 text-gray-800">
          <h3 className="font-bold text-lg mb-2">
            Escala de Ansiedad Social de Liebowitz (LSAS)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm leading-relaxed">
            <div>
              <p className="font-semibold">Miedo o ansiedad</p>
              <p>0 = Nada de miedo o ansiedad</p>
              <p>1 = Un poco de miedo o ansiedad</p>
              <p>2 = Bastante miedo o ansiedad</p>
              <p>3 = Mucho miedo o ansiedad</p>
            </div>
            <div>
              <p className="font-semibold">Evitación</p>
              <p>0 = Nunca lo evito (0%)</p>
              <p>1 = En ocasiones lo evito (1–33%)</p>
              <p>2 = Frecuentemente lo evito (33–67%)</p>
              <p>3 = Habitualmente lo evito (67–100%)</p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8 min-w-0">
        {questions.map((q, index) => {
          const miedoKey = `${q.id}__miedo`;
          const evitKey = `${q.id}__evitacion`;

          return (
            <div
              key={q.id}
              className="p-4 border-l-4 border-orange-500 bg-gray-50 rounded-r-lg shadow-sm min-w-0"
            >
              <label className="block text-lg font-semibold text-gray-800 mb-3">
                {index + 1}. {q.text} {q.required && <span className="text-red-500">*</span>}
              </label>

              {q.type === 'multiple-choice' && q.options && q.options.length > 0 && (
                <div className="space-y-2 min-w-0">
                  {q.options.map((opt, i) => (
                    <label
                      key={`${q.id}-${i}`}
                      className="relative flex items-start gap-3 w-full min-w-0"
                    >
                      <input
                        type="radio"
                        name={`q-${q.id}`}
                        value={opt.value}
                        checked={answers[q.id] === opt.value}
                        onChange={(e) => handleChange(q.id, e.target.value)}
                        className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 shrink-0 relative z-10"
                        required={q.required}
                      />
                      <span
                        className="text-gray-800 flex-1 min-w-0 whitespace-pre-wrap break-words leading-normal relative z-10"
                      >
                        {opt.label}
                      </span>
                    </label>
                  ))}
                </div>
              )}

              {q.type === 'lsas' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
                  <div className="min-w-0">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Miedo/ansiedad (0–3)
                    </label>
                    <input
                      type="number"
                      min={q.scaleMin ?? 0}
                      max={q.scaleMax ?? 3}
                      step={1}
                      value={answers[miedoKey] ?? ''}
                      onChange={(e) => {
                        const val = e.target.value === '' ? '' : Number(e.target.value);
                        handleChange(miedoKey, val);
                      }}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                      required={q.required}
                    />
                  </div>

                  <div className="min-w-0">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Evitación (0–3)
                    </label>
                    <input
                      type="number"
                      min={q.scaleMin ?? 0}
                      max={q.scaleMax ?? 3}
                      step={1}
                      value={answers[evitKey] ?? ''}
                      onChange={(e) => {
                        const val = e.target.value === '' ? '' : Number(e.target.value);
                        handleChange(evitKey, val);
                      }}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                      required={q.required}
                    />
                  </div>
                </div>
              )}

              {q.type === 'text' && (
                <input
                  type="text"
                  value={answers[q.id] || ''}
                  onChange={(e) => handleChange(q.id, e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                  required={q.required}
                />
              )}
            </div>
          );
        })}

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
