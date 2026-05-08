import { motion } from 'framer-motion';
import { Eye, Network, Brain, Layers } from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }
  })
};

const tokens = [
  { word: 'The', importance: 0.05, color: 'var(--accent-blue)' },
  { word: 'nurse', importance: 0.85, color: 'var(--accent-red)' },
  { word: 'rushed', importance: 0.15, color: 'var(--accent-blue)' },
  { word: 'to', importance: 0.02, color: 'var(--accent-blue)' },
  { word: 'help', importance: 0.20, color: 'var(--accent-blue)' },
  { word: ',', importance: 0.0, color: 'var(--text-muted)' },
  { word: 'she', importance: 0.70, color: 'var(--accent-red)' },
  { word: 'was', importance: 0.08, color: 'var(--accent-blue)' },
  { word: 'very', importance: 0.12, color: 'var(--accent-blue)' },
  { word: 'skilled', importance: 0.40, color: 'var(--accent-amber)' },
];

// Heatmap grid (6x6 attention matrix)
const heatmapLabels = ['The', 'nurse', 'rushed', 'help', 'she', 'was'];
const heatmapData = [
  [0.05, 0.60, 0.10, 0.05, 0.15, 0.05],
  [0.08, 0.90, 0.20, 0.10, 0.85, 0.07],
  [0.03, 0.25, 0.50, 0.30, 0.15, 0.12],
  [0.02, 0.15, 0.25, 0.55, 0.10, 0.08],
  [0.10, 0.80, 0.15, 0.08, 0.90, 0.10],
  [0.04, 0.10, 0.12, 0.10, 0.15, 0.55],
];

function getCellColor(val) {
  // Blue scale from transparent to vibrant
  const alpha = Math.max(0.06, val);
  return `rgba(59, 130, 246, ${alpha})`;
}

export default function ModelInsights() {
  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <span className="badge badge-blue mb-3" style={{ display: 'inline-flex' }}>
          <Brain size={14} /> Explainability
        </span>
        <h1 className="heading-section text-2xl sm:text-3xl mb-2" style={{ color: 'var(--text-primary)' }}>Model Insights</h1>
        <p className="text-sm sm:text-base" style={{ color: 'var(--text-secondary)' }}>
          Attention heatmaps, token importance, and LIME/SHAP explainability visualizations.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">

        {/* ── LIME Token Importance ── */}
        <motion.div className="card p-4 sm:p-6" variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0}>
          <div className="flex items-center gap-2 mb-2">
            <Eye size={18} style={{ color: 'var(--accent-blue)' }} />
            <h3 className="heading-section text-sm sm:text-base" style={{ color: 'var(--text-primary)' }}>LIME Token Importance</h3>
          </div>
          <p className="text-xs mb-4 sm:mb-6" style={{ color: 'var(--text-muted)' }}>
            Contribution of each token to the gender-bias prediction
          </p>

          {/* Highlighted sentence */}
          <div className="p-3 sm:p-4 rounded-lg mb-4 sm:mb-6 flex flex-wrap gap-1" style={{ background: 'var(--bg-secondary)' }}>
            {tokens.map((t, i) => (
              <span
                key={i}
                className="inline-block px-1.5 py-0.5 rounded text-sm"
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 12,
                  background: t.importance > 0.4 ? `rgba(239, 68, 68, ${t.importance * 0.25})` : 'transparent',
                  color: t.importance > 0.4 ? 'var(--accent-red)' : 'var(--text-secondary)',
                  fontWeight: t.importance > 0.4 ? 600 : 400,
                  borderBottom: t.importance > 0.4 ? '2px solid var(--accent-red)' : 'none',
                }}
              >
                {t.word}
              </span>
            ))}
          </div>

          {/* Bars */}
          <div className="space-y-2 sm:space-y-3">
            {tokens.filter(t => t.importance > 0.01).map((t, i) => (
              <div key={i} className="flex items-center gap-2 sm:gap-3">
                <span className="w-12 sm:w-14 text-right text-xs" style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{t.word}</span>
                <div className="flex-1 metric-bar">
                  <motion.div
                    className="metric-bar-fill"
                    style={{ background: t.importance > 0.5 ? 'var(--accent-red)' : t.importance > 0.3 ? 'var(--accent-amber)' : 'var(--accent-blue)' }}
                    initial={{ width: 0 }}
                    whileInView={{ width: `${t.importance * 100}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: i * 0.05 }}
                  />
                </div>
                <span className="w-8 sm:w-10 text-right text-xs font-semibold" style={{
                  fontFamily: 'var(--font-mono)',
                  color: t.importance > 0.5 ? 'var(--accent-red)' : t.importance > 0.3 ? 'var(--accent-amber)' : 'var(--accent-blue)'
                }}>
                  {t.importance.toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          <p className="text-xs mt-4 sm:mt-6 flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
            <span className="w-2 h-2 rounded-full" style={{ background: 'var(--accent-red)' }} />
            Red indicates contribution to gender bias prediction
          </p>
        </motion.div>

        {/* ── Attention Heatmap ── */}
        <motion.div className="card p-4 sm:p-6" variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={1}>
          <div className="flex items-center gap-2 mb-2">
            <Network size={18} style={{ color: 'var(--accent-violet)' }} />
            <h3 className="heading-section text-sm sm:text-base" style={{ color: 'var(--text-primary)' }}>Attention Heatmap</h3>
          </div>
          <p className="text-xs mb-4 sm:mb-6" style={{ color: 'var(--text-muted)' }}>
            Layer 11 · Head 4 — Self-attention weights between tokens
          </p>

          <div className="p-2 sm:p-4 rounded-lg overflow-x-auto" style={{ background: 'var(--bg-secondary)' }}>
            {/* Column headers */}
            <div className="grid gap-1 mb-1" style={{ gridTemplateColumns: `40px repeat(${heatmapLabels.length}, 1fr)`, minWidth: 300 }}>
              <div></div>
              {heatmapLabels.map((l, i) => (
                <div key={i} className="text-center text-xs py-1" style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', fontSize: 10 }}>
                  {l}
                </div>
              ))}
            </div>

            {/* Grid rows */}
            {heatmapData.map((row, ri) => (
              <div key={ri} className="grid gap-1 mb-1" style={{ gridTemplateColumns: `40px repeat(${row.length}, 1fr)`, minWidth: 300 }}>
                <div className="flex items-center justify-end pr-1 text-xs" style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', fontSize: 10 }}>
                  {heatmapLabels[ri]}
                </div>
                {row.map((val, ci) => (
                  <motion.div
                    key={ci}
                    className="aspect-square rounded-md flex items-center justify-center text-xs"
                    style={{
                      background: getCellColor(val),
                      color: val > 0.6 ? 'white' : 'var(--text-muted)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: 9,
                      fontWeight: val > 0.6 ? 700 : 400,
                      border: val > 0.7 ? '1px solid rgba(139, 92, 246, 0.4)' : '1px solid transparent',
                    }}
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: (ri * 6 + ci) * 0.02, duration: 0.3 }}
                    whileHover={{ scale: 1.15 }}
                  >
                    {val.toFixed(2)}
                  </motion.div>
                ))}
              </div>
            ))}
          </div>

          <p className="text-xs mt-4 sm:mt-6 flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
            <span className="w-2 h-2 rounded-full" style={{ background: 'var(--accent-violet)' }} />
            Strong attention between "nurse" ↔ "she" reveals pre-debiasing gender association
          </p>
        </motion.div>
      </div>

      {/* ── Model Architecture ── */}
      <motion.div className="card p-4 sm:p-6" variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={2}>
        <div className="flex items-center gap-2 mb-2">
          <Layers size={18} style={{ color: 'var(--accent-emerald)' }} />
          <h3 className="heading-section text-sm sm:text-base" style={{ color: 'var(--text-primary)' }}>Adversarial Debiasing Architecture</h3>
        </div>
        <p className="text-xs mb-6 sm:mb-8" style={{ color: 'var(--text-muted)' }}>
          Gradient reversal layer prevents the main classifier from encoding protected-attribute information
        </p>

        <div className="flex items-center justify-center gap-2 sm:gap-4 flex-wrap">
          {[
            { label: 'Input Text', sub: 'Tokenized', color: 'var(--accent-blue)' },
            { label: 'RoBERTa Encoder', sub: '12 layers', color: 'var(--accent-blue)' },
            { label: 'Embedding', sub: '768-dim', color: 'var(--accent-violet)' },
          ].map((node, i) => (
            <div key={i} className="flex items-center gap-2 sm:gap-4">
              <div className="p-3 sm:p-4 rounded-xl text-center" style={{ background: `${node.color}10`, border: `1px solid ${node.color}25`, minWidth: 90 }}>
                <p className="text-xs sm:text-sm font-semibold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>{node.label}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 10 }}>{node.sub}</p>
              </div>
              {i < 2 && <span style={{ color: 'var(--text-muted)', fontSize: 18 }}>→</span>}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-center mt-4 gap-8 sm:gap-16 flex-wrap">
          <div className="flex flex-col items-center gap-2">
            <span style={{ color: 'var(--text-muted)', fontSize: 20 }}>↓</span>
            <div className="p-3 sm:p-4 rounded-xl text-center" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', minWidth: 120 }}>
              <p className="text-xs sm:text-sm font-semibold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>Main Classifier</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--accent-emerald)', fontFamily: 'var(--font-mono)', fontSize: 10 }}>Task output</p>
            </div>
          </div>

          <div className="flex flex-col items-center gap-2">
            <span style={{ color: 'var(--text-muted)', fontSize: 20 }}>↓</span>
            <div className="p-3 sm:p-4 rounded-xl text-center" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', minWidth: 120 }}>
              <p className="text-xs sm:text-sm font-semibold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>Gradient Reversal</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--accent-red)', fontFamily: 'var(--font-mono)', fontSize: 10 }}>λ = -1.0</p>
            </div>
            <span style={{ color: 'var(--text-muted)', fontSize: 20 }}>↓</span>
            <div className="p-3 sm:p-4 rounded-xl text-center" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', minWidth: 120 }}>
              <p className="text-xs sm:text-sm font-semibold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>Bias Adversary</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--accent-red)', fontFamily: 'var(--font-mono)', fontSize: 10 }}>Protected attr</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
