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
  userId: string;
  onComplete: (surveyId: string, answers: Answer[]) => void;
  onCancel: () => void;
}

export const SurveyForm: React.FC<SurveyFormProps> = ({ survey, userId, onComplete, onCancel }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string | number>>({});
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  const progressKey = `survey-progress:${userId}:${survey.id}`;

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
      }));
  };

  // Carga de preguntas
  useEffect(() => {
    const fetchQuestions = async () => {
      setLoading(true);
      try {
        const response = await fetch(`http://localhost:3001/api/surveys/${survey.id}/questions`);
        if (!response.ok) throw new Error(`Error ${response.status}`);
        const data: DBQuestion[] = await response.json();

        const mapped: Question[] = data.map((dbq) => {
          const rawOpts = dbq.opciones || [];
          const hasLSAS = rawOpts.some((o) => {
            const s = (o.subescala || '').toLowerCase();
            return s === 'miedo' || s === 'evitacion';
          });

          if (hasLSAS) {
            return {
              id: String(dbq.id),
              text: sanitize(dbq.texto),
              type: 'lsas' as Question['type'],
              required: true,
              options: [],
            };
          }

          const opts = toQuestionOptions(rawOpts);
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

        // Restaurar progreso guardado (si existe) para este usuario y encuesta
        try {
          const raw = window.localStorage.getItem(progressKey);
          if (raw) {
            const parsed = JSON.parse(raw) as {
              answers?: Record<string, string | number>;
              currentIndex?: number;
            };

            if (parsed.answers && typeof parsed.answers === 'object') {
              setAnswers(parsed.answers);
            } else {
              setAnswers({});
            }

            const idx =
              typeof parsed.currentIndex === 'number' && parsed.currentIndex >= 0
                ? Math.min(parsed.currentIndex, mapped.length - 1)
                : 0;
            setCurrentIndex(idx);
          } else {
            setAnswers({});
            setCurrentIndex(0);
          }
        } catch {
          setAnswers({});
          setCurrentIndex(0);
        }

        setError(null);
      } catch (e) {
        console.error(e);
        setError('Hubo un problema al cargar las preguntas.');
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [survey.id, userId, progressKey]);

  const handleChange = (questionId: string, value: string | number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  // Guardar progreso parcial en localStorage
  useEffect(() => {
    if (!questions.length) return;
    try {
      const payload = {
        answers,
        currentIndex,
      };
      window.localStorage.setItem(progressKey, JSON.stringify(payload));
    } catch {
      // Ignorar errores de almacenamiento
    }
  }, [answers, currentIndex, progressKey, questions.length]);

  const validateCurrent = (): boolean => {
    if (!questions.length) return false;
    const q = questions[currentIndex];
    if (!q.required) return true;
    if (q.type === 'lsas') {
      const m = answers[`${q.id}|miedo`];
      const e = answers[`${q.id}|evitacion`];
      const okM = !Number.isNaN(Number(m)) && Number(m) >= 0 && Number(m) <= 3;
      const okE = !Number.isNaN(Number(e)) && Number(e) >= 0 && Number(e) <= 3;
      return okM && okE;
    }
    if (q.type === 'multiple-choice') {
      return Object.prototype.hasOwnProperty.call(answers, q.id) && answers[q.id] !== '';
    }
    if (q.type === 'text') {
      const v = answers[q.id];
      return typeof v === 'string' ? v.trim().length > 0 : !!v;
    }
    return true;
  };

  const goNext = () => {
    if (!validateCurrent()) return;
    setCurrentIndex((i) => Math.min(i + 1, questions.length - 1));
  };

  const goPrev = () => setCurrentIndex((i) => Math.max(i - 1, 0));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateCurrent()) return;
    const finalAnswers: Answer[] = Object.keys(answers).map((questionId) => ({
      questionId,
      answer: answers[questionId],
    }));

    // Limpiar el progreso guardado al completar la encuesta
    try {
      window.localStorage.removeItem(progressKey);
    } catch {
      // Ignorar errores al limpiar
    }

    onComplete(survey.id, finalAnswers);
  };

  // Estados 
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

  const q = questions[currentIndex];

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-gray-200 min-w-0">
      <h2 className="text-3xl font-extrabold text-gray-900 mb-2">{survey.title}</h2>
      <p className="text-gray-600 mb-8">{survey.description}</p>

      <form onSubmit={handleSubmit} className="space-y-8 min-w-0">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Pregunta {currentIndex + 1} de {questions.length}</span>
          <div className="flex-1 ml-4 h-2 bg-gray-200 rounded">
            <div className="h-2 bg-orange-500 rounded" style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }} />
          </div>
        </div>

        {questions.some(x => x.type === 'lsas') && (
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
                <p>0 = Nunca lo evito</p>
                <p>1 = En ocasiones lo evito</p>
                <p>2 = Frecuentemente lo evito</p>
                <p>3 = Habitualmente lo evito</p>
              </div>
            </div>
          </div>
        )}

        {([q] as Question[]).map((qq) => (
          <div key={`q-${qq.id}`} className="p-4 border-l-4 border-orange-500 bg-gray-50 rounded-r-lg shadow-sm min-w-0">
            <label className="block text-lg font-semibold text-gray-800 mb-3">
              {currentIndex + 1}. {qq.text} {qq.required && <span className="text-red-500">*</span>}
            </label>

            {qq.type === 'lsas' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Miedo/ansiedad (0-3)</label>
                  <input
                    type="number"
                    min={0}
                    max={3}
                    step={1}
                    inputMode="numeric"
                    placeholder="0 a 3"
                    value={answers[`${qq.id}|miedo`] ?? ''}
                    onChange={(e) => handleChange(`${qq.id}|miedo`, Number(e.target.value))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                    required={qq.required}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Evitación (0-3)</label>
                  <input
                    type="number"
                    min={0}
                    max={3}
                    step={1}
                    inputMode="numeric"
                    placeholder="0 a 3"
                    value={answers[`${qq.id}|evitacion`] ?? ''}
                    onChange={(e) => handleChange(`${qq.id}|evitacion`, Number(e.target.value))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                    required={qq.required}
                  />
                </div>
              </div>
            ) : qq.type === 'multiple-choice' && qq.options && qq.options.length > 0 ? (
              <div className="space-y-2 min-w-0">
                {qq.options.map((opt, i) => (
                  <label key={`${qq.id}-${i}`} className="relative flex items-start gap-3 w-full min-w-0">
                    <input
                      type="radio"
                      name={`q-${qq.id}`}
                      value={String(opt.value)}
                      checked={String(answers[qq.id] ?? '') === String(opt.value)}
                      onChange={(e) => handleChange(qq.id, Number(e.target.value))}
                      className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 shrink-0 relative z-10"
                      required={qq.required}
                    />
                    <span className="text-gray-800 flex-1 min-w-0 whitespace-pre-wrap break-words leading-normal relative z-10">
                      {opt.label}
                    </span>
                    <span aria-hidden className="absolute inset-0 rounded bg-transparent z-0" />
                  </label>
                ))}
              </div>
            ) : (
              <input
                type="text"
                value={answers[qq.id] || ''}
                onChange={(e) => handleChange(qq.id, e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                required={qq.required}
              />
            )}
          </div>
        ))}

        <div className="flex justify-between items-center pt-4 border-t border-gray-200">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={goPrev}
              disabled={currentIndex === 0}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 disabled:opacity-50 hover:bg-gray-100 transition-colors"
            >
              Anterior
            </button>
          </div>
          <div>
            {currentIndex < questions.length - 1 ? (
              <button
                type="button"
                onClick={goNext}
                disabled={!validateCurrent()}
                className="px-6 py-3 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 disabled:opacity-50 transition-colors"
              >
                Siguiente
              </button>
            ) : (
              <button
                type="submit"
                disabled={!validateCurrent()}
                className="px-6 py-3 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 disabled:opacity-50 transition-colors"
              >
                Completar Encuesta
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};
