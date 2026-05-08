import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ShieldCheck, Scale, Zap, ArrowRight, Cpu, Database, GitBranch, FlaskConical } from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }
  })
};

const features = [
  {
    icon: ShieldCheck,
    title: 'Bias Detection',
    desc: 'Detect gender, racial, occupational, and sentiment bias in real-time using transformer embeddings.',
    color: 'var(--accent-blue)',
    bg: 'rgba(59, 130, 246, 0.08)',
  },
  {
    icon: Scale,
    title: 'Fairness Metrics',
    desc: 'Calculate SEAT, WEAT, Demographic Parity, Equalized Odds, and macro-F1 with one click.',
    color: 'var(--accent-violet)',
    bg: 'rgba(139, 92, 246, 0.08)',
  },
  {
    icon: Zap,
    title: 'Adversarial Debiasing',
    desc: 'Apply gradient reversal layers and counterfactual augmentation to remove protected-attribute information.',
    color: 'var(--accent-pink)',
    bg: 'rgba(236, 72, 153, 0.08)',
  },
  {
    icon: FlaskConical,
    title: 'Counterfactual Testing',
    desc: 'Generate swapped variants and measure output divergence across demographic groups automatically.',
    color: 'var(--accent-emerald)',
    bg: 'rgba(16, 185, 129, 0.08)',
  },
];

const pipeline = [
  { icon: Database, label: 'Data Audit', sub: 'Representation & imbalance analysis' },
  { icon: GitBranch, label: 'Augmentation', sub: 'Gender swaps, race-neutral variants' },
  { icon: Cpu, label: 'Adversarial Training', sub: 'Gradient reversal + bias adversary' },
  { icon: Scale, label: 'Calibration', sub: 'Equalized odds + temp scaling' },
];

export default function Home() {
  return (
    <div className="flex flex-col gap-14 sm:gap-24">

      {/* ═══ HERO ═══ */}
      <section className="flex flex-col items-center text-center pt-8 sm:pt-16 pb-4 sm:pb-8">
        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0}>
          <span className="badge badge-blue mb-4 sm:mb-6" style={{ display: 'inline-flex' }}>
            <Cpu size={14} /> Research Prototype v1.0
          </span>
        </motion.div>

        <motion.h1
          className="heading-display text-4xl sm:text-6xl md:text-7xl gradient-text mb-4 sm:mb-6"
          variants={fadeUp} initial="hidden" animate="visible" custom={1}
        >
          FairNLP-MT
        </motion.h1>

        <motion.p
          className="text-base sm:text-xl md:text-2xl max-w-2xl leading-relaxed mb-8 sm:mb-10 px-2"
          style={{ color: 'var(--text-secondary)', fontWeight: 300 }}
          variants={fadeUp} initial="hidden" animate="visible" custom={2}
        >
          A multi-attribute transformer debiasing platform for detecting, measuring, and mitigating bias in NLP systems.
        </motion.p>

        <motion.div
          className="flex gap-3 sm:gap-4 flex-wrap justify-center"
          variants={fadeUp} initial="hidden" animate="visible" custom={3}
        >
          <Link to="/analyze" className="btn btn-primary" style={{ textDecoration: 'none' }}>
            Start Analysis <ArrowRight size={16} />
          </Link>
          <Link to="/dashboard" className="btn btn-ghost" style={{ textDecoration: 'none' }}>
            View Metrics
          </Link>
        </motion.div>

        {/* Stats Row */}
        <motion.div
          className="grid grid-cols-2 sm:flex gap-6 sm:gap-12 mt-10 sm:mt-16"
          variants={fadeUp} initial="hidden" animate="visible" custom={4}
        >
          {[
            { value: '6', label: 'Bias Types' },
            { value: '7', label: 'Fairness Metrics' },
            { value: '4', label: 'Debiasing Stages' },
            { value: '89%', label: 'Accuracy Retained' },
          ].map((s, i) => (
            <div key={i} className="text-center">
              <p className="heading-display text-2xl sm:text-3xl" style={{ color: 'var(--text-primary)' }}>{s.value}</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 500 }}>{s.label}</p>
            </div>
          ))}
        </motion.div>
      </section>

      {/* ═══ FEATURES ═══ */}
      <section>
        <div className="text-center mb-8 sm:mb-12">
          <span className="badge badge-violet mb-4" style={{ display: 'inline-flex' }}>Core Capabilities</span>
          <h2 className="heading-section text-2xl sm:text-3xl" style={{ color: 'var(--text-primary)' }}>
            End-to-End Fairness Pipeline
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {features.map((f, i) => (
            <motion.div
              key={i}
              className="card p-5 sm:p-6"
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              custom={i}
              whileHover={{ y: -4 }}
            >
              <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 sm:mb-5"
                   style={{ background: f.bg }}>
                <f.icon size={22} style={{ color: f.color }} />
              </div>
              <h3 className="heading-section text-base mb-2" style={{ color: 'var(--text-primary)' }}>{f.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ═══ PIPELINE ═══ */}
      <section>
        <div className="text-center mb-8 sm:mb-12">
          <span className="badge badge-emerald mb-4" style={{ display: 'inline-flex' }}>Methodology</span>
          <h2 className="heading-section text-2xl sm:text-3xl" style={{ color: 'var(--text-primary)' }}>
            Debiasing Pipeline
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-5">
          {pipeline.map((step, i) => (
            <motion.div
              key={i}
              className="card p-4 sm:p-6 relative"
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              custom={i}
            >
              <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                <span className="text-mono text-xs font-semibold"
                      style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  0{i + 1}
                </span>
                <step.icon size={18} style={{ color: 'var(--accent-emerald)' }} />
              </div>
              <h4 className="heading-section text-xs sm:text-sm mb-1" style={{ color: 'var(--text-primary)' }}>{step.label}</h4>
              <p className="text-xs sm:text-sm" style={{ color: 'var(--text-muted)' }}>{step.sub}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ═══ ARCHITECTURE ═══ */}
      <section className="card p-5 sm:p-8">
        <div className="text-center mb-6 sm:mb-8">
          <span className="badge badge-blue mb-4" style={{ display: 'inline-flex' }}>System Architecture</span>
          <h2 className="heading-section text-xl sm:text-2xl" style={{ color: 'var(--text-primary)' }}>
            How FairNLP-MT Works
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {[
            { title: 'Input Layer', items: ['User text input', 'Protected attribute detection', 'Tokenization via RoBERTa'] },
            { title: 'Processing Layer', items: ['Transformer embedding extraction', 'Gradient reversal debiasing', 'Counterfactual augmentation'] },
            { title: 'Output Layer', items: ['Bias confidence scores', 'Fairness metric computation', 'Debiased text generation'] },
          ].map((col, i) => (
            <div key={i}>
              <div className="flex items-center gap-3 mb-3 sm:mb-4">
                <span className="w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold"
                      style={{ background: 'rgba(59,130,246,0.1)', color: 'var(--accent-blue)', fontFamily: 'var(--font-mono)' }}>
                  {i + 1}
                </span>
                <h4 className="heading-section text-sm" style={{ color: 'var(--text-primary)' }}>{col.title}</h4>
              </div>
              <ul className="space-y-2 ml-10">
                {col.items.map((item, j) => (
                  <li key={j} className="text-sm flex items-start gap-2" style={{ color: 'var(--text-secondary)' }}>
                    <span style={{ color: 'var(--accent-blue)', marginTop: 6, fontSize: 6 }}>●</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
