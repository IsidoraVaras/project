// backend/controllers/surveyController.js

import { getConnection } from '../db.js';
import sql from 'mssql';

// Función para obtener todas las categorías de la base de datos
const getCategories = async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request().query('SELECT * FROM categorias');
    
    // Devolver las categorías como una respuesta JSON
    res.status(200).json(result.recordset);
  } catch (err) {
    console.error('Error al obtener las categorías:', err);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

export { getCategories };