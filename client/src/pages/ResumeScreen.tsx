import React, { useState } from "react";

function ScoreBar({ label, value, max = 10 }: { label: string; value: number; max?: number }) {
  const pct = Math.max(0, Math.min(100, Math.round((value / max) * 100)));
  const color = pct >= 80 ? 'bg-green-500' : pct >= 60 ? 'bg-yellow-500' : 'bg-orange-500';
  return (
    <div>
      <div className="flex justify-between text-sm mb-1"><span>{label}</span><span>{value}/{max}</span></div>
      <div className="h-2 bg-gray-200 rounded">
        <div className={`h-2 ${color} rounded`} style={{ width: pct + '%' }} />
      </div>
    </div>
  );
}

export default function ResumeScreen() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    if (!file) return setError('Please select a file');
    setLoading(true);
    try {
      const form = new FormData();
      form.append('resume', file);
      const base = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:5000/api';
      const token = localStorage.getItem('token'); // Get token from localStorage
      if (!token) throw new Error('Not authenticated');
      const headers = { 'Authorization': `Bearer ${token}` };
      const res = await fetch(`${base}/recruit/resume`, { method: 'POST', headers, body: form });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Upload failed');
      setResult(json);
    } catch (e: any) {
      setError(e.message || 'Error');
    } finally {
      setLoading(false);
    }
  }

  const analysis = result?.analysis || null;
  const scores = analysis?.scores || {};
  const skills: string[] = analysis?.skills || [];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto bg-white shadow rounded-xl p-6">
        <h1 className="text-2xl font-bold mb-2">AI Resume Screening</h1>
        <p className="text-gray-600 mb-4">Upload a PDF/DOCX/TXT resume. You will get skills, experience estimate, and fit scores.</p>
        <form onSubmit={handleSubmit} className="flex items-center gap-3 mb-4">
          <input type="file" accept=".pdf,.docx,.txt" onChange={e => setFile(e.target.files?.[0] || null)} />
          <button disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50">
            {loading ? 'Analyzing...' : 'Upload & Analyze'}
          </button>
        </form>
        {error && <div className="mb-4 text-red-600">{error}</div>}

        {result && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-lg font-semibold">Candidate: {result?.candidate?.nameHint || 'Unknown'}</div>
              {result?.warn && <span className="text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-800">{result.warn}</span>}
              {analysis?.fallback && <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700">Heuristic</span>}
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-4">
                <div>
                  <div className="font-medium mb-2">Summary</div>
                  <div className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 rounded p-3">
                    {analysis?.summary || 'No summary provided.'}
                  </div>
                </div>

                <div>
                  <div className="font-medium mb-2">Skills</div>
                  <div className="flex flex-wrap gap-2">
                    {skills.length ? skills.map((s, i) => (
                      <span key={i} className="px-2 py-1 text-xs rounded-full bg-blue-50 text-blue-700 border border-blue-200">{s}</span>
                    )) : <span className="text-sm text-gray-500">No skills detected.</span>}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="p-3 rounded border">
                  <div className="font-medium mb-2">Experience</div>
                  <div className="text-2xl font-bold">{analysis?.yearsExperience ?? '—'} <span className="text-base font-normal text-gray-600">years</span></div>
                </div>
                <div className="p-3 rounded border space-y-3">
                  <div className="font-medium">Scores</div>
                  <ScoreBar label="Communication" value={Number(scores.communication || 0)} />
                  <ScoreBar label="Leadership" value={Number(scores.leadership || 0)} />
                  <ScoreBar label="Technical" value={Number(scores.technical || 0)} />
                  <ScoreBar label="Overall" value={Number(scores.overall || 0)} max={100} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
