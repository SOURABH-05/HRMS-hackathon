import React, { useEffect, useRef, useState } from "react";

export default function Interview() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [question, setQuestion] = useState<string | null>(null);
  const [answer, setAnswer] = useState("");
  const [log, setLog] = useState<Array<{ role: 'ai' | 'candidate', text: string }>>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const [isRecording, setIsRecording] = useState(false); // New state for recording status

  const apiBase = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:5000/api';
  const wsBase = apiBase.replace(/^http/i, (m: string) => m === 'https' ? 'wss' : 'ws').replace(/\/?api\/?$/, '');

  async function start() {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch(`${apiBase}/recruit/interview/start`, { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ role: 'Software Engineer' })});
      const json = await res.json();
      setSessionId(json.sessionId);
      setQuestion(json.question);
      setLog([{ role:'system', text:'Interview started.' }]);
    } catch { setError('Failed to start'); }
    finally { setBusy(false); }
  }

  async function submit(text: string) {
    if (!sessionId) return;
    setBusy(true);
    setError(null);
    try {
      setLog(prev => [...prev, { role:'candidate', text }]);
      const res = await fetch(`${apiBase}/recruit/interview/answer`, { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ sessionId, answer: text })});
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Error');
      if (json.subscores) setLog(prev => [...prev, { role:'ai', text: `Score ${json.lastScore}/10 (comm:${json.subscores.communication}, clarity:${json.subscores.clarity}, relevance:${json.subscores.relevance})` }]);
      if (json.done) {
        setQuestion(null);
        finalize();
      } else {
        setQuestion(json.nextQuestion);
      }
    } catch(e:any) { setError(e.message || 'Error'); }
    finally { setBusy(false); setAnswer(""); }
  }

  async function finalize() {
    if (!sessionId) return;
    const res = await fetch(`${apiBase}/recruit/interview/finalize`, { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ sessionId })});
    const json = await res.json();
    setLog(prev => [...prev, { role:'ai', text:`Overall: ${json.overall}/10` }, { role:'ai', text: JSON.stringify(json, null, 2) }]);
  }

  function cleanupStream(stream?: MediaStream | null) {
    try { stream?.getTracks().forEach(t => t.stop()); } catch {}
  }

  async function startRecording() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: { echoCancellation: true, noiseSuppression: true } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'video/webm; codecs=vp8,opus' });
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0 && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(event.data);
        }
      };
      mediaRecorderRef.current.onstop = () => {
        cleanupStream(stream);
        setIsRecording(false);
      };

      // Establish WebSocket connection before starting recorder
      wsRef.current = new WebSocket(`${wsBase}/api/interview-stream`);
      wsRef.current.onopen = () => {
        mediaRecorderRef.current?.start(1000); // 1s chunks
        setIsRecording(true);
      };
      wsRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data as string);
          if (message.type === 'transcription') {
            setAnswer(prev => prev + message.text + ' ');
          } else if (message.type === 'error') {
            setError(message.message);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      wsRef.current.onclose = () => { cleanupStream(stream); setIsRecording(false); };
      wsRef.current.onerror = (err) => { console.error('WebSocket error:', err); };

    } catch (err) {
      console.error('Error starting recording:', err);
      setError('Failed to start recording: ' + err);
    }
  }

  async function stopRecording() {
    try { if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') mediaRecorderRef.current.stop(); } catch {}
    try { wsRef.current?.close(); } catch {}
    setIsRecording(false);
  }

  useEffect(() => { start(); }, []);

  useEffect(() => {
    if (sessionId && question) {
      startRecording();
    } else if (!question && sessionId) {
      stopRecording();
    }
  }, [sessionId, question]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto bg-white shadow rounded-xl p-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">AI Interview</h2>
        {!sessionId ? (
          <button onClick={start} className="px-4 py-2 bg-blue-600 text-white rounded" disabled={busy}>Start Interview</button>
        ) : (
          <div className="space-y-3">
            {error && <div className="text-red-500 mb-4">{error}</div>}

            <div className="mb-4">
              <video ref={videoRef} autoPlay playsInline muted className="w-full rounded-md bg-gray-200"></video>
            </div>

            {question && (
              <div className="mb-4">
                <div className="p-3 bg-gray-100 rounded">Q: {question}</div>
              </div>
            )}

            <div className="flex gap-2 mb-4">
              <button
                onClick={startRecording}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                disabled={busy || isRecording}
              >
                {isRecording ? 'Recording...' : 'Start Video'}
              </button>
              <button
                onClick={stopRecording}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                disabled={busy || !isRecording}
              >
                Stop Video
              </button>
            </div>

            <textarea value={answer} onChange={e=>setAnswer(e.target.value)} placeholder="Your answer" className="border rounded w-full px-3 py-2" rows={3} />
            <div className="flex gap-2">
              <button onClick={() => submit(answer)} className="px-4 py-2 bg-blue-600 text-white rounded" disabled={busy || !sessionId}>Submit Answer</button>
              <button onClick={() => submit(answer || '')} className="px-4 py-2 bg-gray-700 text-white rounded" disabled={busy || !sessionId}>Next Question</button>
            </div>
          </div>
        )}
        {error && <div className="text-red-600 mt-3 text-sm">{error}</div>}
        <div className="mt-4 space-y-2 max-h-80 overflow-auto">
          {log.map((l,i)=>(<div key={i} className={l.role==='candidate'? 'text-right' : 'text-left'}>
            <span className={`inline-block px-3 py-2 rounded ${l.role==='candidate'?'bg-blue-50':'bg-gray-100'}`}>{l.text}</span>
          </div>))}
        </div>
      </div>
    </div>
  );
}
