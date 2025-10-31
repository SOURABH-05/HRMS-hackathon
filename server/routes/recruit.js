import express from 'express';
import multer from 'multer';
import OpenAI from 'openai';
import { requireAuth } from '../middleware/auth.js'; // Import requireAuth

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

async function extractText(file) {
  const mime = file.mimetype;
  const buffer = file.buffer;
  const name = file.originalname.toLowerCase();

  // TXT fallback
  if (mime === 'text/plain' || name.endsWith('.txt')) {
    return buffer.toString('utf-8');
  }

  // Try PDF
  if (mime === 'application/pdf' || name.endsWith('.pdf')) {
    try {
      const pdfParse = (await import('pdf-parse')).default;
      const data = await pdfParse(buffer);
      return data.text || '';
    } catch {
      // fall through to raw text
    }
  }

  // Try DOCX
  if (mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || name.endsWith('.docx')) {
    try {
      const mammoth = await import('mammoth');
      const result = await mammoth.extractRawText({ buffer });
      return result.value || '';
    } catch {
      // fall through to raw text
    }
  }

  // Last resort: attempt to decode buffer as UTF-8
  try { return buffer.toString('utf-8'); } catch { return ''; }
}

function naiveAnalysis(text) {
  const snippet = (text || '').slice(0, 600);
  const words = (text || '').toLowerCase().split(/[^a-z0-9+.#]+/g).filter(Boolean);
  const uniq = Array.from(new Set(words));
  const commonSkills = ['javascript','typescript','react','node','python','java','sql','mongodb','aws','docker','kubernetes','html','css'];
  const skills = commonSkills.filter(s => uniq.includes(s));
  const yearsMatch = /\b(\d{1,2})\+?\s*(?:years|yrs)\b/i.exec(text || '');
  const yearsExperience = yearsMatch ? Number(yearsMatch[1]) : Math.min(15, Math.floor((text || '').length / 500));
  return {
    skills,
    yearsExperience,
    summary: snippet || 'No text extracted from resume.',
    scores: { communication: 6, leadership: 5, technical: 6, overall: 60 },
    fallback: true
  };
}

router.post('/resume', requireAuth, upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'resume file is required' });

    const text = (await extractText(req.file)).slice(0, 20000); // limit tokens
    if (!text) return res.status(400).json({ error: 'Could not extract text from resume' });

    // If no API key, return naive fallback instead of 500
    if (!process.env.OPENAI_API_KEY) {
      const result = naiveAnalysis(text);
      return res.json({ candidate: { nameHint: req.file.originalname.replace(/\.(pdf|docx|txt)$/i,'') }, analysis: result });
    }

    try {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const prompt = `You are an HR assistant. Analyze this resume text and return JSON with fields: skills (string[]), yearsExperience (number), summary (string), and scores: communication (0-10), leadership (0-10), technical (0-10), overall (0-100). Respond with ONLY JSON. Resume:\n\n${text}`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a helpful assistant that outputs strict JSON.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.2,
        max_tokens: 500
      });

      const content = completion.choices?.[0]?.message?.content || '{}';
      let result;
      try { result = JSON.parse(content); } catch { result = { raw: content }; }

      return res.json({
        candidate: { nameHint: req.file.originalname.replace(/\.(pdf|docx|txt)$/i,'') },
        analysis: result
      });
    } catch (err) {
      console.error('Error during OpenAI resume screening:', err);
      const result = naiveAnalysis(text);
      return res.json({ candidate: { nameHint: req.file.originalname.replace(/\.(pdf|docx|txt)$/i,'') }, analysis: result, warn: 'AI unavailable, returned heuristic analysis.' });
    }
  } catch (err) {
    console.error('Error during resume screening (outer):', err);
    res.status(500).json({ error: 'Resume screening failed' });
  }
});

export default router;
