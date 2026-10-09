import { useState } from 'react';
import './App.css';
import DotGrid from './components/DotGrid';
import { predictRouteSafety } from './services/api';
import type { SafetyResult } from './services/api';

function App() {
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const [result, setResult] = useState<SafetyResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleFindSafeRoute() {
    if (!source.trim() || !destination.trim()) {
      setError('Please enter both source and destination.');
      setResult(null);
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      // Temporary demo values; these are not real route measurements.
      const prediction = await predictRouteSafety({
        lighting: 8,
        crime_risk: 2,
        accident_risk: 3,
        crowd_level: 7,
      });

      setResult(prediction);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <header className="navbar">
        <h2>SafeRoute</h2>

        <nav>
          <a href="#home">Home</a>
          <a href="#features">Features</a>
          <a href="#about">About</a>
        </nav>

        <button
          className="login-btn"
          onClick={() => alert('Login feature coming soon!')}
        >
          Login
        </button>
      </header>

      <main>
        <section className="hero" id="home">
          <div className="hero-dot-bg" aria-hidden="true">
            <DotGrid
              dotSize={6}
              gap={22}
              baseColor="#b9e4e8"
              activeColor="#087f8c"
              proximity={140}
              shockRadius={250}
              shockStrength={4}
              resistance={750}
              returnDuration={1.5}
            />
          </div>

          <div className="hero-content">
            <p className="tagline">SMARTER JOURNEYS. SAFER CHOICES.</p>


          <h1>
            Your Journey,
            <br />
            Your Safety.
          </h1>

          <p className="description">
            Find a route with safety in mind. SafeRoute uses AI-based
            demo safety scoring to help demonstrate a smarter approach
            to route planning.
          </p>

          <div className="route-form">
            <label>
              Starting Point
              <input
                type="text"
                placeholder="Enter your starting location"
                value={source}
                onChange={(e) => setSource(e.target.value)}
              />
            </label>

            <label>
              Destination
              <input
                type="text"
                placeholder="Enter your destination"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
              />
            </label>

            <button
              className="search-btn"
              onClick={handleFindSafeRoute}
              disabled={loading}
            >
              {loading ? 'Calculating...' : 'Find a Safe Route'}
            </button>
          </div>

          {error && (
            <p className="error-message" role="alert">
              {error}
            </p>
          )}

          {result && (
            <section className="result-card" aria-live="polite">
              <h2>Demo Route Safety Score</h2>

              <p className="score">
                {result.safety_score}
                <span>/100</span>
              </p>

              <p>
                <strong>From:</strong> {source}
              </p>

              <p>
                <strong>To:</strong> {destination}
              </p>

              <p>
                <strong>Model:</strong> {result.model}
              </p>

              <p>
                <strong>Data type:</strong> {result.data_type}
              </p>

              <p className="warning-message">{result.warning}</p>
            </section>
          )}
          </div>
        </section>


        <section className="features" id="features">
          <article className="feature-card">
            <span>🛡️</span>
            <h3>Safety-Aware Planning</h3>
            <p>
              Explore how lighting, crime risk, accident risk, and
              crowd levels can contribute to a route safety score.
            </p>
          </article>

          <article className="feature-card">
            <span>🤖</span>
            <h3>AI-Powered Scoring</h3>
            <p>
              A Random Forest model generates a demonstration score
              from the supplied safety factors.
            </p>
          </article>

          <article className="feature-card">
            <span>📍</span>
            <h3>Route Planning</h3>
            <p>
              Source and destination entry is ready. Real map-based
              route calculation is a future integration step.
            </p>
          </article>
        </section>

        <section className="about-section" id="about">
          <h2>About SafeRoute</h2>
          <p>
            SafeRoute is a project prototype exploring safety-aware
            navigation. Its current score uses demo inputs and is not
            validated for real-world safety decisions.
          </p>
        </section>
      </main>

      <footer>
        <p>© 2026 SafeRoute | AI-Powered Safety-Aware Route Planning</p>
      </footer>
    </>
  );
}

export default App;
