// backend/controllers/surveyController.js

import { getConnection } from '../db.js';
import sql from 'mssql';

// Función para obtener categorías (asumo que ya funciona)
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

// Función para obtener encuestas por categoría (asumo que ya funciona)
const getSurveysByCategory = async (req, res) => {
    const { id } = req.params; 
    const categoryId = parseInt(id, 10);

    if (isNaN(categoryId)) {
        return res.status(400).json({ message: 'ID de categoría inválido.' });
    }

    try {
        const pool = await getConnection();
        const result = await pool.request()
            .input('categoryId', sql.Int, categoryId) 
            .query('SELECT id, titulo, descripcion, id_categoria FROM dbo.encuestas WHERE id_categoria = @categoryId');
        
        res.status(200).json(result.recordset);

    } catch (err) {
        console.error(`Error al obtener encuestas para la categoría ${id}:`, err);
        res.status(500).json({ message: 'Error interno del servidor al buscar encuestas.' });
    }
};

// --- NUEVA FUNCIÓN: Obtener Preguntas por ID de Encuesta ---
const getQuestionsBySurvey = async (req, res) => {
    const { id } = req.params; 
    const surveyId = parseInt(id, 10);

    if (isNaN(surveyId)) {
        return res.status(400).json({ message: 'ID de encuesta inválido.' });
    }

    try {
        const pool = await getConnection();

        // Consulta la tabla dbo.preguntas filtrando por id_encuesta
        // Solo incluimos 'id' y 'texto'. Deberás añadir más campos si tienes el tipo y las opciones.
        const result = await pool.request()
            .input('surveyId', sql.Int, surveyId) 
            .query('SELECT id, texto FROM dbo.preguntas WHERE id_encuesta = @surveyId ORDER BY id');
        
        res.status(200).json(result.recordset);

    } catch (err) {
        console.error(`Error al obtener preguntas para la encuesta ${id}:`, err);
        res.status(500).json({ message: 'Error interno del servidor al buscar preguntas.' });
    }
};

// --- EXPORTACIÓN CORREGIDA (sin comas o sintaxis erróneas) ---
export { 
    getCategories, 
    getSurveysByCategory, 
    getQuestionsBySurvey 
};