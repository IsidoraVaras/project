import { getConnection } from '../db.js';
import sql from 'mssql';

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

// Calcular escala total y subescalas
async function calculateScores(surveyId, answers) {
  const pool = await getConnection();

  const qRes = await pool
    .request()
    .input('sid', sql.Int, surveyId)
    .query(`SELECT p.id FROM dbo.preguntas p WHERE p.id_encuesta=@sid ORDER BY p.id`);

  const orderMap = new Map(); // id -> index (1..N)
  qRes.recordset.forEach((row, idx) => orderMap.set(String(row.id), idx + 1));

  const numericAnswers = (answers || [])
    .map(a => ({ qid: String(a.questionId), value: Number(a.answer) }))
    .filter(a => !Number.isNaN(a.value));

  let total = numericAnswers.reduce((s, a) => s + a.value, 0);

  const subscales = {};

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

  // Encuesta 2 (Rosenberg)
  try {
    if (Number(surveyId) === 2) {
      const invertedIdx = new Set([3, 5, 8, 9, 10]);
      const recodedTotal = numericAnswers.reduce((s, ans) => {
        const baseId = ans.qid.split('|')[0];
        const idx = orderMap.get(baseId) || 0;
        if (invertedIdx.has(idx)) {
          const rec = 5 - ans.value; // 1..4 -> 4..1
          return s + rec;
        }
        return s + ans.value;
      }, 0);
      total = recodedTotal;
    }
  } catch {}

  // Encuesta 5 (MSPSS)
  try {
    if (Number(surveyId) === 5) {
      const count = numericAnswers.length || 1;
      const avg = count > 0 ? (numericAnswers.reduce((s, a) => s + a.value, 0) / count) : 0;
      total = Math.round(avg * 100) / 100;
      let cls = undefined;
      if (avg >= 1.0 && avg <= 2.9) cls = 'Bajo apoyo percibido';
      else if (avg >= 3.0 && avg <= 5.0) cls = 'Apoyo moderado';
      else if (avg >= 5.1 && avg <= 7.0) cls = 'Alto apoyo percibido';
      return { total, subscales, avg: Math.round(avg * 100) / 100, classification: cls };
    }
  } catch {}

  // Encuesta 6 (FLCAS)
  try {
    if (Number(surveyId) === 6) {
      const t = total || 0;
      let lvl = 'Baja'; // 33�69
      if (t >= 90) lvl = 'Alta';
      else if (t >= 70) lvl = 'Moderada';
      return { total, subscales, classification: 'Ansiedad ' + lvl };
    }
  } catch {}

  // Encuesta 7
  try {
    const only01 = numericAnswers.length > 0 && numericAnswers.every(a => a.value === 0 || a.value === 1);
    let hasVstScale = false;
    try {
      const mrk = await pool
        .request()
        .input('sid', sql.Int, surveyId)
        .query(`SELECT TOP 1 1
                FROM dbo.opciones_respuesta o
                JOIN dbo.preguntas p ON p.id = o.id_pregunta
                WHERE p.id_encuesta=@sid AND LTRIM(RTRIM(LOWER(o.tipo_escala)))='vst-4'`);
      hasVstScale = (mrk.recordset?.length || 0) > 0;
    } catch {}

    if (Number(surveyId) === 7 || hasVstScale || (only01 && numericAnswers.length >= 20)) {
      const correct = numericAnswers.reduce((s, a) => s + (a.value === 1 ? 1 : 0), 0);
      const families = correct * 100;
      let cls = undefined;
      if (families >= 10000) cls = 'Dominio casi nativo';
      else if (families >= 8000) cls = 'Nivel alto';
      else if (families >= 5000) cls = 'Lectura no especializada';
      else if (families >= 2000) cls = 'Nivel b�sico';
      return { total: families, subscales, classification: cls };
    }
  } catch {}

  return { total, subscales };
}

// Guardar conjunto de respuestas
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
    const hasTotalCol = await columnExists(pool, 'dbo', 'resultados', 'puntaje_total');
    const hasResumenCol = await columnExists(pool, 'dbo', 'resultados', 'resumen_json');

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

      try {
        if (hasTotalCol) {
          await reqTx
            .input('rid_total', sql.Int, resultadoId)
            .input('total', sql.Int, totals.total || 0)
            .query('UPDATE dbo.resultados SET puntaje_total=@total WHERE id=@rid_total');
        }
        if (hasResumenCol) {
          const summary = {
            ...(totals.subscales || {}),
            ...(typeof totals.avg !== 'undefined' ? { avg: totals.avg } : {}),
            ...(totals.classification ? { classification: totals.classification } : {}),
          };
          await reqTx
            .input('rid_json', sql.Int, resultadoId)
            .input('json', sql.NVarChar(sql.MAX), JSON.stringify(summary))
            .query('UPDATE dbo.resultados SET resumen_json=@json WHERE id=@rid_json');
        }
      } catch {}

      for (const a of answers) {
        const qKey = String(a.questionId);
        const [qidStr, subLabelRaw] = qKey.split('|');
        const qid = parseInt(qidStr, 10);
        if (Number.isNaN(qid)) continue;

        const valueNum = Number(a.answer);
        let optionId = null;
        try {
          if (!Number.isNaN(valueNum)) {
            let query = `SELECT TOP 1 id
                         FROM dbo.opciones_respuesta
                         WHERE id_pregunta=@qid
                           AND (
                                 valor=@val
                              OR TRY_CONVERT(INT, valor)=@valInt
                           )`;
            const r = new sql.Request(tx)
              .input('qid', sql.Int, qid)
              .input('val', sql.NVarChar, String(valueNum))
              .input('valInt', sql.Int, valueNum);
            if (subLabelRaw) {
              query += ` AND LOWER(COALESCE(subescala,''))=@sub`;
              r.input('sub', sql.NVarChar, subLabelRaw.toLowerCase());
            }
            query += ' ORDER BY orden';
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

      let totalsDb = totals;
      try {
        const rsAns = await new sql.Request(tx)
          .input('rid_fetch', sql.Int, resultadoId)
          .query(`SELECT r.respuesta, r.valor_numerico, r.id_pregunta,
                         COALESCE(o1.subescala, o2.subescala) AS subescala,
                         COALESCE(o1.etiqueta, o2.etiqueta) AS etiqueta_opcion
                  FROM dbo.respuestas r
                  LEFT JOIN dbo.opciones_respuesta o1 ON o1.id = r.id_opcion_respuesta
                  LEFT JOIN dbo.opciones_respuesta o2 ON o2.id_pregunta = r.id_pregunta
                       AND (
                             o2.valor = CAST(r.valor_numerico AS NVARCHAR(50))
                          OR TRY_CONVERT(INT, o2.valor) = r.valor_numerico
                          OR LTRIM(RTRIM(o2.valor)) = LTRIM(RTRIM(CAST(r.respuesta AS NVARCHAR(50))))
                          OR TRY_CONVERT(INT, o2.valor) = TRY_CONVERT(INT, r.respuesta)
                           )
                  WHERE r.id_resultado=@rid_fetch ORDER BY r.id`);
        const answersDb = rsAns.recordset.map(r => {
          const baseId = String(r.id_pregunta);
          const sub = r.subescala ? '|' + String(r.subescala) : '';
          const qid = baseId + sub;
          const val = (typeof r.valor_numerico === 'number' && !Number.isNaN(r.valor_numerico))
            ? r.valor_numerico
            : (isNaN(Number(r.respuesta)) ? r.respuesta : Number(r.respuesta));
          return { questionId: qid, answer: val };
        });
        totalsDb = await calculateScores(sid, answersDb);

        if (hasTotalCol) {
          await reqTx
            .input('rid_total2', sql.Int, resultadoId)
            .input('total2', sql.Int, totalsDb.total || 0)
            .query('UPDATE dbo.resultados SET puntaje_total=@total2 WHERE id=@rid_total2');
        }
        if (hasResumenCol) {
          const summary2 = {
            ...(totalsDb.subscales || {}),
            ...(typeof totalsDb.avg !== 'undefined' ? { avg: totalsDb.avg } : {}),
            ...(totalsDb.classification ? { classification: totalsDb.classification } : {}),
          };
          await reqTx
            .input('rid_json2', sql.Int, resultadoId)
            .input('json2', sql.NVarChar(sql.MAX), JSON.stringify(summary2))
            .query('UPDATE dbo.resultados SET resumen_json=@json2 WHERE id=@rid_json2');
        }
      } catch {}

      await tx.commit();

      const payload = {
        id: String(resultadoId),
        surveyId: String(surveyId),
        userId: String(userId),
        answers,
        totals: totalsDb,
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
          .query(`SELECT r.respuesta, r.id_pregunta, r.valor_numerico, r.id_opcion_respuesta,
                         COALESCE(o1.subescala, o2.subescala) AS subescala,
                         COALESCE(o1.etiqueta, o2.etiqueta) AS etiqueta_opcion
                  FROM dbo.respuestas r
                  LEFT JOIN dbo.opciones_respuesta o1 ON o1.id = r.id_opcion_respuesta
                  LEFT JOIN dbo.opciones_respuesta o2 ON o2.id_pregunta = r.id_pregunta
                       AND (
                             o2.valor = CAST(r.valor_numerico AS NVARCHAR(50))
                          OR TRY_CONVERT(INT, o2.valor) = r.valor_numerico
                          OR LTRIM(RTRIM(o2.valor)) = LTRIM(RTRIM(CAST(r.respuesta AS NVARCHAR(50))))
                          OR TRY_CONVERT(INT, o2.valor) = TRY_CONVERT(INT, r.respuesta)
                           )
                  WHERE r.id_resultado=@rid ORDER BY r.id`);
        answers = a.recordset.map(r => {
          const baseId = String(r.id_pregunta);
          const sub = r.subescala ? '|' + String(r.subescala) : '';
          const qid = baseId + sub;
          const val = r.valor_numerico ?? (isNaN(Number(r.respuesta)) ? r.respuesta : Number(r.respuesta));
          const label = r.etiqueta_opcion ?? (typeof val === 'number' ? String(val) : String(r.respuesta));
          return { questionId: qid, answer: val, label };
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

      if (Number(row.id_encuesta) === 2) {
        const t = totals.total || 0;
        let cls = 'Autoestima moderada (normal)';
        if (t <= 25) cls = 'Baja autoestima';
        else if (t >= 36) cls = 'Alta autoestima';
        totals.classification = cls;
      }

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

