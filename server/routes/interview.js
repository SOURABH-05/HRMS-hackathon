import express from 'express';
import multer from 'multer';
import OpenAI from 'openai';
import fs from 'fs';
import os from 'os';
import path from 'path';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

// In-memory sessions for hackathon demo
const sessions = new Map();
const QUESTIONS = [
  'Tell me about a challenging project and your role.',
  'How do you handle tight deadlines and conflicting priorities?',
  'Describe a time you improved a process or system.',
  'What tech stack are you most confident with and why?'
];

function scoreAnswer(text) {
  return Math.min(10, Math.round((text?.length || 0) / 50));
}

// Start interview
router.post('/interview/start', async (req, res) => {
  const { role = 'Software Engineer' } = req.body || {};
  const id = Math.random().toString(36).slice(2);
  sessions.set(id, { role, index: 0, answers: [], scores: [] });
  res.json({ sessionId: id, question: QUESTIONS[0] });
});

// Submit answer
router.post('/interview/answer', async (req, res) => {
  const { sessionId, answer = '' } = req.body || {};
  const s = sessions.get(sessionId);
  if (!s) return res.status(404).json({ error: 'Invalid session' });

  s.answers.push(answer);

  let subscores = null;
  if (process.env.OPENAI_API_KEY) {
    try {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const prompt = `Rate the candidate's answer on communication, clarity, and relevance (0-10 each). Return JSON {communication,clarity,relevance,summary}. Answer: ${answer}`;
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'Return strict JSON.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.2,
        max_tokens: 200
      });
      const content = completion.choices?.[0]?.message?.content || '{}';
      subscores = JSON.parse(content);
    } catch {
      subscores = null;
    }
  }

  const baseScore = scoreAnswer(answer);
  const combined = Math.round((baseScore + (subscores ? ((subscores.communication||0)+(subscores.clarity||0)+(subscores.relevance||0))/3 : 0)) / 2);
  s.scores.push(combined);

  s.index += 1;
  const done = s.index >= QUESTIONS.length;
  const nextQuestion = done ? null : QUESTIONS[s.index];

  res.json({
    done,
    nextQuestion,
    lastScore: combined,
    subscores: subscores || undefined,
    progress: { answered: s.index, total: QUESTIONS.length, average: Math.round(s.scores.reduce((a,b)=>a+b,0)/s.scores.length) }
  });
});

// Finalize and get report
router.post('/interview/finalize', async (req, res) => {
  const { sessionId } = req.body || {};
  const s = sessions.get(sessionId);
  if (!s) return res.status(404).json({ error: 'Invalid session' });
  const overall = Math.round(s.scores.reduce((a,b)=>a+b,0) / Math.max(1, s.scores.length));
  const report = { role: s.role, overall, answers: s.answers.map((a,i)=>({ q: QUESTIONS[i], a, score: s.scores[i] })) };
  sessions.delete(sessionId);
  res.json(report);
});

// Speech-to-text using OpenAI Whisper
router.post('/transcribe', upload.single('audio'), async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) return res.status(500).json({ error: 'OPENAI_API_KEY not configured' });
    if (!req.file) return res.status(400).json({ error: 'audio file required' });
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // Write buffer to a temp file and stream it
    const tmpPath = path.join(os.tmpdir(), `${Date.now()}-${Math.random().toString(36).slice(2)}.webm`);
    await fs.promises.writeFile(tmpPath, req.file.buffer);
    const stream = fs.createReadStream(tmpPath);

    const tr = await openai.audio.transcriptions.create({ model: 'gpt-4o-transcribe', file: stream });

    // Cleanup
    stream.close();
    fs.promises.unlink(tmpPath).catch(()=>{});

    res.json({ text: tr.text || '' });
  } catch (e) {
    res.status(500).json({ error: 'Transcription failed' });
  }
});

export default router;
