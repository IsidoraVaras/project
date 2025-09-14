import { Survey, User, SurveyResponse, Category } from '../types';

export const categories: Category[] = [
  {
    id: 'psychosocial',
    title: 'Factores Psicosociales',
    description: 'Evaluación de aspectos psicológicos y sociales que influyen en el bienestar y desarrollo personal',
    icon: 'Brain',
    surveysCount: 5
  },
  {
    id: 'language-learning',
    title: 'Aprendizaje de Lengua Extranjera',
    description: 'Instrumentos para evaluar motivación, ansiedad y estrategias en el aprendizaje de idiomas',
    icon: 'Languages',
    surveysCount: 5
  },
  {
    id: 'reading-comprehension',
    title: 'Comprensión Lectora en L1 y L2',
    description: 'Evaluación de habilidades de comprensión lectora en lengua materna y segunda lengua',
    icon: 'BookOpen',
    surveysCount: 4
  }
];

export const mockSurveys: Survey[] = [
  // Factores Psicosociales
  {
    id: '1',
    title: 'Autodeterminación (Choi, 2021)',
    description: 'Evaluación de la motivación intrínseca y la autodeterminación en el contexto académico',
    category: 'psychosocial',
    author: 'Choi, 2021',
    estimatedTime: '15-20 min',
    questions: [
      {
        id: '1',
        text: 'Me siento libre de expresar mis ideas y opiniones',
        type: 'scale',
        required: true,
        scaleMin: 1,
        scaleMax: 7,
        scaleLabels: { min: 'Totalmente en desacuerdo', max: 'Totalmente de acuerdo' }
      },
      {
        id: '2',
        text: 'Siento que tengo control sobre mis decisiones académicas',
        type: 'scale',
        required: true,
        scaleMin: 1,
        scaleMax: 7,
        scaleLabels: { min: 'Totalmente en desacuerdo', max: 'Totalmente de acuerdo' }
      },
      {
        id: '3',
        text: 'Me siento competente para realizar mis tareas académicas',
        type: 'scale',
        required: true,
        scaleMin: 1,
        scaleMax: 7,
        scaleLabels: { min: 'Totalmente en desacuerdo', max: 'Totalmente de acuerdo' }
      }
    ],
    createdAt: new Date('2024-01-01'),
    isActive: true,
  },
  {
    id: '2',
    title: 'Autoestima de Rosenberg',
    description: 'Escala clásica para medir la autoestima global y autovaloración personal',
    category: 'psychosocial',
    author: 'Rosenberg, 1965',
    estimatedTime: '5-10 min',
    questions: [
      {
        id: '4',
        text: 'En general, estoy satisfecho/a conmigo mismo/a',
        type: 'scale',
        required: true,
        scaleMin: 1,
        scaleMax: 4,
        scaleLabels: { min: 'Muy en desacuerdo', max: 'Muy de acuerdo' }
      },
      {
        id: '5',
        text: 'A veces pienso que no soy bueno/a para nada',
        type: 'scale',
        required: true,
        scaleMin: 1,
        scaleMax: 4,
        scaleLabels: { min: 'Muy en desacuerdo', max: 'Muy de acuerdo' }
      },
      {
        id: '6',
        text: 'Siento que tengo varias cualidades buenas',
        type: 'scale',
        required: true,
        scaleMin: 1,
        scaleMax: 4,
        scaleLabels: { min: 'Muy en desacuerdo', max: 'Muy de acuerdo' }
      }
    ],
    createdAt: new Date('2024-01-02'),
    isActive: true,
  },
  {
    id: '3',
    title: 'Ansiedad Social de Liebowitz',
    description: 'Evaluación de la ansiedad en situaciones sociales y de rendimiento',
    category: 'psychosocial',
    author: 'Liebowitz, 1987',
    estimatedTime: '10-15 min',
    questions: [
      {
        id: '7',
        text: '¿Qué tan ansioso/a te sientes al hablar por teléfono en público?',
        type: 'scale',
        required: true,
        scaleMin: 0,
        scaleMax: 3,
        scaleLabels: { min: 'Nada', max: 'Severo' }
      },
      {
        id: '8',
        text: '¿Qué tan ansioso/a te sientes al participar en reuniones pequeñas?',
        type: 'scale',
        required: true,
        scaleMin: 0,
        scaleMax: 3,
        scaleLabels: { min: 'Nada', max: 'Severo' }
      }
    ],
    createdAt: new Date('2024-01-03'),
    isActive: true,
  },
  {
    id: '4',
    title: 'Bienestar Mental de Warwick-Edinburgh (EBMWE)',
    description: 'Evaluación del bienestar mental y emocional positivo',
    category: 'psychosocial',
    author: 'Warwick-Edinburgh, 2007',
    estimatedTime: '5-10 min',
    questions: [
      {
        id: '9',
        text: 'Me he sentido optimista sobre el futuro',
        type: 'scale',
        required: true,
        scaleMin: 1,
        scaleMax: 5,
        scaleLabels: { min: 'Nunca', max: 'Siempre' }
      },
      {
        id: '10',
        text: 'Me he sentido útil',
        type: 'scale',
        required: true,
        scaleMin: 1,
        scaleMax: 5,
        scaleLabels: { min: 'Nunca', max: 'Siempre' }
      }
    ],
    createdAt: new Date('2024-01-04'),
    isActive: true,
  },
  {
    id: '5',
    title: 'Escala Multidimensional de Apoyo Social Percibido',
    description: 'Evaluación del apoyo social percibido de familia, amigos y personas significativas',
    category: 'psychosocial',
    author: 'Zimet et al., 1988',
    estimatedTime: '5-10 min',
    questions: [
      {
        id: '11',
        text: 'Hay una persona especial que está cerca cuando la necesito',
        type: 'scale',
        required: true,
        scaleMin: 1,
        scaleMax: 7,
        scaleLabels: { min: 'Muy en desacuerdo', max: 'Muy de acuerdo' }
      },
      {
        id: '12',
        text: 'Mi familia realmente trata de ayudarme',
        type: 'scale',
        required: true,
        scaleMin: 1,
        scaleMax: 7,
        scaleLabels: { min: 'Muy en desacuerdo', max: 'Muy de acuerdo' }
      }
    ],
    createdAt: new Date('2024-01-05'),
    isActive: true,
  },

  // Aprendizaje de Lengua Extranjera
  {
    id: '6',
    title: 'Escala de Horwitz de Ansiedad de Clases de Lengua Extranjera',
    description: 'Evaluación de la ansiedad específica en el aprendizaje de idiomas extranjeros',
    category: 'language-learning',
    author: 'Horwitz et al., 1986',
    estimatedTime: '10-15 min',
    questions: [
      {
        id: '13',
        text: 'Nunca me siento muy seguro/a cuando hablo en mi clase de lengua extranjera',
        type: 'scale',
        required: true,
        scaleMin: 1,
        scaleMax: 5,
        scaleLabels: { min: 'Totalmente en desacuerdo', max: 'Totalmente de acuerdo' }
      },
      {
        id: '14',
        text: 'No me preocupa cometer errores en la clase de lengua extranjera',
        type: 'scale',
        required: true,
        scaleMin: 1,
        scaleMax: 5,
        scaleLabels: { min: 'Totalmente en desacuerdo', max: 'Totalmente de acuerdo' }
      }
    ],
    createdAt: new Date('2024-01-06'),
    isActive: true,
  },
  {
    id: '7',
    title: 'Disfrute de Lengua Extranjera',
    description: 'Evaluación del disfrute y emociones positivas en el aprendizaje de idiomas',
    category: 'language-learning',
    author: 'Dewaele & MacIntyre, 2014',
    estimatedTime: '10-15 min',
    questions: [
      {
        id: '15',
        text: 'Disfruto las actividades en mi clase de lengua extranjera',
        type: 'scale',
        required: true,
        scaleMin: 1,
        scaleMax: 5,
        scaleLabels: { min: 'Totalmente en desacuerdo', max: 'Totalmente de acuerdo' }
      },
      {
        id: '16',
        text: 'Me siento emocionado/a cuando uso la lengua extranjera',
        type: 'scale',
        required: true,
        scaleMin: 1,
        scaleMax: 5,
        scaleLabels: { min: 'Totalmente en desacuerdo', max: 'Totalmente de acuerdo' }
      }
    ],
    createdAt: new Date('2024-01-07'),
    isActive: true,
  },
  {
    id: '8',
    title: 'Tamaño del Vocabulario (Vocabulary Size Test)',
    description: 'Evaluación del conocimiento de vocabulario en lengua extranjera',
    category: 'language-learning',
    author: 'Nation & Beglar, 2007',
    estimatedTime: '20-30 min',
    questions: [
      {
        id: '17',
        text: 'BUSINESS: He works in the family business.\n\na) company\nb) house\nc) car\nd) office',
        type: 'multiple-choice',
        options: ['company', 'house', 'car', 'office'],
        required: true,
      },
      {
        id: '18',
        text: 'CLOCK: The clock stopped.\n\na) car\nb) noise\nc) door\nd) time piece',
        type: 'multiple-choice',
        options: ['car', 'noise', 'door', 'time piece'],
        required: true,
      }
    ],
    createdAt: new Date('2024-01-08'),
    isActive: true,
  },
  {
    id: '9',
    title: 'Cuestionario del Sistema Motivacional del Yo en un Idioma Extranjero',
    description: 'Evaluación de la motivación basada en el yo ideal y el yo que debería ser',
    category: 'language-learning',
    author: 'Dörnyei, 2005',
    estimatedTime: '15-20 min',
    questions: [
      {
        id: '19',
        text: 'Imagino que hablo inglés con fluidez',
        type: 'scale',
        required: true,
        scaleMin: 1,
        scaleMax: 6,
        scaleLabels: { min: 'Totalmente en desacuerdo', max: 'Totalmente de acuerdo' }
      },
      {
        id: '20',
        text: 'Creo que es importante aprender inglés porque otras personas esperan que lo haga',
        type: 'scale',
        required: true,
        scaleMin: 1,
        scaleMax: 6,
        scaleLabels: { min: 'Totalmente en desacuerdo', max: 'Totalmente de acuerdo' }
      }
    ],
    createdAt: new Date('2024-01-09'),
    isActive: true,
  },
  {
    id: '10',
    title: 'Cuestionario de Motivación por la Lectura (Wang y Gan, 2021)',
    description: 'Evaluación de la motivación específica para la lectura en lengua extranjera',
    category: 'language-learning',
    author: 'Wang & Gan, 2021',
    estimatedTime: '10-15 min',
    questions: [
      {
        id: '21',
        text: 'Me gusta leer textos en inglés',
        type: 'scale',
        required: true,
        scaleMin: 1,
        scaleMax: 5,
        scaleLabels: { min: 'Totalmente en desacuerdo', max: 'Totalmente de acuerdo' }
      },
      {
        id: '22',
        text: 'Leo en inglés porque quiero mejorar mi comprensión',
        type: 'scale',
        required: true,
        scaleMin: 1,
        scaleMax: 5,
        scaleLabels: { min: 'Totalmente en desacuerdo', max: 'Totalmente de acuerdo' }
      }
    ],
    createdAt: new Date('2024-01-10'),
    isActive: true,
  },

  // Comprensión Lectora en L1 y L2
  {
    id: '11',
    title: 'Comprensión Lectora L1 - Encuesta 1',
    description: 'Evaluación de estrategias de comprensión lectora en lengua materna',
    category: 'reading-comprehension',
    author: 'En desarrollo',
    estimatedTime: '15-20 min',
    questions: [
      {
        id: '23',
        text: 'Cuando leo un texto difícil, trato de relacionarlo con lo que ya sé',
        type: 'scale',
        required: true,
        scaleMin: 1,
        scaleMax: 5,
        scaleLabels: { min: 'Nunca', max: 'Siempre' }
      },
      {
        id: '24',
        text: 'Antes de leer, reviso el texto para tener una idea general',
        type: 'scale',
        required: true,
        scaleMin: 1,
        scaleMax: 5,
        scaleLabels: { min: 'Nunca', max: 'Siempre' }
      }
    ],
    createdAt: new Date('2024-01-11'),
    isActive: true,
  },
  {
    id: '12',
    title: 'Comprensión Lectora L2 - Encuesta 2',
    description: 'Evaluación de estrategias de comprensión lectora en segunda lengua',
    category: 'reading-comprehension',
    author: 'En desarrollo',
    estimatedTime: '15-20 min',
    questions: [
      {
        id: '25',
        text: 'Cuando leo en inglés, uso el contexto para entender palabras desconocidas',
        type: 'scale',
        required: true,
        scaleMin: 1,
        scaleMax: 5,
        scaleLabels: { min: 'Nunca', max: 'Siempre' }
      },
      {
        id: '26',
        text: 'Me siento confiado/a leyendo textos académicos en inglés',
        type: 'scale',
        required: true,
        scaleMin: 1,
        scaleMax: 5,
        scaleLabels: { min: 'Totalmente en desacuerdo', max: 'Totalmente de acuerdo' }
      }
    ],
    createdAt: new Date('2024-01-12'),
    isActive: true,
  },
  {
    id: '13',
    title: 'Comprensión Lectora Comparativa - Encuesta 3',
    description: 'Comparación de procesos de comprensión entre L1 y L2',
    category: 'reading-comprehension',
    author: 'En desarrollo',
    estimatedTime: '20-25 min',
    questions: [
      {
        id: '27',
        text: 'Leo más rápido en mi lengua materna que en inglés',
        type: 'scale',
        required: true,
        scaleMin: 1,
        scaleMax: 5,
        scaleLabels: { min: 'Totalmente en desacuerdo', max: 'Totalmente de acuerdo' }
      },
      {
        id: '28',
        text: 'Uso las mismas estrategias de lectura en ambos idiomas',
        type: 'scale',
        required: true,
        scaleMin: 1,
        scaleMax: 5,
        scaleLabels: { min: 'Totalmente en desacuerdo', max: 'Totalmente de acuerdo' }
      }
    ],
    createdAt: new Date('2024-01-13'),
    isActive: true,
  },
  {
    id: '14',
    title: 'Metacognición en Comprensión Lectora - Encuesta 4',
    description: 'Evaluación de la conciencia metacognitiva en la comprensión lectora',
    category: 'reading-comprehension',
    author: 'En desarrollo',
    estimatedTime: '15-20 min',
    questions: [
      {
        id: '29',
        text: 'Soy consciente de cuándo no entiendo lo que estoy leyendo',
        type: 'scale',
        required: true,
        scaleMin: 1,
        scaleMax: 5,
        scaleLabels: { min: 'Nunca', max: 'Siempre' }
      },
      {
        id: '30',
        text: 'Ajusto mi velocidad de lectura según la dificultad del texto',
        type: 'scale',
        required: true,
        scaleMin: 1,
        scaleMax: 5,
        scaleLabels: { min: 'Nunca', max: 'Siempre' }
      }
    ],
    createdAt: new Date('2024-01-14'),
    isActive: true,
  }
];

export const mockUsers: User[] = [
  {
    id: '1',
    name: 'Dr. Admin',
    email: 'admin@encuestas.com',
    role: 'admin',
  },
  {
    id: '2',
    name: 'Juan Pérez',
    email: 'juan@email.com',
    role: 'client',
  },
  {
    id: '3',
    name: 'Carlos Rodríguez',
    email: 'carlos@email.com',
    role: 'client',
  },
  {
    id: '4',
    name: 'María López',
    email: 'maria@email.com',
    role: 'client',
  },
];

export const mockResponses: SurveyResponse[] = [
  {
    id: '1',
    surveyId: '1',
    userId: '2',
    answers: [
      { questionId: '1', answer: 6 },
      { questionId: '2', answer: 5 },
      { questionId: '3', answer: 7 },
    ],
    completedAt: new Date('2024-01-15'),
  },
  {
    id: '2',
    surveyId: '6',
    userId: '2',
    answers: [
      { questionId: '13', answer: 3 },
      { questionId: '14', answer: 2 },
    ],
    completedAt: new Date('2024-01-16'),
  },
  {
    id: '3',
    surveyId: '2',
    userId: '3',
    answers: [
      { questionId: '4', answer: 3 },
      { questionId: '5', answer: 2 },
      { questionId: '6', answer: 4 },
    ],
    completedAt: new Date('2024-01-17'),
  },
  {
    id: '4',
    surveyId: '11',
    userId: '4',
    answers: [
      { questionId: '23', answer: 4 },
      { questionId: '24', answer: 5 },
    ],
    completedAt: new Date('2024-01-18'),
  },
];