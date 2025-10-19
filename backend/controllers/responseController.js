// backend/controllers/responseController.js
import { getConnection } from '../db.js';
import sql from 'mssql';

// Helper: verificar si existe columna
async function columnExists(pool, tableSchema, tableName, columnName) {
  const result = await pool
    .request()
    .input('schema', sql.NVarChar, tableSchema)
    .input('table', sql.NVarChar, tableName)
    .input('column', sql.NVarChar, columnName)
    .query(
      `SELECT 1 AS ok
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = @schema
         AND TABLE_NAME = @table
         AND COLUMN_NAME = @column`
    );
  return result.recordset.length > 0;
}

// Calcula puntajes total y por subescala usando tabla dbo.subescalas
async function calculateScores(surveyId, answers) {
  const pool = await getConnection();

  // 1) Mapear id_pregunta -> índice (1..N) en la encuesta
  const questionsResult = await pool
    .request()
    .input('surveyId', sql.Int, surveyId)
    .query(
      `SELECT p.id
       FROM dbo.preguntas AS p
       WHERE p.id_encuesta = @surveyId
       ORDER BY p.id`
    );

  const questionOrder = new Map();
  questionsResult.recordset.forEach((row, idx) => {
    questionOrder.set(String(row.id), idx + 1); // 1-based index
  });

  // 2) Obtener subescalas configuradas
  const subscalesResult = await pool
    .request()
    .input('surveyId', sql.Int, surveyId)
    .query(
      `SELECT id, nombre, rango_items
       FROM dbo.subescalas
       WHERE id_encuesta = @surveyId
       ORDER BY id`
    );

  // 3) Preparar respuestas numéricas
  const numericAnswers = answers
    .map((a) => ({ qid: String(a.questionId), value: Number(a.answer) }))
    .filter((a) => !Number.isNaN(a.value));

  const total = numericAnswers.reduce((sum, a) => sum + a.value, 0);

  const subscales = {};
  for (const row of subscalesResult.recordset || []) {
    const [startStr, endStr] = String(row.rango_items).split('-');
    const start = parseInt(startStr, 10);
    const end = parseInt(endStr, 10);
    if (Number.isNaN(start) || Number.isNaN(end)) continue;

    const score = numericAnswers.reduce((sum, a) => {
      const idx = questionOrder.get(a.qid);
      if (!idx) return sum;
      if (idx >= start && idx <= end) return sum + a.value;
      return sum;
    }, 0);

    subscales[row.nombre] = score;
  }

  return { total, subscales };
}

// Calcula filas para resultados_subescalas con id_subescala y puntaje
async function calculateSubscaleRows(surveyId, answers) {
  const pool = await getConnection();

  // Orden de preguntas de la encuesta (1..N)
  const questionsResult = await pool
    .request()
    .input('surveyId', sql.Int, surveyId)
    .query(
      `SELECT p.id
       FROM dbo.preguntas AS p
       WHERE p.id_encuesta = @surveyId
       ORDER BY p.id`
    );
  const questionOrder = new Map();
  questionsResult.recordset.forEach((row, idx) => {
    questionOrder.set(String(row.id), idx + 1);
  });

  const numericAnswers = answers
    .map((a) => ({ qid: String(a.questionId), value: Number(a.answer) }))
    .filter((a) => !Number.isNaN(a.value));

  const subscalesResult = await pool
    .request()
    .input('surveyId', sql.Int, surveyId)
    .query(
      `SELECT id, nombre, rango_items
       FROM dbo.subescalas
       WHERE id_encuesta = @surveyId
       ORDER BY id`
    );

  const rows = [];
  for (const row of subscalesResult.recordset || []) {
    const [startStr, endStr] = String(row.rango_items).split('-');
    const start = parseInt(startStr, 10);
    const end = parseInt(endStr, 10);
    if (Number.isNaN(start) || Number.isNaN(end)) continue;

    const score = numericAnswers.reduce((sum, a) => {
      const idx = questionOrder.get(a.qid);
      if (!idx) return sum;
      if (idx >= start && idx <= end) return sum + a.value;
      return sum;
    }, 0);

    rows.push({ id_subescala: row.id, puntaje: score });
  }

  return rows;
}

// POST /api/responses
const createResponse = async (req, res) => {
  try {
    const { surveyId, userId, answers } = req.body || {};
    const numericSurveyId = parseInt(surveyId, 10);
    const numericUserId = parseInt(userId, 10);
    if (
      Number.isNaN(numericSurveyId) ||
      Number.isNaN(numericUserId) ||
      !Array.isArray(answers)
    ) {
      return res.status(400).json({ message: 'Payload inválido.' });
    }

    const pool = await getConnection();
    const hasResultadoFK = await columnExists(pool, 'dbo', 'respuestas', 'id_resultado');
    const hasTotalCol = await columnExists(pool, 'dbo', 'resultados', 'puntaje_total');
    const hasResumenCol = await columnExists(pool, 'dbo', 'resultados', 'resumen_json');

    // Calcular puntajes
    const totals = await calculateScores(numericSurveyId, answers);
    const subscaleRows = await calculateSubscaleRows(numericSurveyId, answers);

    // Transacción: insertar resultado y respuestas
    const tx = new sql.Transaction(pool);
    await tx.begin();
    try {
      const reqTx = new sql.Request(tx);

      // Insert resultado (para usuario)
      const insertResultado = await reqTx
        .input('fecha', sql.DateTime, new Date())
        .input('id_usuario', sql.Int, numericUserId)
        .input('id_encuesta', sql.Int, numericSurveyId)
        .query(
          'INSERT INTO dbo.resultados (fecha, id_usuario, id_encuesta) OUTPUT INSERTED.id VALUES (@fecha, @id_usuario, @id_encuesta)'
        );
      const resultadoId = insertResultado.recordset[0].id;

      // Si hay columnas para guardar resumen, actualizarlas
      if (hasTotalCol) {
        await reqTx
          .input('rid', sql.Int, resultadoId)
          .input('total', sql.Int, totals.total)
          .query('UPDATE dbo.resultados SET puntaje_total = @total WHERE id = @rid');
      }
      if (hasResumenCol) {
        await reqTx
          .input('rid2', sql.Int, resultadoId)
          .input('json', sql.NVarChar(sql.MAX), JSON.stringify(totals.subscales))
          .query('UPDATE dbo.resultados SET resumen_json = @json WHERE id = @rid2');
      }

      // Insertar puntajes por subescala si la tabla existe
      // Verificar existencia rápida de la tabla
      const hasSubscaleTable = (await reqTx
        .query("SELECT 1 AS ok FROM sys.objects WHERE object_id = OBJECT_ID('dbo.resultados_subescalas') AND type = 'U'")).recordset.length > 0;
      if (hasSubscaleTable && Array.isArray(subscaleRows)) {
        for (const s of subscaleRows) {
          await new sql.Request(tx)
            .input('id_resultado', sql.Int, resultadoId)
            .input('id_subescala', sql.Int, s.id_subescala)
            .input('puntaje', sql.Int, s.puntaje)
            .query(
              'INSERT INTO dbo.resultados_subescalas (id_resultado, id_subescala, puntaje) VALUES (@id_resultado, @id_subescala, @puntaje)'
            );
        }
      }

      // Insert respuestas (para admin)
      for (const a of answers) {
        const respuestaStr = String(a.answer);
        const qId = parseInt(String(a.questionId), 10);
        if (Number.isNaN(qId)) continue;

        // Identificar opción y valor numérico
        const numericVal = Number(a.answer);
        let optionId = null;
        if (!Number.isNaN(numericVal)) {
          const optRes = await new sql.Request(tx)
            .input('qid', sql.Int, qId)
            .input('val', sql.Int, numericVal)
            .query('SELECT TOP 1 id FROM dbo.opciones_respuesta WHERE id_pregunta = @qid AND valor = @val');
          optionId = optRes.recordset[0]?.id ?? null;
        }

        const reqAns = new sql.Request(tx)
          .input('respuesta', sql.NVarChar(sql.MAX), respuestaStr)
          .input('id_pregunta', sql.Int, qId)
          .input('id_usuario', sql.Int, numericUserId)
          .input('id_resultado', sql.Int, resultadoId)
          .input('valor_numerico', sql.Int, Number.isNaN(numericVal) ? null : numericVal)
          .input('id_opcion_respuesta', sql.Int, optionId);

        // Intentar insertar con todas las columnas; si falla por columnas inexistentes, hacer fallback
        try {
          await reqAns.query(
            'INSERT INTO dbo.respuestas (respuesta, id_pregunta, id_usuario, id_resultado, valor_numerico, id_opcion_respuesta) VALUES (@respuesta, @id_pregunta, @id_usuario, @id_resultado, @valor_numerico, @id_opcion_respuesta)'
          );
        } catch (e) {
          if (hasResultadoFK) {
            await new sql.Request(tx)
              .input('respuesta', sql.NVarChar(sql.MAX), respuestaStr)
              .input('id_pregunta', sql.Int, qId)
              .input('id_usuario', sql.Int, numericUserId)
              .input('id_resultado', sql.Int, resultadoId)
              .query(
                'INSERT INTO dbo.respuestas (respuesta, id_pregunta, id_usuario, id_resultado) VALUES (@respuesta, @id_pregunta, @id_usuario, @id_resultado)'
              );
          } else {
            await new sql.Request(tx)
              .input('respuesta', sql.NVarChar(sql.MAX), respuestaStr)
              .input('id_pregunta', sql.Int, qId)
              .input('id_usuario', sql.Int, numericUserId)
              .query(
                'INSERT INTO dbo.respuestas (respuesta, id_pregunta, id_usuario) VALUES (@respuesta, @id_pregunta, @id_usuario)'
              );
          }
        }
      }

      await tx.commit();

      const responsePayload = {
        id: String(resultadoId),
        surveyId: String(surveyId),
        userId: String(userId),
        answers,
        totals,
        completedAt: new Date().toISOString(),
      };
      return res.status(201).json(responsePayload);
    } catch (innerErr) {
      await tx.rollback();
      console.error('TX error al guardar respuesta:', innerErr);
      return res.status(500).json({ message: 'Error guardando respuesta.' });
    }
  } catch (err) {
    console.error('Error al crear respuesta:', err);
    res.status(500).json({ message: 'Error interno del servidor al guardar respuesta.' });
  }
};

// GET /api/responses (vista admin)
const getResponses = async (_req, res) => {
  try {
    const pool = await getConnection();
    const hasResultadoFK = await columnExists(pool, 'dbo', 'respuestas', 'id_resultado');

    // Traer lista de resultados (completados)
    const resultRows = await pool
      .request()
      .query('SELECT id, fecha, id_usuario, id_encuesta FROM dbo.resultados ORDER BY fecha DESC');

    const list = [];
    for (const row of resultRows.recordset) {
      let answers = [];
      if (hasResultadoFK) {
        const ans = await pool
          .request()
          .input('rid', sql.Int, row.id)
          .query(
            'SELECT respuesta, id_pregunta FROM dbo.respuestas WHERE id_resultado = @rid ORDER BY id'
          );
        answers = ans.recordset.map((r) => ({ questionId: String(r.id_pregunta), answer: r.respuesta }));
      } else {
        // Fallback: sin FK, traer todas las respuestas de ese usuario para esa encuesta (posible mezcla si hay múltiples intentos)
        const ans = await pool
          .request()
          .input('uid', sql.Int, row.id_usuario)
          .input('sid', sql.Int, row.id_encuesta)
          .query(
            `SELECT r.respuesta, r.id_pregunta
             FROM dbo.respuestas AS r
             WHERE r.id_usuario = @uid
               AND r.id_pregunta IN (SELECT p.id FROM dbo.preguntas p WHERE p.id_encuesta = @sid)
             ORDER BY r.id`
          );
        answers = ans.recordset.map((r) => ({ questionId: String(r.id_pregunta), answer: r.respuesta }));
      }

      // Recalcular totales para devolverlos al frontend
      const totals = await calculateScores(row.id_encuesta, answers);

      list.push({
        id: String(row.id),
        surveyId: String(row.id_encuesta),
        userId: String(row.id_usuario),
        answers,
        totals,
        completedAt: row.fecha,
      });
    }

    res.status(200).json(list);
  } catch (err) {
    console.error('Error al obtener responses:', err);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

export { createResponse, getResponses };

// --- NUEVO: resultados por usuario (solo resumen) ---
const getResultsByUser = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id, 10);
    if (Number.isNaN(userId)) return res.status(400).json({ message: 'ID de usuario inválido' });

    const pool = await getConnection();
    const hasTotalCol = await columnExists(pool, 'dbo', 'resultados', 'puntaje_total');
    const hasResumenCol = await columnExists(pool, 'dbo', 'resultados', 'resumen_json');

    const resultRows = await pool
      .request()
      .input('uid', sql.Int, userId)
      .query('SELECT id, fecha, id_encuesta, puntaje_total, resumen_json FROM dbo.resultados WHERE id_usuario = @uid ORDER BY fecha DESC');

    const list = [];
    for (const row of resultRows.recordset) {
      let totals;
      if (hasTotalCol || hasResumenCol) {
        totals = {
          total: row.puntaje_total ?? 0,
          subscales: row.resumen_json ? JSON.parse(row.resumen_json) : {},
        };
      } else {
        // Recalcular desde respuestas si no hay columnas
        const ans = await pool
          .request()
          .input('rid', sql.Int, row.id)
          .query('SELECT id_pregunta, respuesta FROM dbo.respuestas WHERE id_resultado = @rid');
        const answers = ans.recordset.map((r) => ({ questionId: String(r.id_pregunta), answer: r.respuesta }));
        totals = await calculateScores(row.id_encuesta, answers);
      }

      list.push({
        id: String(row.id),
        surveyId: String(row.id_encuesta),
        userId: String(userId),
        answers: [],
        totals,
        completedAt: row.fecha,
      });
    }

    res.status(200).json(list);
  } catch (err) {
    console.error('Error al obtener resultados del usuario:', err);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

export { getResultsByUser };
