// backend/controllers/responseController.js
import { getConnection } from '../db.js';
import sql from 'mssql';

// Check if a column exists in a table
async function columnExists(pool, schema, table, column) {
  const q = `SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=@s AND TABLE_NAME=@t AND COLUMN_NAME=@c`;
  const rs = await pool
    .request()
    .input('s', sql.NVarChar, schema)
    .input('t', sql.NVarChar, table)
    .input('c', sql.NVarChar, column)
    .query(q);
  return rs.recordset.length > 0;
}

// Compute total and subscales (supports LSAS with |miedo and |evitacion suffixes)
async function calculateScores(surveyId, answers) {
  const pool = await getConnection();

  const qRes = await pool
    .request()
    .input('sid', sql.Int, surveyId)
    .query(`SELECT p.id FROM dbo.preguntas p WHERE p.id_encuesta=@sid ORDER BY p.id`);

  const orderMap = new Map(); // id -> index (1..N)
  qRes.recordset.forEach((row, idx) => orderMap.set(String(row.id), idx + 1));

  // numeric answers
  const numericAnswers = (answers || [])
    .map(a => ({ qid: String(a.questionId), value: Number(a.answer) }))
    .filter(a => !Number.isNaN(a.value));

  const total = numericAnswers.reduce((s, a) => s + a.value, 0);

  const subscales = {};

  // LSAS detection by suffix
  const fear = numericAnswers
    .filter(a => a.qid.toLowerCase().includes('|miedo'))
    .reduce((s, a) => s + a.value, 0);
  const avoid = numericAnswers
    .filter(a => a.qid.toLowerCase().includes('|evitacion'))
    .reduce((s, a) => s + a.value, 0);
  if (fear > 0 || avoid > 0) {
    subscales['Miedo/ansiedad'] = fear;
    subscales['Evitacion'] = avoid;
  }

  // Subscales by ranges from DB (if table is present)
  try {
    const ssRes = await pool
      .request()
      .input('sid', sql.Int, surveyId)
      .query(`SELECT id, nombre, rango_items FROM dbo.subescalas WHERE id_encuesta=@sid ORDER BY id`);

    for (const row of ssRes.recordset || []) {
      const [a, b] = String(row.rango_items).split('-');
      const start = parseInt(a, 10);
      const end = parseInt(b, 10);
      if (Number.isNaN(start) || Number.isNaN(end)) continue;

      const score = numericAnswers.reduce((s, ans) => {
        const baseId = ans.qid.split('|')[0];
        const idx = orderMap.get(baseId);
        if (!idx) return s;
        return (idx >= start && idx <= end) ? s + ans.value : s;
      }, 0);

      if (typeof subscales[row.nombre] === 'undefined') subscales[row.nombre] = score;
      else subscales[row.nombre] += score;
    }
  } catch {}

  return { total, subscales };
}

// Save a response set
const createResponse = async (req, res) => {
  try {
    const { surveyId, userId, answers } = req.body || {};
    const sid = parseInt(surveyId, 10);
    const uid = parseInt(userId, 10);
    if (Number.isNaN(sid) || Number.isNaN(uid) || !Array.isArray(answers)) {
      return res.status(400).json({ message: 'Payload invalido.' });
    }

    const pool = await getConnection();
    const hasResultadoFK = await columnExists(pool, 'dbo', 'respuestas', 'id_resultado');

    // Compute for returning to client (we do not persist totals now)
    const totals = await calculateScores(sid, answers);

    const tx = new sql.Transaction(pool);
    await tx.begin();
    try {
      const reqTx = new sql.Request(tx);
      const ins = await reqTx
        .input('fecha', sql.DateTime, new Date())
        .input('id_usuario', sql.Int, uid)
        .input('id_encuesta', sql.Int, sid)
        .query(`INSERT INTO dbo.resultados (fecha, id_usuario, id_encuesta)
                OUTPUT INSERTED.id VALUES (@fecha, @id_usuario, @id_encuesta)`);
      const resultadoId = ins.recordset[0].id;

      // Insert answers
      for (const a of answers) {
        const qKey = String(a.questionId);
        const [qidStr, subLabelRaw] = qKey.split('|');
        const qid = parseInt(qidStr, 10);
        if (Number.isNaN(qid)) continue;

        const valueNum = Number(a.answer);
        let optionId = null;
        try {
          if (!Number.isNaN(valueNum)) {
            let query = `SELECT TOP 1 id FROM dbo.opciones_respuesta WHERE id_pregunta=@qid AND valor=@val`;
            const r = new sql.Request(tx)
              .input('qid', sql.Int, qid)
              .input('val', sql.NVarChar, String(valueNum));
            if (subLabelRaw) {
              query += ` AND LOWER(COALESCE(subescala,''))=@sub`;
              r.input('sub', sql.NVarChar, subLabelRaw.toLowerCase());
            }
            const or = await r.query(query);
            optionId = or.recordset[0]?.id ?? null;
          }
        } catch {}

        const baseReq = new sql.Request(tx)
          .input('respuesta', sql.NVarChar(sql.MAX), String(a.answer))
          .input('id_pregunta', sql.Int, qid)
          .input('id_usuario', sql.Int, uid);

        if (hasResultadoFK) baseReq.input('id_resultado', sql.Int, resultadoId);
        if (!Number.isNaN(valueNum)) baseReq.input('valor_numerico', sql.Int, valueNum);
        if (optionId !== null) baseReq.input('id_opcion_respuesta', sql.Int, optionId);

        // Insert with extended columns, fallback if needed
        try {
          const cols = ['respuesta','id_pregunta','id_usuario'];
          const vals = ['@respuesta','@id_pregunta','@id_usuario'];
          if (hasResultadoFK) { cols.push('id_resultado'); vals.push('@id_resultado'); }
          if (!Number.isNaN(valueNum)) { cols.push('valor_numerico'); vals.push('@valor_numerico'); }
          if (optionId !== null) { cols.push('id_opcion_respuesta'); vals.push('@id_opcion_respuesta'); }
          const sqlText = `INSERT INTO dbo.respuestas (${cols.join(', ')}) VALUES (${vals.join(', ')})`;
          await baseReq.query(sqlText);
        } catch {
          const simple = new sql.Request(tx)
            .input('respuesta', sql.NVarChar(sql.MAX), String(a.answer))
            .input('id_pregunta', sql.Int, qid)
            .input('id_usuario', sql.Int, uid);
          if (hasResultadoFK) {
            simple.input('id_resultado', sql.Int, resultadoId);
            await simple.query('INSERT INTO dbo.respuestas (respuesta, id_pregunta, id_usuario, id_resultado) VALUES (@respuesta, @id_pregunta, @id_usuario, @id_resultado)');
          } else {
            await simple.query('INSERT INTO dbo.respuestas (respuesta, id_pregunta, id_usuario) VALUES (@respuesta, @id_pregunta, @id_usuario)');
          }
        }
      }

      await tx.commit();

      const payload = {
        id: String(resultadoId),
        surveyId: String(surveyId),
        userId: String(userId),
        answers,
        totals,
        completedAt: new Date().toISOString(),
      };
      return res.status(201).json(payload);
    } catch (err) {
      await tx.rollback();
      console.error('TX error al guardar respuesta:', err);
      return res.status(500).json({ message: 'Error guardando respuesta.' });
    }
  } catch (err) {
    console.error('Error al crear respuesta:', err);
    res.status(500).json({ message: 'Error interno del servidor al guardar respuesta.' });
  }
};

// List responses for admin
const getResponses = async (_req, res) => {
  try {
    const pool = await getConnection();
    const hasResultadoFK = await columnExists(pool, 'dbo', 'respuestas', 'id_resultado');

    const rs = await pool.request().query('SELECT id, fecha, id_usuario, id_encuesta FROM dbo.resultados ORDER BY fecha DESC');
    const list = [];
    for (const row of rs.recordset) {
      let answers = [];
      if (hasResultadoFK) {
        const a = await pool
          .request()
          .input('rid', sql.Int, row.id)
          .query(`SELECT r.respuesta, r.id_pregunta, r.valor_numerico, r.id_opcion_respuesta, o.subescala
                  FROM dbo.respuestas r
                  LEFT JOIN dbo.opciones_respuesta o ON o.id = r.id_opcion_respuesta
                  WHERE r.id_resultado=@rid ORDER BY r.id`);
        answers = a.recordset.map(r => {
          const baseId = String(r.id_pregunta);
          const sub = r.subescala ? '|' + String(r.subescala) : '';
          const qid = baseId + sub;
          const val = r.valor_numerico ?? (isNaN(Number(r.respuesta)) ? r.respuesta : Number(r.respuesta));
          return { questionId: qid, answer: val };
        });
      } else {
        const a = await pool
          .request()
          .input('uid', sql.Int, row.id_usuario)
          .input('sid', sql.Int, row.id_encuesta)
          .query(`SELECT r.respuesta, r.id_pregunta
                  FROM dbo.respuestas r
                  WHERE r.id_usuario=@uid AND r.id_pregunta IN (SELECT p.id FROM dbo.preguntas p WHERE p.id_encuesta=@sid)
                  ORDER BY r.id`);
        answers = a.recordset.map(r => ({ questionId: String(r.id_pregunta), answer: r.respuesta }));
      }

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

// Get results by user (recompute totals from answers)
const getResultsByUser = async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    if (Number.isNaN(userId)) return res.status(400).json({ message: 'ID de usuario invalido' });

    const pool = await getConnection();

    const rs = await pool
      .request()
      .input('uid', sql.Int, userId)
      .query('SELECT id, fecha, id_encuesta FROM dbo.resultados WHERE id_usuario=@uid ORDER BY fecha DESC');

    const list = [];
    for (const row of rs.recordset) {
      const a = await pool
        .request()
        .input('rid', sql.Int, row.id)
        .query('SELECT id_pregunta, respuesta FROM dbo.respuestas WHERE id_resultado=@rid');
      const answers = a.recordset.map(r => ({ questionId: String(r.id_pregunta), answer: r.respuesta }));
      const totals = await calculateScores(row.id_encuesta, answers);

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

export { createResponse, getResponses, getResultsByUser };
