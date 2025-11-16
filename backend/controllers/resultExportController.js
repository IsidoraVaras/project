import { getConnection } from '../db.js';
import sql from 'mssql';

async function columnExists(pool, schema, table, column) {
  // Verifica si una columna existe en la tabla indicada 
  const q = `SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=@s AND TABLE_NAME=@t AND COLUMN_NAME=@c`;
  const rs = await pool
    .request()
    .input('s', sql.NVarChar, schema)
    .input('t', sql.NVarChar, table)
    .input('c', sql.NVarChar, column)
    .query(q);
  return rs.recordset.length > 0;
}

export const exportResultPdf = async (req, res) => {
  // Validar ID de resultado recibido por parámetro.
  const rid = parseInt(req.params.id, 10);
  if (Number.isNaN(rid)) {
    return res.status(400).json({ message: 'ID de resultado invalido' });
  }

  let PDFDocument;
  try {
    const mod = await import('pdfkit');
    PDFDocument = mod.default || mod;
  } catch (e) {
    console.error('pdfkit missing:', e?.message || e);
    return res.status(500).json({ message: 'Exportar a PDF no disponible: instale pdfkit en backend.' });
  }

  try {
    const pool = await getConnection();

    // Revisar si existen las columnas de resumen y puntaje total en la tabla resultados.
    const hasTotalCol = await columnExists(pool, 'dbo', 'resultados', 'puntaje_total');
    const hasResumenCol = await columnExists(pool, 'dbo', 'resultados', 'resumen_json');

    // Consulta del encabezado del resultado 
    let hdrSql = `SELECT r.id, r.fecha, r.id_usuario, r.id_encuesta, `;
    hdrSql += hasTotalCol ? `r.puntaje_total AS puntaje_total, ` : `CAST(NULL AS INT) AS puntaje_total, `;
    hdrSql += hasResumenCol ? `r.resumen_json AS resumen_json, ` : `CAST(NULL AS NVARCHAR(MAX)) AS resumen_json, `;
    hdrSql += `u.nombre, u.apellido, u.email, e.titulo AS encuesta
               FROM dbo.resultados r
               LEFT JOIN dbo.usuarios u ON u.id = r.id_usuario
               LEFT JOIN dbo.encuestas e ON e.id = r.id_encuesta
               WHERE r.id=@rid`;

    const hdr = await pool.request().input('rid', sql.Int, rid).query(hdrSql);
    if ((hdr.recordset?.length || 0) === 0) {
      return res.status(404).json({ message: 'No se encontró el resultado.' });
    }
    const row = hdr.recordset[0];

    // Consulta de todas las respuestas asociadas al resultado 
    const a = await pool
      .request()
      .input('rid', sql.Int, rid)
      .query(`SELECT r.id_pregunta,
                     p.texto AS pregunta,
                     r.respuesta,
                     r.valor_numerico,
                     r.id_opcion_respuesta,
                     COALESCE(o1.subescala, o2.subescala) AS subescala,
                     COALESCE(o1.etiqueta, o2.etiqueta) AS etiqueta_opcion
              FROM dbo.respuestas r
              INNER JOIN dbo.preguntas p ON p.id = r.id_pregunta
              LEFT JOIN dbo.opciones_respuesta o1 ON o1.id = r.id_opcion_respuesta
              LEFT JOIN dbo.opciones_respuesta o2 ON o2.id_pregunta = r.id_pregunta
                   AND (
                         o2.valor = CAST(r.valor_numerico AS NVARCHAR(50))
                      OR TRY_CONVERT(INT, o2.valor) = r.valor_numerico
                      OR LTRIM(RTRIM(o2.valor)) = LTRIM(RTRIM(CAST(r.respuesta AS NVARCHAR(50))))
                      OR TRY_CONVERT(INT, o2.valor) = TRY_CONVERT(INT, r.respuesta)
                       )
              WHERE r.id_resultado=@rid
              ORDER BY p.id`);

    // Normaliza cada respuesta para tener: texto de pregunta, valor y etiqueta 
    const answers = (a.recordset || []).map((r) => {
      const val = (typeof r.valor_numerico === 'number' && !Number.isNaN(r.valor_numerico))
        ? r.valor_numerico
        : (isNaN(Number(r.respuesta)) ? r.respuesta : Number(r.respuesta));
      const label = r.etiqueta_opcion ?? (typeof val === 'number' ? String(val) : String(r.respuesta));
      return {
        questionText: String(r.pregunta || ''),
        answer: val,
        label,
      };
    });

    let total = row.puntaje_total;
    if (total === null || typeof total === 'undefined') {
      total = answers.reduce((s, a) => {
        const n = Number(a.answer);
        return s + (Number.isNaN(n) ? 0 : n);
      }, 0);
    }

    // Extraer clasificación, promedio y subescalas 
    let classification;
    let avg;
    let subscales = {};
    if (row.resumen_json) {
      try {
        const obj = JSON.parse(row.resumen_json);
        classification = obj.classification;
        avg = obj.avg;
        Object.keys(obj || {}).forEach((k) => {
          if (k === 'classification' || k === 'avg') return;
          subscales[k] = obj[k];
        });
      } catch {}
    }

    // limpiar cadenas y armar datos del encabezado del PDF
    const safe = (s) => String(s ?? '').replace(/[\r\n]+/g, ' ').trim();
    const nombre = `${safe(row.nombre)} ${safe(row.apellido)}`.trim();
    const email = safe(row.email);
    const titulo = safe(row.encuesta);
    const fecha = row.fecha instanceof Date ? row.fecha : new Date(row.fecha);
    const fechaStr = fecha.toLocaleString();

    // Nombre de archivo PDF
    const y = fecha.getFullYear();
    const m = String(fecha.getMonth() + 1).padStart(2, '0');
    const d = String(fecha.getDate()).padStart(2, '0');
    const filename = `${titulo} - ${nombre} - ${y}${m}${d}.pdf`.replace(/[\\/:*?"<>|]+/g, '_');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Crear documento PDF 
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    doc.pipe(res);

    // Encabezado del informe 
    doc.fontSize(18).text(titulo, { align: 'left' });
    doc.moveDown(0.5);
    doc.fontSize(11);
    doc.text(`Usuario: ${nombre}`);
    if (email) doc.text(`Correo: ${email}`);
    doc.text(`Fecha: ${fechaStr}`);
    doc.moveDown(0.75);

    // Resumen numérico
    if (typeof total !== 'undefined') doc.text(`Puntaje total: ${total}`);
    if (typeof avg !== 'undefined') doc.text(`Promedio: ${avg}`);
    if (classification) doc.text(`Interpretacion: ${classification}`);
    if (subscales && Object.keys(subscales).length > 0) {
      doc.moveDown(0.25);
      doc.text('Puntajes por subescala:');
      for (const [name, val] of Object.entries(subscales)) {
        doc.text(`- ${name}: ${val}`);
      }
    }

    doc.moveDown(0.75);
    doc.moveTo(doc.x, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(0.75);

    // Listado de preguntas y respuestas 
    answers.forEach((ans, idx) => {
      const qn = idx + 1;
      const qText = `${qn}. ${ans.questionText}`;
      const aText = (ans.label && String(ans.label).length > 0)
        ? String(ans.label)
        : String(ans.answer);
      doc.fontSize(12).text(qText);
      doc.moveDown(0.15);
      doc.fontSize(11).fillColor('#444444').text(`Respuesta: ${aText}`);
      doc.fillColor('black');
      doc.moveDown(0.5);
    });

    doc.end();
  } catch (err) {
    console.error('Error exportando PDF:', err);
    return res.status(500).json({ message: 'Error interno al generar PDF.' });
  }
};
