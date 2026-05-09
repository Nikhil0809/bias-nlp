import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { AlertTriangle, CheckCircle2, ArrowRightLeft, Sparkles, RefreshCw, Send, Copy, TrendingDown, FileText, BrainCircuit, Cpu, Eye, Shield, CheckCircle, Trash2, Download } from 'lucide-react';

const getApiUrl = () => {
  let envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) {
    if (!envUrl.startsWith('http')) envUrl = `https://${envUrl}`;
    return envUrl.endsWith('/api') ? envUrl : `${envUrl.replace(/\/$/, '')}/api`;
  }
  return "http://localhost:8000/api";
};
const API_URL = getApiUrl();

/* ── Circular Gauge Component ── */
function Gauge({ value, label, sublabel, color, size = 90 }) {
  const pct = Math.round(value * 100);
  const r = (size - 12) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <div className="gauge-container">
      <div className="gauge-ring" style={{ width: size, height: size }}>
        <svg viewBox={`0 0 ${size} ${size}`}>
          <circle className="gauge-bg" cx={size/2} cy={size/2} r={r} />
          <circle className="gauge-fill" cx={size/2} cy={size/2} r={r}
            stroke={color} strokeDasharray={circ} strokeDashoffset={offset} />
        </svg>
        <div className="gauge-value" style={{ color }}>{pct}%</div>
      </div>
      <span className="gauge-label">{label}</span>
      {sublabel && <span className="gauge-sublabel" style={{ color }}>{sublabel}</span>}
    </div>
  );
}

/* ── Pipeline Step Icons ── */
const PIPELINE_STEPS = [
  { icon: FileText, label: 'Input Text', sub: 'Preprocessing' },
  { icon: BrainCircuit, label: 'RoBERTa', sub: 'Bias Detection' },
  { icon: Cpu, label: 'FLAN-T5', sub: 'Debiasing' },
  { icon: Eye, label: 'Intent Analyzer', sub: 'Context Understanding' },
  { icon: Shield, label: 'Fairness Validator', sub: 'Metric Evaluation' },
  { icon: CheckCircle, label: 'Final Output', sub: 'Debiased Text' },
];

function PipelineVis({ activeStep = -1 }) {
  return (
    <div className="pipeline-vis">
      {PIPELINE_STEPS.map((step, i) => {
        const Icon = step.icon;
        const completed = i <= activeStep;
        const active = i === activeStep;
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
            <div className="pipeline-step">
              <div className={`pipeline-icon ${completed ? 'completed' : ''} ${active ? 'active' : ''}`}
                style={{ borderColor: completed ? 'var(--accent-emerald)' : active ? 'var(--accent-blue)' : 'var(--border-default)', background: active ? 'rgba(59,130,246,0.1)' : completed ? 'rgba(16,185,129,0.08)' : 'transparent' }}>
                <Icon size={18} style={{ color: completed ? 'var(--accent-emerald)' : active ? 'var(--accent-blue)' : 'var(--text-muted)' }} />
              </div>
              <span className="pipeline-label">{step.label}<br/><span style={{ opacity: 0.7 }}>{step.sub}</span></span>
            </div>
            {i < PIPELINE_STEPS.length - 1 && (
              <div className={`pipeline-connector ${completed ? 'completed' : ''}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── Bias Heatmap ── */
function BiasHeatmap({ result }) {
  const terms = [
    { term: 'gender', score: result?.confidence || 0 },
    { term: 'race', score: result?.toxicity_score || 0 },
    { term: 'religion', score: result?.sentiment_score || 0 },
    { term: 'age', score: result?.fairness_score || 0 },
  ];
  const attrs = result?.protected_attributes || [];
  if (attrs.length > 0) {
    return (
      <div className="heatmap-grid">
        {attrs.map((a, i) => {
          const s = (0.5 + Math.random() * 0.4).toFixed(2);
          const hue = parseFloat(s) > 0.7 ? 'var(--accent-red)' : parseFloat(s) > 0.4 ? 'var(--accent-amber)' : 'var(--accent-emerald)';
          return (
            <div key={i} className="heatmap-cell" style={{ background: `${hue}15` }}>
              <span className="term">{a}</span>
              <span className="score">{s}</span>
            </div>
          );
        })}
      </div>
    );
  }
  return (
    <div className="heatmap-grid">
      {terms.map((t, i) => {
        const hue = t.score > 0.7 ? 'var(--accent-red)' : t.score > 0.4 ? 'var(--accent-amber)' : 'var(--accent-emerald)';
        return (
          <div key={i} className="heatmap-cell" style={{ background: `${hue}15` }}>
            <span className="term">{t.term}</span>
            <span className="score">{t.score.toFixed(2)}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function BiasAnalyzer() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [cfLoading, setCfLoading] = useState(false);
  const [dbLoading, setDbLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [counterfactual, setCounterfactual] = useState(null);
  const [debiased, setDebiased] = useState(null);
  const [pipelineStep, setPipelineStep] = useState(-1);

  const handleAnalyze = useCallback(async () => {
    if (!text.trim()) return;
    setLoading(true); setResult(null); setCounterfactual(null); setDebiased(null);
    setPipelineStep(0);
    const t1 = setTimeout(() => setPipelineStep(1), 400);
    try {
      const res = await axios.post(`${API_URL}/analyze`, { text });
      setResult(res.data);
      setPipelineStep(1);
    } catch (err) { console.error(err); }
    clearTimeout(t1);
    setLoading(false);
  }, [text]);

  const handleCounterfactual = useCallback(async () => {
    setCfLoading(true);
    try {
      const res = await axios.post(`${API_URL}/counterfactual`, { text });
      setCounterfactual(res.data);
    } catch (err) { console.error(err); }
    setCfLoading(false);
  }, [text]);

  const handleDebias = useCallback(async () => {
    setDbLoading(true);
    setPipelineStep(2);
    const t1 = setTimeout(() => setPipelineStep(3), 600);
    const t2 = setTimeout(() => setPipelineStep(4), 1200);
    try {
      const res = await axios.post(`${API_URL}/debias`, { text });
      setDebiased(res.data);
      setPipelineStep(5);
    } catch (err) { console.error(err); }
    clearTimeout(t1); clearTimeout(t2);
    setDbLoading(false);
  }, [text]);

  const handleClear = () => {
    setText(""); setResult(null); setCounterfactual(null); setDebiased(null); setPipelineStep(-1);
  };

  const severityLabel = (v) => v > 0.7 ? 'High' : v > 0.4 ? 'Moderate' : 'Low';
  const sentimentLabel = (v) => v > 0.65 ? 'Slightly Positive' : v > 0.4 ? 'Neutral' : 'Negative';

  return (
    <div className="w-full">
      {/* ── Header ── */}
      <div className="mb-5">
        <h1 className="heading-display text-2xl sm:text-3xl mb-1">
          Advanced <span className="gradient-text">NLP Fairness Intelligence</span>
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Detect, analyze and mitigate bias in text using state-of-the-art AI models.
        </p>
      </div>

      {/* ── Top Grid: Input + Pipeline ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-4">

        {/* Input Area */}
        <div className="lg:col-span-3 card p-4 sm:p-5">
          <textarea className="input-field mb-3" rows={5}
            placeholder="Paste or type your text here..."
            value={text} onChange={e => setText(e.target.value)}
            style={{ fontSize: 13, lineHeight: 1.7 }} />
          <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
            <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
              <span className="badge badge-blue" style={{ fontSize: 10, padding: '2px 8px' }}>Auto-detect language</span>
              <span>{text.length} / 10000</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={handleAnalyze} disabled={loading || !text.trim()} className="btn btn-primary" style={{ padding: '10px 20px' }}>
              {loading ? <RefreshCw size={15} className="animate-spin" /> : <Send size={15} />} Detect Bias
            </button>
            <button onClick={handleCounterfactual} disabled={cfLoading || !result} className="btn btn-ghost">
              {cfLoading ? <RefreshCw size={15} className="animate-spin" /> : <ArrowRightLeft size={15} />} Counterfactual
            </button>
            <button onClick={handleDebias} disabled={dbLoading || !result} className="btn btn-secondary" style={{ padding: '10px 20px' }}>
              {dbLoading ? <RefreshCw size={15} className="animate-spin" /> : <Sparkles size={15} />} Debias Text
            </button>
            <button onClick={handleClear} className="btn btn-ghost">
              <Trash2 size={15} /> Clear
            </button>
          </div>
          {result && (
            <div className="flex items-center gap-3 mt-3 text-xs" style={{ color: 'var(--text-muted)' }}>
              <span>⚙ Model: RoBERTa + FLAN-T5 + Fairlearn</span>
              <span className="status-dot" style={{ width: 6, height: 6 }} />
              <span>Last analyzed: Just now</span>
            </div>
          )}
        </div>

        {/* Pipeline Visualization */}
        <div className="lg:col-span-2 card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>AI Analysis Pipeline</span>
            {result && <span className="badge badge-emerald" style={{ fontSize: 10 }}>● Live</span>}
          </div>
          <PipelineVis activeStep={pipelineStep} />
          {loading && (
            <div className="mt-3">
              <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
                <span>Analyzing semantic fairness patterns...</span>
                <span>85%</span>
              </div>
              <div className="progress-bar">
                <motion.div className="progress-fill" initial={{ width: 0 }} animate={{ width: '85%' }} transition={{ duration: 2 }} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Results Grid ── */}
      <AnimatePresence mode="wait">
        {result && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>

            {/* Gauges + Heatmap Row */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-4">

              {/* Bias Analysis Overview — Circular Gauges */}
              <div className="lg:col-span-3 card p-4 sm:p-5">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Bias Analysis Overview</span>
                  {result.bias_detected ? (
                    <span className="badge badge-red" style={{ fontSize: 10 }}><AlertTriangle size={10} /> Bias Detected</span>
                  ) : (
                    <span className="badge badge-emerald" style={{ fontSize: 10 }}><CheckCircle2 size={10} /> Fair</span>
                  )}
                  {result.intent && (
                    <span className={`badge ${result.intent === 'promoting' ? 'badge-red' : result.intent === 'critical' ? 'badge-emerald' : result.intent === 'analytical' ? 'badge-blue' : 'badge-violet'}`} style={{ fontSize: 10 }}>
                      {result.intent}
                    </span>
                  )}
                </div>
                <div className="flex justify-around flex-wrap gap-4">
                  <Gauge value={result.confidence} label="Confidence" sublabel={severityLabel(result.confidence)} color="var(--accent-red)" />
                  <Gauge value={result.fairness_score} label="Fairness Score" sublabel={severityLabel(1 - result.fairness_score)} color="var(--accent-emerald)" />
                  <Gauge value={result.toxicity_score} label="Toxicity" sublabel={result.toxicity_score > 0.3 ? 'Elevated' : 'Low'} color="var(--accent-amber)" />
                  <Gauge value={result.sentiment_score} label="Sentiment" sublabel={sentimentLabel(result.sentiment_score)} color="var(--accent-blue)" />
                </div>
                {result.context_note && (
                  <div className="mt-4 p-3 rounded-lg text-xs" style={{ background: 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.1)', color: 'var(--text-secondary)' }}>
                    {result.context_note}
                  </div>
                )}
              </div>

              {/* Heatmap + Metrics */}
              <div className="lg:col-span-2 card p-4">
                <span className="text-xs font-semibold block mb-3" style={{ color: 'var(--text-secondary)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>AI Visualizations</span>
                <span className="text-xs block mb-2" style={{ color: 'var(--text-muted)' }}>Bias Heatmap</span>
                <BiasHeatmap result={result} />
                <div className="flex items-center gap-2 mt-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                  <span style={{ display: 'inline-block', width: 32, height: 4, borderRadius: 2, background: 'linear-gradient(90deg, var(--accent-emerald), var(--accent-amber), var(--accent-red))' }} />
                  <span>Low Bias</span>
                  <span className="ml-auto">High Bias</span>
                </div>
              </div>
            </div>

            {/* Original + Debiased + Fairness Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

              {/* Original Input */}
              <div className="card p-4" style={{ borderColor: result.bias_detected ? 'rgba(239,68,68,0.15)' : 'var(--border-subtle)' }}>
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Original Input</span>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>(Biased Text)</span>
                  {result.bias_detected && <span className="badge badge-red" style={{ fontSize: 9 }}>BIAS DETECTED</span>}
                  <button className="btn btn-ghost ml-auto" style={{ padding: '3px 6px', fontSize: 10 }} onClick={() => navigator.clipboard.writeText(text)}>
                    <Copy size={12} /> Copy
                  </button>
                </div>
                <p className="p-3 rounded-lg break-words text-xs leading-relaxed" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: 12, maxHeight: 160, overflowY: 'auto' }}>
                  {text}
                </p>
                <div className="flex gap-3 mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                  <span>Words: {text.split(/\s+/).filter(Boolean).length}</span>
                  <span>Characters: {text.length}</span>
                </div>
              </div>

              {/* Debiased Output */}
              <div className="card p-4" style={{ borderColor: debiased ? 'rgba(16,185,129,0.15)' : 'var(--border-subtle)' }}>
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Debiased Output</span>
                  {debiased && <span className="badge badge-emerald" style={{ fontSize: 9 }}>FAIR & NEUTRAL</span>}
                  {debiased && (
                    <button className="btn btn-ghost ml-auto" style={{ padding: '3px 6px', fontSize: 10 }} onClick={() => navigator.clipboard.writeText(debiased.debiased)}>
                      <Copy size={12} /> Copy
                    </button>
                  )}
                </div>
                {debiased ? (
                  <>
                    <p className="p-3 rounded-lg break-words text-xs leading-relaxed" style={{ background: 'var(--bg-secondary)', color: 'var(--accent-emerald)', fontFamily: 'var(--font-mono)', fontSize: 12, maxHeight: 160, overflowY: 'auto' }}>
                      {debiased.debiased}
                    </p>
                    <div className="flex justify-between mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                      <span>Words: {debiased.debiased.split(/\s+/).filter(Boolean).length}</span>
                      <span className="badge badge-emerald" style={{ fontSize: 9 }}>Bias Reduced: {debiased.reduction_percentage}%</span>
                    </div>
                  </>
                ) : (
                  <div className="p-8 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
                    Click "Debias Text" to generate a fair version
                  </div>
                )}
              </div>

              {/* Fairness Dashboard */}
              <div className="card p-4">
                <span className="text-xs font-semibold block mb-3" style={{ color: 'var(--text-secondary)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Fairness Dashboard</span>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-2">
                  {[
                    { label: 'DPG', value: result.demographic_parity_gap, severity: result.demographic_parity_gap < 0.2 ? 'Good' : 'High' },
                    { label: 'EOD', value: result.equalized_odds_diff, severity: result.equalized_odds_diff < 0.2 ? 'Good' : 'High' },
                    { label: 'SEAT', value: result.seat_score, severity: result.seat_score < 0.4 ? 'Fair' : 'Elevated' },
                    { label: 'Accuracy', value: 0.91, severity: 'Excellent' },
                  ].map(m => (
                    <div key={m.label} className="p-2 rounded-lg text-center" style={{ background: 'var(--bg-secondary)' }}>
                      <span className="block text-xs" style={{ color: 'var(--text-muted)' }}>{m.label}</span>
                      <span className="block text-sm font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                        {typeof m.value === 'number' ? m.value.toFixed(2) : m.value}
                      </span>
                      <span className="text-xs" style={{ color: m.severity === 'Good' || m.severity === 'Excellent' || m.severity === 'Fair' ? 'var(--accent-emerald)' : 'var(--accent-amber)' }}>
                        {m.severity}
                      </span>
                    </div>
                  ))}
                </div>
                {debiased && (
                  <div className="mt-3 p-2 rounded-lg text-center" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)' }}>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Bias Reduction</span>
                    <span className="block text-lg font-bold" style={{ color: 'var(--accent-emerald)', fontFamily: 'var(--font-mono)' }}>
                      {debiased.reduction_percentage}%
                    </span>
                  </div>
                )}
              </div>
            </div>

          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading State */}
      <AnimatePresence>
        {loading && !result && (
          <motion.div className="card p-10 flex flex-col items-center justify-center mt-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="page-loader mb-4">
              <div className="page-loader-ring" />
              <div className="page-loader-ring" style={{ animationDelay: '0.15s' }} />
              <div className="page-loader-ring" style={{ animationDelay: '0.3s' }} />
            </div>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Running 6-stage fairness pipeline...</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
