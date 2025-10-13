// src/components/CategorySurveys.tsx

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Clock, User, ChevronRight, Loader2 } from 'lucide-react';
import { Survey, Question } from '../types'; 

// 1. Interfaz de datos esperados del Backend (basado en dbo.encuestas)
interface DBSurvey {
    id: number; // PK, int, No NULL
    titulo: string; // nvarchar(200), No NULL
    descripcion: string; // nvarchar(max), NULL
    id_categoria: number; // FK, int, No NULL
}

// 2. Interfaz de Props esperadas por el componente (sin la prop 'surveys')
interface CategorySurveysProps {
    categoryId: number; // Recibe el ID numérico del padre (ClientDashboard)
    categoryTitle: string; 
    onBack: () => void;
    onSurveySelect: (survey: Survey) => void;
}

export const CategorySurveys: React.FC<CategorySurveysProps> = ({ 
    categoryId, 
    categoryTitle, 
    onBack, 
    onSurveySelect 
}) => {
    // Estados internos para gestionar la carga de encuestas
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
                // LLAMADA CLAVE: Llama a la API usando el ID de la categoría
                const response = await fetch(`http://localhost:3001/api/categories/${categoryId}/surveys`); 
                
                if (!response.ok) {
                    // Si el backend devuelve un error, lo capturamos aquí
                    const errorText = response.statusText || 'Error desconocido';
                    throw new Error(`Error al cargar las encuestas. Estado: ${response.status} - ${errorText}`);
                }

                const data: DBSurvey[] = await response.json();
                
                // Mapeo: Conversión de tipos y nombres de campos (DB -> Frontend)
                const mappedSurveys: Survey[] = data.map(dbSurvey => ({
                    id: String(dbSurvey.id), // Convierte number a string para la interfaz Survey
                    title: dbSurvey.titulo, // Mapea titulo a title
                    description: dbSurvey.descripcion || 'Sin descripción.', // Mapea descripcion a description
                    
                    // Campos placeholders para cumplir con la interfaz Survey
                    category: String(dbSurvey.id_categoria), // Usamos el ID de categoría como string
                    questions: Array(Math.floor(Math.random() * 10) + 5).fill({} as Question), 
                    createdAt: new Date(),
                    isActive: true,
                    estimatedTime: '5-15 min',
                    author: 'Admin'
                }));

                setSurveys(mappedSurveys);
                setError(null);
            } catch (err: any) {
                console.error("Error al obtener las encuestas:", err);
                // ESTE MENSAJE SE MUESTRA EN PANTALLA
                setError('No se pudieron cargar las encuestas. Intente nuevamente.');
            } finally {
                setLoading(false);
            }
        };

        fetchSurveys();
        
    }, [categoryId]); // Dependencia: Se recarga si el ID de la categoría cambia


    // --- Renderizado de Estado (Loading, Error, No Data) ---
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
                <button 
                    onClick={onBack} 
                    className="mt-4 text-gray-600 hover:text-gray-900 transition-colors underline"
                >
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
                <button
                    onClick={onBack}
                    className="mt-4 text-gray-600 hover:text-gray-900 transition-colors underline"
                >
                    Volver a categorías
                </button>
            </div>
        );
    }

    // --- Renderizado de la Lista de Encuestas ---
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
                    <p className="text-gray-500">
                        {surveys.length} encuestas disponibles.
                    </p>
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