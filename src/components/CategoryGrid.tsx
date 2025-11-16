import React from 'react';
import { Brain, Languages, BookOpen, ChevronRight } from 'lucide-react';
import { Category } from '../types';

interface CategoryGridProps {
  categories: Category[];
  onCategorySelect: (categoryId: string) => void;
  surveys?: { id: string; category: string; isActive?: boolean }[];
}

const iconMap = {
  Brain,
  Languages,
  BookOpen,
};

export const CategoryGrid: React.FC<CategoryGridProps> = ({ categories, onCategorySelect, surveys = [] }) => {
  return (
    <div>
      {/* Encabezado de la sección de categorías */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Categorías de Encuestas</h2>
        <p className="text-gray-700 text-lg">
          Selecciona una categoría para explorar las encuestas disponibles
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {categories.map((category) => {
          const categoryName = category.nombre || '';
          const iconKey = categoryName.includes('Psicosociales')
            ? 'Brain'
            : categoryName.includes('Lengua')
              ? 'Languages'
              : 'BookOpen';
          const IconComponent = iconMap[iconKey as keyof typeof iconMap];

          // Cantidad de encuestas asociadas a esta categoría
          const count = surveys.filter((s) => String(s.category) === String(category.id)).length;

          return (
            <div
              key={category.id}
              className="bg-white border-2 border-gray-300 rounded-2xl p-8 hover:border-orange-500 hover:shadow-xl transition-all duration-300 group cursor-pointer transform hover:-translate-y-1"
              onClick={() => onCategorySelect(String(category.id))} // Notifica al padre qué categoría se seleccionó
            >
              <div className="text-center">
                <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-orange-200 transition-colors">
                  <IconComponent className="h-10 w-10 text-orange-600" />
                </div>
                
                {/* Nombre de la categoría */}
                <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-orange-600 transition-colors">
                  {category.nombre}
                </h3>
                
                
                {/* Pie de la tarjeta*/}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                    {count} encuestas
                  </span>
                  
                  <div className="flex items-center space-x-2 text-orange-600 font-semibold group-hover:text-orange-700">
                    <span>IR</span>
                    <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
