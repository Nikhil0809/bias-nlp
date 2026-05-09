import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { AlertTriangle, CheckCircle2, ArrowRightLeft, Sparkles, RefreshCw, Send, Copy, TrendingDown } from 'lucide-react';

const getApiUrl = () => {
  let envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) {
    if (!envUrl.startsWith('http')) {
      envUrl = `https://${envUrl}`;
    }
    return envUrl.endsWith('/api') ? envUrl : `${envUrl.replace(/\/$/, '')}/api`;
  }
  return "http://localhost:8000/api";
};
const API_URL = getApiUrl();

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2 } }
};

function ScoreBar({ label, value, color, max = 1 }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{label}</span>
        <span className="text-mono text-sm font-semibold" style={{ color, fontFamily: 'var(--font-mono)' }}>{pct}%</span>
      </div>
      <div className="metric-bar">
        <motion.div
          className="metric-bar-fill"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </div>
  );
}

function FullPageLoader({ message = "Initializing Bias Analyzer..." }) {
  return (
    <motion.div
      className="flex flex-col items-center justify-center py-24 sm:py-32"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="page-loader mb-6">
        <div className="page-loader-ring" />
        <div className="page-loader-ring" style={{ animationDelay: '0.15s' }} />
        <div className="page-loader-ring" style={{ animationDelay: '0.3s' }} />
      </div>
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{message}</p>
    </motion.div>
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

  const handleAnalyze = useCallback(async () => {
    if (!text.trim()) return;
    setLoading(true);
    setResult(null);
    setCounterfactual(null);
    setDebiased(null);
    try {
      const res = await axios.post(`${API_URL}/analyze`, { text });
      setResult(res.data);
    } catch (err) {
      console.error(err);
    }
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
    try {
      const res = await axios.post(`${API_URL}/debias`, { text });
      setDebiased(res.data);
    } catch (err) { console.error(err); }
    setDbLoading(false);
  }, [text]);

  return (
    <div className="max-w-5xl mx-auto w-full px-1">

      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <span className="badge badge-blue mb-3" style={{ display: 'inline-flex' }}>Real-Time Analysis</span>
        <h1 className="heading-section text-2xl sm:text-3xl mb-2" style={{ color: 'var(--text-primary)' }}>Bias Analyzer</h1>
        <p className="text-sm sm:text-base" style={{ color: 'var(--text-secondary)' }}>
          Enter text below to detect gender, racial, occupational, and sentiment bias using transformer embeddings.
        </p>
      </div>

      {/* Input Card */}
      <div className="card p-4 sm:p-6 mb-6 sm:mb-8">
        <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--text-muted)', letterSpacing: '0.04em', textTransform: 'uppercase', fontSize: 11 }}>
          Input Sentence
        </label>
        <textarea
          className="input-field mb-4"
          rows={3}
          placeholder='e.g., "He is a brilliant doctor and she is a caring nurse."'
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="flex flex-wrap gap-2 sm:gap-3">
          <button onClick={handleAnalyze} disabled={loading || !text.trim()} className="btn btn-primary">
            {loading ? <RefreshCw size={16} className="animate-spin" /> : <Send size={16} />}
            Detect Bias
          </button>
          <AnimatePresence>
            {result && (
              <motion.div className="flex gap-2 sm:gap-3 flex-wrap" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
                <button onClick={handleCounterfactual} disabled={cfLoading} className="btn btn-ghost">
                  {cfLoading ? <RefreshCw size={16} className="animate-spin" /> : <ArrowRightLeft size={16} />} Counterfactual
                </button>
                <button onClick={handleDebias} disabled={dbLoading} className="btn btn-secondary">
                  {dbLoading ? <RefreshCw size={16} className="animate-spin" /> : <Sparkles size={16} />} Debias
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Loading Shimmer */}
      <AnimatePresence>
        {loading && (
          <motion.div
            className="card p-8 sm:p-12 mb-6 flex flex-col items-center justify-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="page-loader mb-5">
              <div className="page-loader-ring" />
              <div className="page-loader-ring" style={{ animationDelay: '0.15s' }} />
              <div className="page-loader-ring" style={{ animationDelay: '0.3s' }} />
            </div>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Analyzing for bias patterns...</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      <AnimatePresence mode="wait">
        {result && (
          <motion.div className="grid grid-cols-1 md:grid-cols-5 gap-4 sm:gap-6" variants={fadeUp} initial="hidden" animate="visible" exit="exit">
            
            {/* Left: Score Panel */}
            <div className="md:col-span-2 card p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-6">
                {result.bias_detected ? (
                  <div className="badge badge-red"><AlertTriangle size={14} /> Bias Detected</div>
                ) : (
                  <div className="badge badge-emerald"><CheckCircle2 size={14} /> Fair</div>
                )}
              </div>

              <div className="space-y-4 sm:space-y-5">
                <div className="flex justify-between items-center p-3 rounded-lg" style={{ background: 'var(--bg-secondary)' }}>
                  <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Bias Type</span>
                  <span className="text-sm font-semibold capitalize" style={{ color: 'var(--text-primary)' }}>{result.bias_type}</span>
                </div>

                <ScoreBar label="Confidence" value={result.confidence} color="var(--accent-red)" />
                <ScoreBar label="Fairness" value={result.fairness_score} color="var(--accent-emerald)" />
                <ScoreBar label="Toxicity" value={result.toxicity_score} color="var(--accent-amber)" />
                <ScoreBar label="Sentiment" value={result.sentiment_score} color="var(--accent-blue)" />
              </div>
            </div>

            {/* Right: Outputs */}
            <div className="md:col-span-3 flex flex-col gap-4 sm:gap-5">
              
              {/* Original */}
              <div className="card p-4 sm:p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Original Input</span>
                  <button className="btn btn-ghost" style={{ padding: '4px 8px', fontSize: 12 }} onClick={() => navigator.clipboard.writeText(text)}>
                    <Copy size={14} />
                  </button>
                </div>
                <p className="text-mono p-3 rounded-lg break-words" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: 13 }}>
                  {text}
                </p>
              </div>

              {/* Counterfactual */}
              <AnimatePresence>
                {counterfactual && (
                  <motion.div className="card p-4 sm:p-5" variants={fadeUp} initial="hidden" animate="visible">
                    <div className="flex items-center gap-2 mb-3">
                      <ArrowRightLeft size={14} style={{ color: 'var(--accent-blue)' }} />
                      <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Counterfactual</span>
                    </div>
                    <p className="text-mono p-3 rounded-lg break-words" style={{ background: 'var(--bg-secondary)', color: 'var(--accent-blue)', fontFamily: 'var(--font-mono)', fontSize: 13 }}>
                      {counterfactual.counterfactual}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Debiased */}
              <AnimatePresence>
                {debiased && (
                  <motion.div className="card p-4 sm:p-5" style={{ borderColor: 'rgba(139,92,246,0.2)', boxShadow: 'var(--shadow-glow-violet)' }} variants={fadeUp} initial="hidden" animate="visible">
                    <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <Sparkles size={14} style={{ color: 'var(--accent-violet)' }} />
                        <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Debiased Output</span>
                      </div>
                      <div className="badge badge-emerald">
                        <TrendingDown size={12} /> -{debiased.reduction_percentage}% bias
                      </div>
                    </div>
                    <p className="text-mono p-3 rounded-lg break-words" style={{ background: 'var(--bg-secondary)', color: 'var(--accent-emerald)', fontFamily: 'var(--font-mono)', fontSize: 13 }}>
                      {debiased.debiased}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
