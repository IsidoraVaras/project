// backend/controllers/surveyController.js

import { getConnection } from '../db.js';
import sql from 'mssql';

// ... (getCategories, permanece igual)

// --- FUNCIÓN PARA OBTENER ENCUESTAS POR CATEGORÍA ---
const getSurveysByCategory = async (req, res) => {
    // Captura el ID de la categoría
    const { id } = req.params; 

    // Validación
    const categoryId = parseInt(id, 10);
    if (isNaN(categoryId)) {
        return res.status(400).json({ message: 'ID de categoría inválido.' });
    }

    try {
        const pool = await getConnection();

        // Consulta usando el campo id_categoria de dbo.encuestas
        const result = await pool.request()
            .input('categoryId', sql.Int, categoryId) 
            // Utilizamos los nombres de columna exactos de dbo.encuestas (id, titulo, descripcion, id_categoria)
            .query('SELECT id, titulo, descripcion, id_categoria FROM dbo.encuestas WHERE id_categoria = @categoryId');
        
        // Si no hay encuestas, devuelve un array vacío (200 OK)
        res.status(200).json(result.recordset);

    } catch (err) {
        console.error(`Error al obtener encuestas para la categoría ${id}:`, err);
        // Si hay un error en la BD, se devuelve un 500
        res.status(500).json({ message: 'Error interno del servidor al buscar encuestas.' });
    }
};

export { getCategories, getSurveysByCategory };