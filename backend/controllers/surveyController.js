import { getConnection } from '../db.js';
import sql from 'mssql';

// Obtener categorías
const getCategories = async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request().query('SELECT id, nombre FROM dbo.categorias');
    res.status(200).json(result.recordset);
  } catch (err) {
    console.error('Error al obtener las categorías:', err);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

// Obtener encuestas por categoría
const getSurveysByCategory = async (req, res) => {
  const { id } = req.params;
  const categoryId = parseInt(id, 10);

  if (isNaN(categoryId)) {
    return res.status(400).json({ message: 'ID de categoría inválido.' });
  }

  try {
    const pool = await getConnection();
    // Encuestras filtradas por categoría
    const result = await pool
      .request()
      .input('categoryId', sql.Int, categoryId)
      .query(
        'SELECT id, titulo, descripcion, id_categoria FROM dbo.encuestas WHERE id_categoria = @categoryId'
      );

    res.status(200).json(result.recordset);
  } catch (err) {
    console.error(`Error al obtener encuestas para la categoría ${id}:`, err);
    res.status(500).json({ message: 'Error interno del servidor al buscar encuestas.' });
  }
};

// Obtener preguntas por encuesta
const getQuestionsBySurvey = async (req, res) => {
  const { id } = req.params;
  const surveyId = parseInt(id, 10);

  if (isNaN(surveyId)) {
    return res.status(400).json({ message: 'ID de encuesta inválido.' });
  }

  try {
    const pool = await getConnection();

    // 1) Preguntas de la encuesta
    const questionsResult = await pool
      .request()
      .input('surveyId', sql.Int, surveyId)
      .query(
        `SELECT p.id, p.texto
         FROM dbo.preguntas AS p
         WHERE p.id_encuesta = @surveyId
         ORDER BY p.id`
      );

    const questions = questionsResult.recordset;
    if (!questions || questions.length === 0) {
      return res.status(200).json([]);
    }

    // 2) Opciones de respuesta asociadas a las preguntas de la encuesta
    const optionsResult = await pool
      .request()
      .input('surveyId', sql.Int, surveyId)
      .query(
        `SELECT o.id,
                o.orden,
                o.etiqueta,
                o.valor,
                o.tipo_escala,
                o.subescala,
                o.id_pregunta
         FROM dbo.opciones_respuesta AS o
         INNER JOIN dbo.preguntas AS p ON p.id = o.id_pregunta
         WHERE p.id_encuesta = @surveyId
         ORDER BY o.id_pregunta, o.orden`
      );

    const options = optionsResult.recordset || [];

    // 3) Agrupar opciones 
    const optionsByQuestion = options.reduce((acc, opt) => {
      const key = String(opt.id_pregunta);
      if (!acc[key]) acc[key] = [];
      acc[key].push({
        id: opt.id,
        orden: opt.orden,
        etiqueta: opt.etiqueta,
        valor: opt.valor,
        tipo_escala: opt.tipo_escala,
        subescala: opt.subescala,
        id_pregunta: opt.id_pregunta,
      });
      return acc;
    }, {});

    const payload = questions.map((q) => ({
      id: q.id,
      texto: q.texto,
      opciones: optionsByQuestion[String(q.id)] || [],
    }));

    res.status(200).json(payload);
  } catch (err) {
    console.error(`Error al obtener preguntas para la encuesta ${id}:`, err);
    res.status(500).json({ message: 'Error interno del servidor al buscar preguntas.' });
  }
};

export { getCategories, getSurveysByCategory, getQuestionsBySurvey };

// listar todas las encuestas 
export const getAllSurveys = async (_req, res) => {
  try {
    const pool = await getConnection();
    // Lista todas las encuestas con el nombre de su categoría
    const result = await pool
      .request()
      .query(
        `SELECT e.id, e.titulo, e.descripcion, e.id_categoria, c.nombre AS categoria_nombre
         FROM dbo.encuestas e
         LEFT JOIN dbo.categorias c ON c.id = e.id_categoria
         ORDER BY e.id`
      );
    res.status(200).json(result.recordset);
  } catch (err) {
    console.error('Error al listar encuestas:', err);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};
