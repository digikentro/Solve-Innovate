import React, { useState } from 'react';
import { CheckCircle, AlertTriangle, TrendingUp, Target, Lightbulb, ExternalLink, Star, Shield, Zap } from 'lucide-react';

const SendIcon = () => (
  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-600 text-white">
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  </span>
);

const ScoreBadge = ({ score, label }: { score: string; label: string }) => (
  <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
    <span className="text-sm font-medium text-gray-700">{label}</span>
    <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-semibold rounded-full">
      {score}
    </span>
  </div>
);

const MetricCard = ({ title, value, icon: Icon, color = "blue" }: { 
  title: string; 
  value: string; 
  icon: any; 
  color?: string;
}) => (
  <div className={`p-4 rounded-xl border border-${color}-100 bg-gradient-to-br from-${color}-50 to-white`}>
    <div className="flex items-center gap-3 mb-2">  
      <Icon className={`w-5 h-5 text-${color}-600`} />
      <h4 className="font-semibold text-gray-800">{title}</h4>
    </div>
    <p className="text-sm text-gray-600">{value}</p>
  </div>
);

const SearchPage: React.FC = () => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    
    // Clean the input by removing newlines and extra whitespace
    const cleanedInput = input.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
  
    // Log the cleaned prompt being sent to backend
    console.log('Sending prompt to backend:', cleanedInput);
    
    try {
      const res = await fetch(`http://localhost:4000/validate-idea?prompt=${encodeURIComponent(cleanedInput)}`, {
        method: 'GET',
      });
      if (!res.ok) throw new Error('Failed to validate idea');
      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-gradient-to-br from-gray-50 to-blue-50">
      <h1 className="text-5xl font-bold mb-2 text-gray-800 text-center">Validate your idea</h1>
      <p className="text-lg text-gray-600 mb-8 text-center">Create something amazing with one simple message.</p>
      <form onSubmit={handleSubmit} className="w-full max-w-3xl mb-8">
        <div className="flex items-center rounded-2xl px-4 py-3 shadow-lg bg-white border border-gray-200 hover:shadow-xl transition-shadow duration-300">
          <textarea
            className="flex-1 border-none outline-none resize-none text-base min-h-[48px] max-h-32 overflow-hidden bg-transparent py-2"
            placeholder="Tell us about your idea"
            value={input}
            onChange={e => setInput(e.target.value)}
            rows={2}
            disabled={loading}
            style={{ boxShadow: 'none', color: 'inherit', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          />
          <button
            type="submit"
            className="ml-3 focus:outline-none"
            disabled={loading}
            aria-label="Send"
          >
            <SendIcon />
          </button>
        </div>
      </form>
      
      {error && (
        <div className="w-full max-w-2xl bg-red-50 border border-red-200 rounded-xl p-6 flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 text-red-500" />
          <span className="text-red-700 font-medium">{error}</span>
        </div>
      )}
      
      {loading && (
        <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center justify-center border border-gray-100">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
          <span className="text-xl font-semibold text-gray-800 mb-2">Analyzing your idea...</span>
          <span className="text-gray-500 text-center">Our AI is evaluating innovation potential, market viability, and strategic opportunities.</span>
        </div>
      )}
      
      {!loading && result && (
        <div className="w-full max-w-6xl bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-8">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle className="w-8 h-8" />
              <h2 className="text-3xl font-bold">Innovation Validation Report</h2>
            </div>
            <p className="text-indigo-100 text-lg">Comprehensive analysis of your idea's potential and strategic positioning</p>
          </div>

          <div className="p-8 space-y-8">
            {/* Executive Summary */}
            <div className="flex flex-col md:flex-row gap-4">
              <MetricCard 
                title="Overall Viability" 
                value={result.validation_summary.overall_viability_score}
                icon={Target}
                color="green"
              />
              <MetricCard 
                title="Unicorn Potential" 
                value={result.validation_summary.unicorn_potential}
                icon={Star}
                color="yellow"
              />
              <MetricCard 
                title="Recommendation" 
                value={result.validation_summary.go_no_go_recommendation}
                icon={CheckCircle}
                color="blue"
              />
            </div>

            {/* Novelty Assessment */}
            <div className="bg-gray-50 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <Lightbulb className="w-6 h-6 text-yellow-600" />
                <h3 className="text-2xl font-bold text-gray-800">Innovation Novelty Assessment</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ScoreBadge score={result.novelty_assessment.technical_novelty} label="Technical Innovation" />
                <ScoreBadge score={result.novelty_assessment.market_approach_novelty} label="Market Approach" />
                <ScoreBadge score={result.novelty_assessment.problem_framing_novelty} label="Problem Framing" />
                <ScoreBadge score={result.novelty_assessment.solution_architecture_novelty} label="Solution Architecture" />
                <ScoreBadge score={result.novelty_assessment.implementation_novelty} label="Implementation" />
                <ScoreBadge score={result.novelty_assessment.impact_measurement_novelty} label="Impact Measurement" />
              </div>
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-2">Justification</h4>
                <p className="text-blue-700 text-sm leading-relaxed">{result.novelty_assessment.comprehensive_justification}</p>
              </div>
            </div>

            {/* Opportunities & Risks */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Opportunities */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                <div className="flex items-center gap-3 mb-4">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                  <h3 className="text-xl font-bold text-gray-800">Key Opportunities</h3>
                </div>
                <ul className="space-y-3">
                  {result.validation_summary.top_3_opportunities.map((op: string, i: number) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-gray-700 text-sm leading-relaxed">{op}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Risks */}
              <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-xl p-6 border border-red-200">
                <div className="flex items-center gap-3 mb-4">
                  <Shield className="w-6 h-6 text-red-600" />
                  <h3 className="text-xl font-bold text-gray-800">Potential Risks</h3>
                </div>
                <ul className="space-y-3">
                  {result.validation_summary.top_3_risks.map((risk: string, i: number) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-gray-700 text-sm leading-relaxed">{risk}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Strategic Recommendations */}
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-6 border border-purple-200">
              <div className="flex items-center gap-3 mb-6">
                <Zap className="w-6 h-6 text-purple-600" />
                <h3 className="text-2xl font-bold text-gray-800">Strategic Recommendations</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {result.strategic_recommendations.map((rec: string, i: number) => (
                  <div key={i} className="bg-white rounded-lg p-4 border border-purple-100 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-gray-700 text-sm leading-relaxed">{rec}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Research Resources */}
            <div className="bg-gray-50 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <ExternalLink className="w-6 h-6 text-gray-600" />
                <h3 className="text-xl font-bold text-gray-800">Further Research Resources</h3>
              </div>
              <div>
                {result.key_urls_for_further_research.map((url: string, i: number) => (
                  <div key={i} className="mb-2">
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      {url}
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchPage;
