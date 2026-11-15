import { AgronomistHttpError, generateAgronomistReply } from '../_agronomist-core.mjs';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método no permitido. Usa POST.' });
    return;
  }

  try {
    const payload = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body;
    const result = await generateAgronomistReply(payload);
    res.status(200).json(result);
  } catch (error) {
    if (error instanceof AgronomistHttpError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }
    res.status(500).json({
      error: 'Error interno al procesar la consulta con la Superinteligencia Agrónoma.',
    });
  }
}
