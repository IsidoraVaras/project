// src/components/AdminDashboard.tsx
import React, { useState, useEffect } from 'react';
import { Users, ClipboardList, BarChart3, Eye, ArrowLeft, UserPlus, EyeOff } from 'lucide-react';
import { User, SurveyResponse, Survey } from '../types';

interface AdminDashboardProps {
  user: User;
}

type View = 'overview' | 'responses' | 'user-detail' | 'create-admin';

export const AdminDashboard: React.FC<AdminDashboardProps> = () => {
  const [currentView, setCurrentView] = useState<View>('overview');
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [clients, setClients] = useState<User[]>([]);
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [surveyQuestions, setSurveyQuestions] = useState<Record<string, {id: string; text: string}[]>>({});
  // Formulario de creación de admin
  const [adminForm, setAdminForm] = useState({ nombre: '', apellido: '', email: '', password: '' });
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [creatingAdmin, setCreatingAdmin] = useState(false);
  const [createAdminMsg, setCreateAdminMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [clientsRes, responsesRes, surveysRes] = await Promise.all([
          fetch('http://localhost:3001/api/users'),
          fetch('http://localhost:3001/api/responses'),
          fetch('http://localhost:3001/api/surveys'),
        ]);
        
        const clientsData = await clientsRes.json();
        const responsesData = await responsesRes.json();
        const surveysRaw = await surveysRes.json();

        setClients(clientsData.filter((u: User) => u.role === 'client'));
        setResponses(responsesData);
        // Mapear encuestas del backend a la interfaz Survey
        const mappedSurveys: Survey[] = surveysRaw.map((s: any) => ({
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
        setSurveys(mappedSurveys);

      } catch (error) {
        console.error('Error fetching admin data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Cargar textos de preguntas para el usuario seleccionado (muestra en detalle)
  useEffect(() => {
    const loadQuestions = async () => {
      if (currentView !== 'user-detail' || !selectedUserId) return;
      const userResponses = responses.filter(r => String(r.userId) === String(selectedUserId));
      const surveyIds = Array.from(new Set(userResponses.map(r => String(r.surveyId))));
      const entries = await Promise.all(
        surveyIds.map(async (sid) => {
          try {
            const res = await fetch(`http://localhost:3001/api/surveys/${sid}/questions`);
            if (!res.ok) return [sid, []] as const;
            const data = await res.json();
            const arr = (data || []).map((q: any) => ({ id: String(q.id), text: q.texto }));
            return [sid, arr] as const;
          } catch {
            return [sid, []] as const;
          }
        })
      );
      const map: Record<string, {id: string; text: string}[]> = {};
      for (const [sid, qs] of entries) map[String(sid)] = qs;
      setSurveyQuestions(map);
    };
    loadQuestions();
  }, [currentView, selectedUserId, responses]);

  if (loading) {
    return <div className="text-center py-12">Cargando datos del panel de administración...</div>;
  }
  
  const getResponsesForUser = (userId: string) => {
    return responses.filter(r => String(r.userId) === String(userId));
  };

  const renderOverview = () => (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Panel de Administración</h2>
        <p className="text-gray-700 text-lg">Resumen general del sistema de encuestas</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white border-2 border-gray-300 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Participantes</p>
              <p className="text-3xl font-bold text-gray-900">{clients.length}</p>
            </div>
            <Users className="h-8 w-8 text-orange-500" />
          </div>
        </div>

        <div className="bg-white border-2 border-gray-300 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Encuestas Disponibles</p>
              <p className="text-3xl font-bold text-gray-900">{surveys.filter(s => s.isActive).length}</p>
            </div>
            <ClipboardList className="h-8 w-8 text-orange-500" />
          </div>
        </div>

        <div className="bg-white border-2 border-gray-300 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Respuestas Recibidas</p>
              <p className="text-3xl font-bold text-gray-900">{responses.length}</p>
            </div>
            <BarChart3 className="h-8 w-8 text-orange-500" />
          </div>
        </div>
      </div>

      <div className="bg-white border-2 border-gray-300 rounded-xl p-6 shadow-sm">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Participantes y sus Encuestas</h3>
        <div className="space-y-4">
          {clients.filter(c => getResponsesForUser(c.id).length > 0).map((client) => {
            const userResponses = getResponsesForUser(client.id);
            return (
              <div key={client.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-300">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{client.nombre} {client.apellido}</h4>
                  <p className="text-sm text-gray-600">{client.email}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {userResponses.length} encuesta{userResponses.length !== 1 ? 's' : ''} completada{userResponses.length !== 1 ? 's' : ''}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Última: {new Date(Math.max(...userResponses.map(r => new Date(r.completedAt as any).getTime()))).toLocaleDateString('es-ES')}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedUserId(client.id);
                    setCurrentView('user-detail');
                  }}
                  className="flex items-center space-x-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors"
                >
                  <Eye className="h-4 w-4" />
                  <span>Ver detalles</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderResponses = () => (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Todas las Respuestas</h2>
        <p className="text-gray-700 text-lg">Lista completa de encuestas respondidas</p>
      </div>

      <div className="space-y-4">
        {responses.map((response) => {
          const user = clients.find(u => u.id === response.userId);
          const survey = surveys.find(s => s.id === response.surveyId);
          
          return (
            <div key={response.id} className="bg-white border-2 border-gray-300 rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{survey?.title}</h3>
                  <p className="text-gray-600">Respondida por: <span className="font-medium">{user?.nombre} {user?.apellido}</span></p>
                  <p className="text-sm text-gray-500">{new Date(response.completedAt).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</p>
                </div>
                <button
                  onClick={() => {
                    setSelectedUserId(response.userId);
                    setCurrentView('user-detail');
                  }}
                  className="flex items-center space-x-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors"
                >
                  <Eye className="h-4 w-4" />
                  <span>Ver detalles</span>
                </button>
              </div>

              <div className="border-t border-gray-300 pt-4">
                <h4 className="text-gray-900 font-medium mb-3">Respuestas:</h4>
                <div className="grid gap-3">
                  {response.answers.slice(0, 2).map((answer, index) => {
                    const question = surveys.find(s => s.id === response.surveyId)?.questions.find(q => q.id === answer.questionId);
                    return (
                      <div key={index} className="bg-gray-50 p-3 rounded-lg border border-gray-300">
                        <p className="text-gray-700 text-sm mb-1">{question?.text}</p>
                        <p className="text-gray-900 font-medium">{answer.answer.toString()}</p>
                      </div>
                    );
                  })}
                  {response.answers.length > 2 && (
                    <p className="text-sm text-gray-500 italic">
                      ... y {response.answers.length - 2} respuesta{response.answers.length - 2 !== 1 ? 's' : ''} más
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderCreateAdmin = () => (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Crear Usuario Administrador</h2>
      </div>

      <div className="bg-white border-2 border-gray-300 rounded-xl p-6 shadow-sm max-w-2xl">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setCreatingAdmin(true);
            setCreateAdminMsg(null);
            try {
              const res = await fetch('http://localhost:3001/api/admin/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(adminForm),
              });
              if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.message || 'No se pudo crear el administrador');
              }
              await res.json();
              setCreateAdminMsg({ type: 'success', text: 'Administrador creado correctamente.' });
              setAdminForm({ nombre: '', apellido: '', email: '', password: '' });
              // actualizar lista de usuarios si ya estaba cargada
              try {
                const clientsRes = await fetch('http://localhost:3001/api/users');
                const clientsData = await clientsRes.json();
                setClients(clientsData.filter((u: any) => u.role === 'client'));
              } catch {}
            } catch (err: any) {
              setCreateAdminMsg({ type: 'error', text: err.message || 'Error al crear administrador.' });
            } finally {
              setCreatingAdmin(false);
            }
          }}
          className="space-y-5"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
              <input
                type="text"
                value={adminForm.nombre}
                onChange={(e) => setAdminForm((f) => ({ ...f, nombre: e.target.value }))}
                className="w-full rounded-lg border-2 border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 px-3 py-2 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Apellido</label>
              <input
                type="text"
                value={adminForm.apellido}
                onChange={(e) => setAdminForm((f) => ({ ...f, apellido: e.target.value }))}
                className="w-full rounded-lg border-2 border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 px-3 py-2 outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Correo</label>
            <input
              type="email"
              value={adminForm.email}
              onChange={(e) => setAdminForm((f) => ({ ...f, email: e.target.value }))}
              className="w-full rounded-lg border-2 border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 px-3 py-2 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
            <div className="relative">
              <input
                type={showAdminPassword ? 'text' : 'password'}
                value={adminForm.password}
                onChange={(e) => setAdminForm((f) => ({ ...f, password: e.target.value }))}
                className="w-full rounded-lg border-2 border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 px-3 py-2 pr-10 outline-none"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                title={showAdminPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                onClick={() => setShowAdminPassword((v) => !v)}
                className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-600 hover:text-gray-900"
              >
                {showAdminPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">El rol asignado será <span className="font-semibold">admin</span>.</p>
          </div>

          {createAdminMsg && (
            <div
              className={`rounded-lg p-3 border-2 ${
                createAdminMsg.type === 'success'
                  ? 'border-green-300 bg-green-50 text-green-800'
                  : 'border-red-300 bg-red-50 text-red-800'
              }`}
            >
              {createAdminMsg.text}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={creatingAdmin}
              className={`inline-flex items-center px-5 py-2 rounded-lg text-white transition-colors ${
                creatingAdmin ? 'bg-orange-400' : 'bg-orange-600 hover:bg-orange-700'
              }`}
            >
              <UserPlus className="h-5 w-5 mr-2" />
              {creatingAdmin ? 'Creando...' : 'Crear Admin'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  const renderUserDetail = () => {
    const user = clients.find(u => u.id === selectedUserId);
    const userResponses = getResponsesForUser(selectedUserId);

    if (!user) return null;

    return (
      <div>
        <div className="flex items-center mb-8">
          <button
            onClick={() => setCurrentView('overview')}
            className="flex items-center text-gray-600 hover:text-gray-900 mr-6 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Volver al panel
          </button>
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Detalles de {user.nombre} {user.apellido}</h2>
            <p className="text-gray-700 text-lg">{user.email}</p>
          </div>
        </div>

        <div className="mb-6 bg-white border-2 border-gray-300 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Resumen de Participación</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Encuestas Completadas</p>
              <p className="text-2xl font-bold text-gray-900">{userResponses.length}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Última Actividad</p>
              <p className="text-sm text-gray-900">
                {userResponses.length > 0 
                  ? new Date(Math.max(...userResponses.map(r => new Date(r.completedAt).getTime()))).toLocaleDateString('es-ES')
                  : 'Sin actividad'
                }
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-xl font-bold text-gray-900">Encuestas Completadas</h3>
          
          {userResponses.length === 0 ? (
            <div className="text-center py-12 bg-white border-2 border-gray-300 rounded-xl">
              <ClipboardList className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Este usuario no ha completado ninguna encuesta aún.</p>
            </div>
          ) : (
            userResponses.map((response) => {
              const survey = surveys.find(s => s.id === response.surveyId);
              
              return (
                <div key={response.id} className="bg-white border-2 border-gray-300 rounded-xl p-6 shadow-sm">
                  <div className="mb-4">
                    <h4 className="text-lg font-bold text-gray-900">{survey?.title}</h4>
                    <p className="text-gray-600">{survey?.description}</p>
                    <p className="text-sm text-gray-600 mt-1">Categoría: {survey?.author || survey?.category}</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Completada el {new Date(response.completedAt).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>

                  <div className="border-t border-gray-300 pt-4">
                    {response.totals && (
                      <div className="mb-4 bg-gray-50 p-3 rounded border">
                        <div className="text-gray-800">
                          <p>
                            Puntaje total: <span className="font-semibold">{response.totals.total}</span>
                            {response.totals.classification && (
                              <span className="ml-2">({response.totals.classification})</span>
                            )}
                          </p>
                          {typeof response.totals.avg !== 'undefined' && (
                            <p>Promedio: <span className="font-semibold">{response.totals.avg}</span></p>
                          )}
                        </div>
                      </div>
                    )}
                    <h5 className="text-gray-900 font-medium mb-3">Respuestas completas:</h5>
                    <div className="grid gap-3">
                      {(() => {
                        const groups: Record<string, { miedo?: any; evitacion?: any; raw: any[] }> = {};
                        for (const a of response.answers) {
                          const [base, sub] = String(a.questionId).split('|');
                          if (!groups[base]) groups[base] = { raw: [] };
                          if (sub === 'miedo') groups[base].miedo = a.answer;
                          else if (sub === 'evitacion') groups[base].evitacion = a.answer;
                          else groups[base].raw.push(a);
                        }
                        const items = Object.entries(groups);
                        const arr: JSX.Element[] = [];
                        const qArr = surveyQuestions[String(response.surveyId)] || [];
                        const getText = (baseId: string) => qArr.find(q => q.id === baseId)?.text || `Ítem ${baseId}`;

                        items.forEach(([baseId, g], index) => {
                          if (g.miedo !== undefined || g.evitacion !== undefined) {
                            arr.push(
                              <div key={`lsas-${baseId}-${index}`} className="bg-gray-50 p-4 rounded-lg border border-gray-300">
                                <p className="text-gray-700 text-sm mb-2 font-medium">{getText(baseId)}</p>
                                <p className="text-gray-900 font-medium">Miedo/ansiedad: {String(g.miedo ?? '-') } | Evitación: {String(g.evitacion ?? '-')}</p>
                              </div>
                            );
                          }
                          g.raw.forEach((answer, i) => {
                            arr.push(
                              <div key={`raw-${baseId}-${i}`} className="bg-gray-50 p-4 rounded-lg border border-gray-300">
                                <p className="text-gray-700 text-sm mb-2 font-medium">{getText(baseId)}</p>
                                <span className="text-gray-900 font-medium">{String(answer.answer)}</span>
                              </div>
                            );
                          });
                        });
                        return arr;
                      })()}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (currentView) {
      case 'overview':
        return renderOverview();
      case 'responses':
        return renderResponses();
      case 'user-detail':
        return renderUserDetail();
      case 'create-admin':
        return renderCreateAdmin();
      default:
        return renderOverview();
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
                  onClick={() => setCurrentView('overview')}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    currentView === 'overview' || currentView === 'user-detail'
                      ? 'bg-orange-600 text-white'
                      : 'text-gray-800 hover:bg-gray-100'
                  }`}
                >
                  <BarChart3 className="h-5 w-5" />
                  <span>Panel General</span>
                </button>

                <button
                  onClick={() => setCurrentView('responses')}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    currentView === 'responses'
                      ? 'bg-orange-600 text-white'
                      : 'text-gray-800 hover:bg-gray-100'
                  }`}
                >
                  <ClipboardList className="h-5 w-5" />
                  <span>Todas las Respuestas</span>
                </button>

                <button
                  onClick={() => setCurrentView('create-admin')}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    currentView === 'create-admin'
                      ? 'bg-orange-600 text-white'
                      : 'text-gray-800 hover:bg-gray-100'
                  }`}
                >
                  <UserPlus className="h-5 w-5" />
                  <span>Crear Admin</span>
                </button>
              </div>
            </nav>
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
