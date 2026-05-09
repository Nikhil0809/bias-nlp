import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { TrendingDown, Shield, Target, Gauge } from 'lucide-react';

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
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }
  })
};

const tooltipStyle = {
  contentStyle: {
    background: 'rgba(17, 24, 39, 0.95)',
    border: '1px solid rgba(148, 163, 184, 0.12)',
    borderRadius: 12,
    backdropFilter: 'blur(12px)',
    fontFamily: "'Inter', sans-serif",
    fontSize: 13,
    boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
  },
  itemStyle: { color: '#e2e8f0', fontSize: 12 },
  labelStyle: { color: '#94a3b8', fontWeight: 600, marginBottom: 4 },
};

// Radar data for multi-metric comparison
const radarData = [
  { metric: 'Accuracy', original: 92, debiased: 89 },
  { metric: 'Fairness', original: 45, debiased: 88 },
  { metric: 'F1-Score', original: 86, debiased: 84 },
  { metric: 'Low Toxicity', original: 60, debiased: 90 },
  { metric: 'Sentiment Balance', original: 55, debiased: 85 },
];

function StatCard({ icon: Icon, label, value, subtext, color, index }) {
  return (
    <motion.div className="stat-card" variants={fadeUp} initial="hidden" animate="visible" custom={index}>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}15` }}>
          <Icon size={16} style={{ color }} />
        </div>
        <span className="text-xs font-medium" style={{ color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {label}
        </span>
      </div>
      <p className="heading-display text-2xl sm:text-3xl" style={{ color: 'var(--text-primary)' }}>{value}</p>
      <p className="text-xs mt-2 flex items-center gap-1" style={{ color: 'var(--accent-emerald)' }}>
        <TrendingDown size={12} /> {subtext}
      </p>
    </motion.div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dashRes, metricsRes] = await Promise.all([
          axios.get(`${API_URL}/dashboard-data`),
          axios.get(`${API_URL}/metrics`)
        ]);
        setData(dashRes.data);
        setMetrics(metricsRes.data);
      } catch (err) { console.error(err); }
    };
    fetchData();
  }, []);

  if (!data || !metrics) {
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
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading dashboard data...</p>
      </motion.div>
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <span className="badge badge-violet mb-3" style={{ display: 'inline-flex' }}>Live Metrics</span>
        <h1 className="heading-section text-2xl sm:text-3xl mb-2" style={{ color: 'var(--text-primary)' }}>Fairness Dashboard</h1>
        <p className="text-sm sm:text-base" style={{ color: 'var(--text-secondary)' }}>
          Aggregated fairness metrics, model comparisons, and bias reduction trends.
        </p>
      </div>

      {/* Top Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-5 mb-6 sm:mb-8">
        <StatCard icon={Shield} label="Demographic Parity" value={metrics.demographic_parity_gap} subtext="0.05 below baseline" color="var(--accent-blue)" index={0} />
        <StatCard icon={Target} label="Equalized Odds" value={metrics.equalized_odds_difference} subtext="0.02 below baseline" color="var(--accent-violet)" index={1} />
        <StatCard icon={Gauge} label="SEAT Score" value={metrics.seat_score} subtext="Effect size reduced" color="var(--accent-amber)" index={2} />
        <StatCard icon={TrendingDown} label="Accuracy" value={`${(metrics.accuracy * 100).toFixed(1)}%`} subtext="Maintained high utility" color="var(--accent-emerald)" index={3} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {/* Bias Trends */}
        <motion.div className="card p-4 sm:p-6" variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0}>
          <h3 className="heading-section text-sm sm:text-base mb-1" style={{ color: 'var(--text-primary)' }}>Bias Detections Over Time</h3>
          <p className="text-xs mb-4 sm:mb-6" style={{ color: 'var(--text-muted)' }}>Monthly count by category — trending downward after debiasing</p>
          <div className="h-56 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.biasTrends}>
                <defs>
                  <linearGradient id="gGender" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="gRace" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="gSentiment" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.06)" />
                <XAxis dataKey="month" stroke="#64748b" tick={{ fontSize: 11, fontFamily: "'Inter', sans-serif" }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11, fontFamily: "'Inter', sans-serif" }} />
                <Tooltip {...tooltipStyle} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11, fontFamily: "'Inter', sans-serif" }} />
                <Area type="monotone" dataKey="gender" stroke="#ec4899" strokeWidth={2} fill="url(#gGender)" />
                <Area type="monotone" dataKey="race" stroke="#3b82f6" strokeWidth={2} fill="url(#gRace)" />
                <Area type="monotone" dataKey="sentiment" stroke="#8b5cf6" strokeWidth={2} fill="url(#gSentiment)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Model Comparison */}
        <motion.div className="card p-4 sm:p-6" variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={1}>
          <h3 className="heading-section text-sm sm:text-base mb-1" style={{ color: 'var(--text-primary)' }}>Accuracy vs Fairness</h3>
          <p className="text-xs mb-4 sm:mb-6" style={{ color: 'var(--text-muted)' }}>Model trade-off analysis across architectures</p>
          <div className="h-56 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.modelComparison} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.06)" />
                <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 10, fontFamily: "'Inter', sans-serif" }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11, fontFamily: "'Inter', sans-serif" }} />
                <Tooltip {...tooltipStyle} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11, fontFamily: "'Inter', sans-serif" }} />
                <Bar dataKey="accuracy" fill="#3b82f6" radius={[6, 6, 0, 0]} name="Accuracy %" />
                <Bar dataKey="fairness" fill="#10b981" radius={[6, 6, 0, 0]} name="Fairness %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Radar chart */}
      <motion.div className="card p-4 sm:p-6" variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={2}>
        <h3 className="heading-section text-sm sm:text-base mb-1" style={{ color: 'var(--text-primary)' }}>Multi-Metric Radar Comparison</h3>
        <p className="text-xs mb-4 sm:mb-6" style={{ color: 'var(--text-muted)' }}>Original vs debiased model performance across five dimensions</p>
        <div className="h-64 sm:h-80 flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
              <PolarGrid stroke="rgba(148,163,184,0.1)" />
              <PolarAngleAxis dataKey="metric" stroke="#64748b" tick={{ fontSize: 11, fontFamily: "'Inter', sans-serif" }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="rgba(148,163,184,0.1)" tick={{ fontSize: 10 }} />
              <Radar name="Original" dataKey="original" stroke="#ef4444" fill="#ef4444" fillOpacity={0.15} strokeWidth={2} />
              <Radar name="Debiased" dataKey="debiased" stroke="#10b981" fill="#10b981" fillOpacity={0.15} strokeWidth={2} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 11, fontFamily: "'Inter', sans-serif" }} />
              <Tooltip {...tooltipStyle} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </div>
  );
}
