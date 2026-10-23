import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const FAQS = [
  {
    q: 'How does SafeRoute calculate route safety scores?',
    a: 'SafeRoute evaluates every candidate corridor across four critical parameters: municipal streetlighting quality (0–10), historical violent and property crime density (0–10), vehicular collision hazard frequency (0–10), and active bystander foot traffic (0–10). A 60-tree Random Forest Regressor hosted on a FastAPI microservice processes these inputs to output a deterministic 0–100 safety score with clear advisory context.',
  },
  {
    q: 'How does SafeRoute differ from Google Maps or Apple Maps?',
    a: 'Standard mapping applications optimize strictly for minimal travel time and shortest Euclidean distance. This frequently directs travelers through dark, unmonitored alleys or deserted shortcuts. SafeRoute puts personal safety first: it identifies well-lit avenues with active storefronts and pedestrian traffic, recommending corridors where you never have to walk in isolation.',
  },
  {
    q: 'What happens if the Python AI microservice is temporarily offline?',
    a: 'SafeRoute is engineered with a zero-downtime heuristic fallback engine. If the FastAPI scoring microservice experiences network latency or partition, the Express API Gateway automatically executes an onboard calibrated mathematical heuristic formula, ensuring uninterrupted route evaluation for travelers on the move.',
  },
  {
    q: 'Is my travel history and location private?',
    a: 'Absolutely. Route histories are stored only with authenticated user references and strict ownership verification. Only you can view or delete your saved trips. Furthermore, administrative audit logs automatically redact all sensitive identifiers and credentials before persistence.',
  },
  {
    q: 'Can I customize safety priorities for night walks versus daylight commutes?',
    a: 'Yes. SafeRoute features dynamic priority profiles: "Well-Lit Night Walk" (which heavily weights illumination and bystander presence), "Direct Commute" (balancing efficiency with baseline safety), and "Maximum Caution" (strictly suppressing crime and collision risks), plus full manual slider tuning.',
  },
  {
    q: 'How does the Admin Command Center work?',
    a: 'Authorized administrators can log in via /admin to monitor live system telemetry (CPU, server uptime, API latency), inspect microservice health checks, oversee user directories with 1-click privilege management, and simulate safety risk scenarios using the administrative AI engine.',
  },
];

export const FaqSection: React.FC = () => {
  const { isDark } = useTheme();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="relative py-24 px-4 max-w-4xl mx-auto">
      <div className="flex flex-col items-center text-center mb-14">
        <span
          className={`text-xs font-mono uppercase tracking-widest mb-2 font-semibold ${
            isDark ? 'text-zinc-500' : 'text-zinc-400'
          }`}
        >
          Frequently Clarified Questions
        </span>
        <h2
          className={`text-3xl sm:text-4xl font-extrabold tracking-tight mb-3 ${
            isDark ? 'text-white' : 'text-zinc-900'
          }`}
        >
          Everything You Need to Know
        </h2>
        <p className={`max-w-md text-sm sm:text-base ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
          Specifications, deployment tips, and integration details for SafeRoute's AI navigation platform.
        </p>
      </div>

      <div className="space-y-3">
        {FAQS.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={idx}
              className={`rounded-2xl border overflow-hidden transition-all ${
                isDark
                  ? 'bg-white/[0.02] border-white/[0.07]'
                  : 'bg-white border-zinc-200 shadow-sm'
              }`}
            >
              <button
                onClick={() => setOpenIndex(isOpen ? null : idx)}
                className={`w-full flex items-center justify-between p-5 sm:p-6 text-left cursor-pointer transition-colors ${
                  isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-zinc-50'
                }`}
              >
                <span
                  className={`text-sm sm:text-base font-semibold pr-4 ${
                    isDark ? 'text-white' : 'text-zinc-900'
                  }`}
                >
                  {faq.q}
                </span>
                <ChevronDown
                  className={`w-4 h-4 shrink-0 transition-transform duration-200 ${
                    isOpen
                      ? `rotate-180 ${isDark ? 'text-white' : 'text-zinc-900'}`
                      : isDark
                      ? 'text-zinc-400'
                      : 'text-zinc-500'
                  }`}
                />
              </button>
              {isOpen && (
                <div
                  className={`px-5 sm:px-6 pb-6 text-xs sm:text-sm leading-relaxed border-t pt-4 ${
                    isDark
                      ? 'text-zinc-400 border-white/[0.04]'
                      : 'text-zinc-600 border-zinc-100'
                  }`}
                >
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
