import React from 'react';
import DotGrid from './DotGrid';
import {
  Shield,
  Sparkles,
  ArrowRight,
  User,
  Moon,
  Zap,
  SlidersHorizontal,
  Lock,
  KeyRound,
  CheckCircle2,
  Navigation,
  Activity,
  Cpu,
  Eye,
  ChevronRight
} from 'lucide-react';
import './LandingPage.css';

interface LandingPageProps {
  onSignIn: () => void;
  onSignUp: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onSignIn, onSignUp }) => {
  return (
    <div className="landing-container">
      {/* 1. Header / Navbar */}
      <header className="landing-navbar">
        <div className="landing-brand">
          <div className="landing-logo-badge">
            <Shield size={22} className="logo-shield-icon" />
          </div>
          <div className="landing-brand-text">
            <h2>SafeRoute</h2>
            <span className="brand-subtext">Smarter Journeys. Safer Choices.</span>
          </div>
        </div>

        <nav className="landing-nav-links">
          <a href="#features">Features</a>
          <a href="#how-it-works">How It Works</a>
          <a href="#ai-engine">AI Safety Engine</a>
          <a href="#about">About</a>
        </nav>

        <div className="landing-nav-actions">
          <button
            className="landing-signin-btn"
            onClick={onSignIn}
            aria-label="Sign In to SafeRoute"
          >
            <User size={16} />
            <span>Sign In</span>
          </button>
          <button
            className="landing-cta-btn-sm"
            onClick={onSignUp}
            aria-label="Create Free Account"
          >
            <span>Get Started</span>
            <ArrowRight size={15} />
          </button>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="landing-hero" id="home">
        <div className="landing-hero-bg" aria-hidden="true">
          <DotGrid
            dotSize={6}
            gap={24}
            baseColor="#b9e4e8"
            activeColor="#087f8c"
            proximity={140}
            shockRadius={240}
            shockStrength={4}
            resistance={750}
            returnDuration={1.5}
          />
        </div>

        <div className="landing-hero-content">
          <div className="hero-announcement-badge">
            <Sparkles size={14} className="sparkle-icon" />
            <span>AI-Powered Safety-Aware Route Navigation &bull; v2.0</span>
          </div>

          <h1 className="hero-headline">
            Your Journey,
            <br />
            <span className="gradient-text">Your Safety First.</span>
          </h1>

          <p className="hero-description">
            Traditional mapping apps strictly calculate shortest distance and travel time.
            <strong> SafeRoute</strong> evaluates street lighting, crime risk indices, accident hazards,
            and bystander crowd density to recommend the safest journey for peace of mind.
          </p>

          <div className="hero-cta-group">
            <button
              className="hero-primary-btn"
              onClick={onSignUp}
              id="hero-get-started-btn"
            >
              <Sparkles size={18} />
              <span>Explore Safe Navigation</span>
              <ArrowRight size={18} />
            </button>
            <a href="#how-it-works" className="hero-secondary-btn">
              <span>See How It Works</span>
              <ChevronRight size={16} />
            </a>
          </div>

          {/* Quick Metrics Bar */}
          <div className="hero-stats-banner">
            <div className="hero-stat-item">
              <span className="stat-value">4-Factor</span>
              <span className="stat-label">Multi-Variable Analysis</span>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat-item">
              <span className="stat-value">0–100</span>
              <span className="stat-label">Predictive Safety Score</span>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat-item">
              <span className="stat-value">&lt; 10ms</span>
              <span className="stat-label">Real-Time AI Inference</span>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat-item">
              <span className="stat-value">100%</span>
              <span className="stat-label">Dual-Token Session Security</span>
            </div>
          </div>

          {/* Live Preview Safety Card */}
          <div className="hero-preview-wrapper">
            <div className="hero-preview-card">
              <div className="preview-card-header">
                <div className="preview-badge">
                  <CheckCircle2 size={14} />
                  <span>Demonstration Evaluation</span>
                </div>
                <div className="preview-endpoints">
                  <span>Deccan Gymkhana</span>
                  <span className="arrow">&rarr;</span>
                  <span>Koregaon Park, Pune</span>
                </div>
              </div>

              <div className="preview-body">
                <div className="preview-score-box">
                  <div className="preview-score-circle">
                    <span className="preview-score-num">88</span>
                    <span className="preview-score-denom">/100</span>
                  </div>
                  <div className="preview-status">
                    <span className="preview-status-pill high">🌟 High Safety Rating</span>
                    <p className="preview-advisory">
                      Optimal illumination and active foot traffic along main boulevards. Highly recommended for evening walking.
                    </p>
                  </div>
                </div>

                <div className="preview-factors-grid">
                  <div className="preview-factor-bar">
                    <div className="factor-bar-header">
                      <span>💡 Street Illumination</span>
                      <strong>90%</strong>
                    </div>
                    <div className="factor-track">
                      <div className="factor-fill" style={{ width: '90%', background: '#087f8c' }} />
                    </div>
                  </div>

                  <div className="preview-factor-bar">
                    <div className="factor-bar-header">
                      <span>🛡️ Crime Suppression</span>
                      <strong>90%</strong>
                    </div>
                    <div className="factor-track">
                      <div className="factor-fill" style={{ width: '90%', background: '#10b981' }} />
                    </div>
                  </div>

                  <div className="preview-factor-bar">
                    <div className="factor-bar-header">
                      <span>🚦 Traffic Hazard Safety</span>
                      <strong>80%</strong>
                    </div>
                    <div className="factor-track">
                      <div className="factor-fill" style={{ width: '80%', background: '#3b82f6' }} />
                    </div>
                  </div>

                  <div className="preview-factor-bar">
                    <div className="factor-bar-header">
                      <span>👥 Bystander Activity</span>
                      <strong>85%</strong>
                    </div>
                    <div className="factor-track">
                      <div className="factor-fill" style={{ width: '85%', background: '#8b5cf6' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Features Section */}
      <section className="landing-section features-section" id="features">
        <div className="section-header">
          <span className="section-pill">Core Capabilities</span>
          <h2>Intelligent Protection Designed for Everyday Travel</h2>
          <p className="section-desc">
            SafeRoute combines multi-variable risk metrics, machine learning predictions, and enterprise security
            to ensure you never have to walk in the dark.
          </p>
        </div>

        <div className="features-grid">
          <article className="feature-box">
            <div className="feature-icon-wrapper teal">
              <Eye size={24} />
            </div>
            <h3>Street Illumination Intelligence</h3>
            <p>
              Measures road lighting quality, active lamp-post coverage, and shadow density along urban pathways
              to steer pedestrians away from unlit alleys.
            </p>
          </article>

          <article className="feature-box">
            <div className="feature-icon-wrapper green">
              <Shield size={24} />
            </div>
            <h3>Crime Suppression Index</h3>
            <p>
              Analyzes historical municipal police records, reported incident densities, and neighborhood risk factors
              to steer travelers through secure corridors.
            </p>
          </article>

          <article className="feature-box">
            <div className="feature-icon-wrapper blue">
              <Activity size={24} />
            </div>
            <h3>Traffic & Accident Hazard Safety</h3>
            <p>
              Identifies high-collision intersections, blind corners, and construction hazards to prioritize pedestrian-friendly,
              safe road crossings.
            </p>
          </article>

          <article className="feature-box">
            <div className="feature-icon-wrapper purple">
              <User size={24} />
            </div>
            <h3>Pedestrian & Bystander Density</h3>
            <p>
              Leverages foot-traffic patterns, active open storefronts, and transit hub proximity to maximize the presence
              of natural surveillance.
            </p>
          </article>

          <article className="feature-box">
            <div className="feature-icon-wrapper orange">
              <Cpu size={24} />
            </div>
            <h3>Random Forest AI Scoring Model</h3>
            <p>
              A 60-tree ensemble ML model serves instant 0–100 journey safety ratings with sub-10ms response times
              via a dedicated FastAPI microservice.
            </p>
          </article>

          <article className="feature-box">
            <div className="feature-icon-wrapper red">
              <Lock size={24} />
            </div>
            <h3>Enterprise Dual-Token Security</h3>
            <p>
              Restricted 15-minute in-memory JWTs paired with 7-day httpOnly Refresh Token Rotation (RTR),
              anti-enumeration protection, and 6-digit OTP verification.
            </p>
          </article>
        </div>
      </section>

      {/* 4. How It Works Section */}
      <section className="landing-section how-it-works-section" id="how-it-works">
        <div className="section-header">
          <span className="section-pill">Step-By-Step Workflow</span>
          <h2>How SafeRoute Protects Your Journey</h2>
          <p className="section-desc">
            Experience safety-conscious navigation in four intuitive steps.
          </p>
        </div>

        <div className="steps-container">
          <div className="step-card">
            <div className="step-number-badge">01</div>
            <div className="step-icon-circle">
              <Navigation size={22} />
            </div>
            <h4>Input Starting Point & Destination</h4>
            <p>
              Enter your current location and target address. SafeRoute maps out candidate corridors for evaluation.
            </p>
          </div>

          <div className="step-card">
            <div className="step-number-badge">02</div>
            <div className="step-icon-circle">
              <Cpu size={22} />
            </div>
            <h4>Multi-Factor AI Assessment</h4>
            <p>
              Our machine learning engine ingests lighting, crime risk, accident hazards, and foot traffic factors.
            </p>
          </div>

          <div className="step-card">
            <div className="step-number-badge">03</div>
            <div className="step-icon-circle">
              <SlidersHorizontal size={22} />
            </div>
            <h4>Select Safety Priority Profile</h4>
            <p>
              Choose between Well-Lit Night Walk, Direct Commute, Maximum Caution, or fine-tune individual factor sliders.
            </p>
          </div>

          <div className="step-card">
            <div className="step-number-badge">04</div>
            <div className="step-icon-circle">
              <Shield size={22} />
            </div>
            <h4>Travel With Full Confidence</h4>
            <p>
              Review your 0–100 safety score, inspect progress breakdown meters, and read contextual safety advisories.
            </p>
          </div>
        </div>
      </section>

      {/* 5. AI Priority Presets Section */}
      <section className="landing-section ai-engine-section" id="ai-engine">
        <div className="section-header">
          <span className="section-pill">Tailored Navigation</span>
          <h2>Dynamic Safety Priority Profiles</h2>
          <p className="section-desc">
            Every traveler has distinct priorities. SafeRoute adapts to your specific needs.
          </p>
        </div>

        <div className="priority-cards-grid">
          <div className="priority-card">
            <div className="priority-card-header">
              <div className="priority-icon-pill night">
                <Moon size={18} />
              </div>
              <h4>Well-Lit Night Walk</h4>
            </div>
            <p>
              Maximizes street illumination (9/10) and foot traffic (8/10) to guide night commuters through well-lit, populated boulevards.
            </p>
            <div className="priority-tags">
              <span>💡 Lighting: 90%</span>
              <span>👥 Bystanders: 80%</span>
            </div>
          </div>

          <div className="priority-card">
            <div className="priority-card-header">
              <div className="priority-icon-pill commute">
                <Zap size={18} />
              </div>
              <h4>Direct Commute</h4>
            </div>
            <p>
              Strikes a practical balance between travel efficiency and safety considerations for daytime transit and scheduled commutes.
            </p>
            <div className="priority-tags">
              <span>⚡ Balanced Efficiency</span>
              <span>⏱️ Transit Optimized</span>
            </div>
          </div>

          <div className="priority-card">
            <div className="priority-card-header">
              <div className="priority-icon-pill maximum">
                <Shield size={18} />
              </div>
              <h4>Maximum Caution</h4>
            </div>
            <p>
              Enforces strict zero-tolerance for crime and traffic hazards, prioritizing only the most secure and supervised urban routes.
            </p>
            <div className="priority-tags">
              <span>🚨 Zero Hazard Tolerance</span>
              <span>🛡️ Maximum Security</span>
            </div>
          </div>

          <div className="priority-card">
            <div className="priority-card-header">
              <div className="priority-icon-pill custom">
                <SlidersHorizontal size={18} />
              </div>
              <h4>Custom Factor Tuning</h4>
            </div>
            <p>
              Take complete control with granular sliders for Illumination, Crime Index, Accident Probability, and Crowd Density.
            </p>
            <div className="priority-tags">
              <span>🎛️ 4 Granular Sliders</span>
              <span>✨ Personalized Logic</span>
            </div>
          </div>
        </div>
      </section>

      {/* 6. About Section */}
      <section className="landing-section about-section" id="about">
        <div className="about-content-card">
          <div className="about-badge">
            <KeyRound size={16} />
            <span>Mission & Architectural Foundation</span>
          </div>
          <h2>Building a Safer World for Pedestrians</h2>
          <p>
            SafeRoute was created to address a critical flaw in modern mapping applications: the disregard for
            pedestrian vulnerability after dark. Whether walking home from campus, commuting after a late shift,
            or exploring unfamiliar cities, travelers deserve navigation that values human safety above pure travel speed.
          </p>
          <div className="architecture-specs-row">
            <div className="spec-item">
              <strong>Frontend</strong>
              <span>React 19 &bull; TypeScript &bull; GSAP Canvas &bull; Lucide React</span>
            </div>
            <div className="spec-item">
              <strong>API Gateway</strong>
              <span>Node.js &bull; Express 5 &bull; Helmet &bull; Dual-Persistence</span>
            </div>
            <div className="spec-item">
              <strong>AI Service</strong>
              <span>Python 3.12 &bull; FastAPI &bull; Scikit-Learn Random Forest</span>
            </div>
          </div>
        </div>
      </section>

      {/* 7. CTA Banner */}
      <section className="landing-cta-banner">
        <div className="cta-banner-content">
          <h2>Ready to Choose the Safest Journey?</h2>
          <p>
            Join thousands of travelers who plan journeys with personalized safety scoring and real-time risk evaluations.
          </p>
          <div className="cta-banner-actions">
            <button className="cta-banner-btn-primary" onClick={onSignUp}>
              <Sparkles size={18} />
              <span>Create Free Account</span>
            </button>
            <button className="cta-banner-btn-secondary" onClick={onSignIn}>
              <User size={18} />
              <span>Sign In to SafeRoute</span>
            </button>
          </div>
        </div>
      </section>

      {/* 8. Footer */}
      <footer className="landing-footer">
        <div className="footer-top-row">
          <div className="footer-brand">
            <div className="footer-logo">
              <Shield size={20} color="#087f8c" />
              <h3>SafeRoute</h3>
            </div>
            <p>
              AI-Powered Safety-Aware Route Navigation and Security Management.
              Empowering smarter, safer urban journeys.
            </p>
          </div>

          <div className="footer-links-group">
            <div className="footer-links-col">
              <h4>Navigation</h4>
              <a href="#home">Home</a>
              <a href="#features">Features</a>
              <a href="#how-it-works">How It Works</a>
              <a href="#ai-engine">AI Engine</a>
            </div>

            <div className="footer-links-col">
              <h4>Platform</h4>
              <a href="#about">About SafeRoute</a>
              <button className="footer-link-btn" onClick={onSignIn}>
                Traveler Sign In
              </button>
              <button className="footer-link-btn" onClick={onSignUp}>
                Register Account
              </button>
            </div>
          </div>
        </div>

        <div className="footer-bottom-row">
          <p>&copy; {new Date().getFullYear()} SafeRoute. Smarter Journeys. Safer Choices. All rights reserved.</p>
          <div className="footer-badge-list">
            <span className="footer-tech-pill">React 19</span>
            <span className="footer-tech-pill">Node.js 20</span>
            <span className="footer-tech-pill">FastAPI ML</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
export default LandingPage;
