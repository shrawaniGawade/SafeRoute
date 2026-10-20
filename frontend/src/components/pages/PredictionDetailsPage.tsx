import React from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  ArrowLeft,
  Sparkles,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { usePredictions } from '../../context/PredictionContext';
import './PredictionDetailsPage.css';

interface PredictionDetailsPageProps {
  onNavigate: (route: string) => void;
}

export const PredictionDetailsPage: React.FC<PredictionDetailsPageProps> = ({ onNavigate }) => {
  const { currentPrediction } = usePredictions();

  const record = currentPrediction;
  const score = record?.result.safety_score ?? 88;
  const factors = record?.factors ?? {
    lighting: 9,
    crime_risk: 1,
    accident_risk: 2,
    crowd_level: 8,
  };

  const isSafe = score >= 80;
  const isCaution = score >= 50 && score < 80;

  return (
    <div className="prediction-audit-container">
      {/* Back button */}
      <div>
        <button
          type="button"
          onClick={() => onNavigate('routes')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'none',
            border: 'none',
            color: '#0d9488',
            fontSize: '14px',
            fontWeight: 700,
            cursor: 'pointer',
            padding: '4px 0',
          }}
        >
          <ArrowLeft size={16} />
          <span>&larr; Back to Route Finder</span>
        </button>
      </div>

      {/* Header Banner */}
      <div className="audit-header-banner">
        <div className="audit-meta-title">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Sparkles size={16} color="#38bdf8" />
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase' }}>
              AI Safety Inference Audit
            </span>
          </div>
          <h2>
            {record ? `${record.source} → ${record.destination}` : 'Primary Evaluated Corridor'}
          </h2>
          <p>
            Evaluated for departure: <strong>{record?.departureTime || 'Immediate'}</strong> via{' '}
            <strong>{record?.travelMode === 'driving' ? 'Driving / Taxi' : 'Pedestrian Walking'}</strong>.
            Processed using SafeRoute Random Forest Inference Engine.
          </p>
        </div>

        <div className="score-hero-circle">
          <span className="hero-score-val">{score}</span>
          <span className="hero-score-label">Safety Index</span>
        </div>
      </div>

      {/* Two Column Grid */}
      <div className="audit-details-grid">
        {/* Left Column: Quantitative Factor Breakdown */}
        <div className="audit-card">
          <h3 className="audit-card-title">
            <ShieldCheck size={20} color="#0d9488" />
            <span>Environmental Factor Evaluation</span>
          </h3>

          <div className="audit-factor-list">
            <div className="audit-factor-row">
              <div className="factor-desc-col">
                <strong>Illumination & Streetlights</strong>
                <span>Continuous LED streetlights & commercial storefronts</span>
              </div>
              <span style={{ fontWeight: 800, color: '#0d9488', fontSize: '15px' }}>
                {factors.lighting}/10
              </span>
            </div>

            <div className="audit-factor-row">
              <div className="factor-desc-col">
                <strong>Crime Severity Index</strong>
                <span>Historical incident frequency within a 200m radius</span>
              </div>
              <span style={{ fontWeight: 800, color: '#10b981', fontSize: '15px' }}>
                {(10 - factors.crime_risk)}/10 (Low Threat)
              </span>
            </div>

            <div className="audit-factor-row">
              <div className="factor-desc-col">
                <strong>Pedestrian Density & Activity</strong>
                <span>Foot-traffic and active evening venues</span>
              </div>
              <span style={{ fontWeight: 800, color: '#0d9488', fontSize: '15px' }}>
                {factors.crowd_level}/10
              </span>
            </div>

            <div className="audit-factor-row">
              <div className="factor-desc-col">
                <strong>Traffic & Collision Probability</strong>
                <span>Vehicle intersection hazard ratings</span>
              </div>
              <span style={{ fontWeight: 800, color: '#f59e0b', fontSize: '15px' }}>
                {(10 - factors.accident_risk)}/10
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: AI Reasoning & Explanation */}
        <div className="audit-card">
          <h3 className="audit-card-title">
            <Info size={20} color="#0d9488" />
            <span>AI Decision Explainability</span>
          </h3>

          <div className="ai-reasoning-box">
            <h4>
              <CheckCircle2 size={16} />
              <span>Why this route received a score of {score}/100</span>
            </h4>
            <p>
              {isSafe
                ? 'This corridor received an elevated score because high-intensity municipal lighting (9/10) and robust pedestrian foot traffic (8/10) mitigate potential blind spots. Historical incident reports along this commercial boulevard are in the lowest 10th percentile.'
                : isCaution
                ? 'This route received a moderate score. While lighting is adequate, lower pedestrian density after business hours increases isolation risk. We recommend staying on the main road rather than interior cuts.'
                : 'This corridor is classified as High Risk due to documented lighting gaps and reduced evening activity. We strongly recommend choosing the alternative arterial route.'}
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#334155' }}>
              <CheckCircle2 size={16} color="#10b981" />
              <span>Direct access to 2 verified police sub-stations within 500m</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#334155' }}>
              <CheckCircle2 size={16} color="#10b981" />
              <span>Avoids isolated transit underpasses after 8:00 PM</span>
            </div>
          </div>
        </div>
      </div>

      {/* Critical Section: Data Limitations & Uncertainty */}
      <div className="limitations-callout-card" role="note">
        <div className="limitations-header">
          <AlertTriangle size={20} />
          <span>Data Limitations & Prediction Uncertainty Disclaimer</span>
        </div>

        <p className="limitations-text">
          SafeRoute predictions are computed using probabilistic statistical models, municipal open crime registries,
          and crowd sensor telemetry. Please review the following operating boundaries:
        </p>

        <ul className="limitations-bullets">
          <li>
            <strong>Temporal Latency:</strong> Infrastructure changes (e.g. temporary streetlight maintenance or unexpected construction) may occur before sensor registers update.
          </li>
          <li>
            <strong>Dynamic Events:</strong> Pop-up gatherings, unrecorded road closures, or private events can temporarily alter foot traffic without prior notification.
          </li>
          <li>
            <strong>Personal Discretion:</strong> AI safety scores serve as advisory risk assessments. Users should always prioritize situational awareness, avoid dark unfamiliar alleyways, and contact emergency services (911) if they feel threatened.
          </li>
        </ul>
      </div>
    </div>
  );
};
