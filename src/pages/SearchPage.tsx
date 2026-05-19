import React, { useState } from 'react';
import { FiAlertTriangle, FiLoader } from 'react-icons/fi';
import { HugeiconsIcon } from '@hugeicons/react';
import { CheckCircle } from '@hugeicons/core-free-icons';

const SearchPage: React.FC = () => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const formatIntoLines = (text: string): string[] => {
    if (!text) return [];
    return text
      .split(/\n+|(?<=[.!?])\s+/)
      .map(s => s.trim())
      .filter(Boolean);
  };

  const splitUrls = (value?: string): string[] => {
    if (!value || typeof value !== 'string') return [];
    return value
      .split(/\s*;\s*|\s+/)
      .map(u => u.trim())
      .filter(u => /^https?:\/\//i.test(u));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    const cleanedInput = input.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();

    try {
      const res = await fetch('https://n8n.srv922914.hstgr.cloud/webhook/validate_idea', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ prompt: cleanedInput })
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

  // Render the report after results come in
  const renderReport = () => {
    if (!result) return null;

    // Handle array response
    if (Array.isArray(result)) {
      return (
        <div className="space-y-4">
          {result.map((item: any, idx: number) => (
            <div key={idx}>
              {item.text && <p className="text-base pl-4">{item.text}</p>}
              {Array.isArray(item.citations) && item.citations.length > 0 && (
                <div className="mt-3">
                  <h4 className="font-bold mb-1">Citations</h4>
                  <ul className="list-disc list-inside space-y-1 pl-4">
                    {item.citations.map((url: string, i: number) => (
                      <li key={i} className="text-sm">
                        <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{url}</a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      );
    }

    return (
      <>
        {/* Validation Summary */}
        {result?.validation_summary && (
          <section className="p-6 bg-gray-50">
            <h2 className="text-2xl font-bold mb-4 pb-2">Validation Summary</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Overall Viability Score</h3>
                <p className="text-base pl-4">{result?.validation_summary?.overall_viability_score || '-'}</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Unicorn Potential</h3>
                <p className="text-base pl-4">{result?.validation_summary?.unicorn_potential || '-'}</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Go/No-Go Recommendation</h3>
                <p className="text-base pl-4">{result?.validation_summary?.go_no_go_recommendation || '-'}</p>
              </div>
            </div>
          </section>
        )}

        {/* Novelty Assessment */}
        {result?.novelty_assessment && (
          <section className="p-6 bg-gray-50">
            <h2 className="text-2xl font-bold mb-4 pb-2">Innovation Novelty Assessment</h2>
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <span className="font-semibold">Technical Innovation:</span>
                  <p className="text-sm pl-2">{result?.novelty_assessment?.technical_novelty || '-'}</p>
                </div>
                <div>
                  <span className="font-semibold">Market Approach:</span>
                  <p className="text-sm pl-2">{result?.novelty_assessment?.market_approach_novelty || '-'}</p>
                </div>
                <div>
                  <span className="font-semibold">Problem Framing:</span>
                  <p className="text-sm pl-2">{result?.novelty_assessment?.problem_framing_novelty || '-'}</p>
                </div>
                <div>
                  <span className="font-semibold">Solution Architecture:</span>
                  <p className="text-sm pl-2">{result?.novelty_assessment?.solution_architecture_novelty || '-'}</p>
                </div>
                <div>
                  <span className="font-semibold">Implementation:</span>
                  <p className="text-sm pl-2">{result?.novelty_assessment?.implementation_novelty || '-'}</p>
                </div>
                <div>
                  <span className="font-semibold">Impact Measurement:</span>
                  <p className="text-sm pl-2">{result?.novelty_assessment?.impact_measurement_novelty || '-'}</p>
                </div>
              </div>
              {result?.novelty_assessment?.comprehensive_justification && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Comprehensive Justification</h3>
                  <ul className="list-disc list-inside space-y-1 pl-4">
                    {formatIntoLines(result?.novelty_assessment?.comprehensive_justification).map((line: string, i: number) => (
                      <li key={i} className="text-sm">{line}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Opportunities */}
        {result?.validation_summary?.top_3_opportunities && (
          <section className="p-6 bg-gray-50">
            <h2 className="text-2xl font-bold mb-4 pb-2">Key Opportunities</h2>
            <ul className="list-disc list-inside space-y-1 pl-4">
              {result?.validation_summary?.top_3_opportunities.map((op: string, i: number) => (
                <li key={i} className="text-sm">{op}</li>
              ))}
            </ul>
          </section>
        )}

        {/* Risks */}
        {result?.validation_summary?.top_3_risks && (
          <section className="p-6 bg-gray-50">
            <h2 className="text-2xl font-bold mb-4 pb-2">Potential Risks</h2>
            <ul className="list-disc list-inside space-y-1 pl-4">
              {result?.validation_summary?.top_3_risks.map((risk: string, i: number) => (
                <li key={i} className="text-sm">{risk}</li>
              ))}
            </ul>
          </section>
        )}

        {/* Strategic Recommendations */}
        {Array.isArray(result?.strategic_recommendations) && result?.strategic_recommendations.length > 0 && (
          <section className="p-6 bg-gray-50">
            <h2 className="text-2xl font-bold mb-4 pb-2">Strategic Recommendations</h2>
            <ul className="list-disc list-inside space-y-1 pl-4">
              {result?.strategic_recommendations.map((rec: string, i: number) => (
                <li key={i} className="text-sm">{rec}</li>
              ))}
            </ul>
          </section>
        )}

        {/* Further Research Resources */}
        {Array.isArray(result?.key_urls_for_further_research) && result?.key_urls_for_further_research.length > 0 && (
          <section className="p-6 bg-gray-50">
            <h2 className="text-2xl font-bold mb-4 pb-2">Further Research Resources</h2>
            <ul className="list-disc list-inside space-y-1 pl-4">
              {result?.key_urls_for_further_research.map((url: string, i: number) => (
                <li key={i} className="text-sm">
                  <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">{url}</a>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* White Space Opportunities */}
        {Array.isArray(result?.white_space_opportunities) && result.white_space_opportunities.length > 0 && (
          <section className="space-y-6">
            <h2 className="text-2xl font-bold mb-4 pb-2">White Space Opportunities</h2>
            {result.white_space_opportunities.map((ws: any, idx: number) => (
              <div key={idx} className="bg-gray-50 p-6 rounded-xl">
                <h3 className="text-lg font-semibold mb-4">Opportunity {idx + 1}</h3>
                <div className="space-y-4 pl-4">
                  {ws.opportunity && (
                    <div>
                      <h4 className="font-bold mb-1">Description</h4>
                      <p className="text-base">{ws.opportunity}</p>
                    </div>
                  )}
                  {ws.market_size_estimate && (
                    <div>
                      <h4 className="font-bold mb-1">Market Size Estimate</h4>
                      <p className="text-base">{ws.market_size_estimate}</p>
                    </div>
                  )}
                  {ws.access_strategy && (
                    <div>
                      <h4 className="font-bold mb-1">Access Strategy</h4>
                      <ul className="list-disc list-inside space-y-1 pl-4">
                        {formatIntoLines(ws.access_strategy).map((line: string, i: number) => (
                          <li key={i} className="text-sm">{line}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {ws.source_url && (
                    <div>
                      <h4 className="font-bold mb-1">Source URLs</h4>
                      <ul className="list-disc list-inside space-y-1 pl-4">
                        {splitUrls(ws.source_url).map((u, i) => (
                          <li key={i} className="text-sm">
                            <a href={u} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">{u}</a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </section>
        )}

        {/* Patent Landscape */}
        {result?.patent_landscape && (
          <section className="space-y-6">
            <h2 className="text-2xl font-bold mb-4 pb-2">Patent Landscape</h2>

            {/* Relevant Patents */}
            {Array.isArray(result.patent_landscape.relevant_patents) && result.patent_landscape.relevant_patents.length > 0 && (
              <>
                {result.patent_landscape.relevant_patents.map((p: any, idx: number) => (
                  <div key={idx} className="bg-gray-50 p-6 rounded-xl">
                    <h3 className="text-lg font-semibold mb-4">Patent {idx + 1}: {p.patent_area || 'Relevant Patent'}</h3>
                    <div className="space-y-4 pl-4">
                      {p.patent_area && (
                        <div>
                          <h4 className="font-bold mb-1">Patent Area</h4>
                          <p className="text-base">{p.patent_area}</p>
                        </div>
                      )}
                      {p.key_insights && (
                        <div>
                          <h4 className="font-bold mb-1">Key Insights</h4>
                          <ul className="list-disc list-inside space-y-1 pl-4">
                            {formatIntoLines(p.key_insights).map((line: string, i: number) => (
                              <li key={i} className="text-sm">{line}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {p.infringement_risk && (
                        <div>
                          <h4 className="font-bold mb-1">Infringement Risk</h4>
                          <p className="text-base">{p.infringement_risk}</p>
                        </div>
                      )}
                      {p.source_url && (
                        <div>
                          <h4 className="font-bold mb-1">Source URLs</h4>
                          <ul className="list-disc list-inside space-y-1 pl-4">
                            {splitUrls(p.source_url).map((u, i) => (
                              <li key={i} className="text-sm">
                                <a href={u} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">{u}</a>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* Freedom to Operate */}
            {result.patent_landscape.freedom_to_operate && (
              <div className="bg-gray-50 p-6 rounded-xl">
                <h3 className="text-lg font-semibold mb-4">Freedom to Operate</h3>
                <div className="space-y-4 pl-4">
                  <ul className="list-disc list-inside space-y-1 pl-4">
                    {formatIntoLines(result.patent_landscape.freedom_to_operate).map((line: string, i: number) => (
                      <li key={i} className="text-sm">{line}</li>
                    ))}
                  </ul>
                  {result.patent_landscape.source_url && (
                    <div>
                      <h4 className="font-bold mb-1">Source URLs</h4>
                      <ul className="list-disc list-inside space-y-1 pl-4">
                        {splitUrls(result.patent_landscape.source_url).map((u, i) => (
                          <li key={i} className="text-sm">
                            <a href={u} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">{u}</a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>
        )}
      </>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Validate Your Idea</h1>
          <p className="text-gray-600">Get AI-powered insights on innovation potential, market viability, and strategic opportunities.</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Input Form */}
        <form onSubmit={handleSubmit} className="mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <textarea
              className="w-full border-none outline-none resize-none text-base min-h-[100px] bg-transparent"
              placeholder="Describe your idea in detail..."
              value={input}
              onChange={e => setInput(e.target.value)}
              rows={4}
              disabled={loading}
            />
            <div className="flex justify-end pt-3 border-t border-gray-100">
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className={`
                  inline-flex items-center gap-2 px-6 py-2.5 rounded-lg font-semibold text-sm
                  transition-colors
                  ${loading || !input.trim()
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-900 text-white hover:bg-gray-800'
                  }
                `}
              >
                {loading ? (
                  <>
                    <FiLoader className="w-4 h-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <HugeiconsIcon icon={CheckCircle} />
                    Validate Idea
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 mb-8">
            <FiAlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <span className="text-red-700">{error}</span>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-lg font-semibold text-gray-900 mb-1">Analyzing your idea...</p>
            <p className="text-gray-500 text-sm">Evaluating innovation potential, market viability, and strategic opportunities.</p>
          </div>
        )}

        {/* Results - Using same structure as other report viewers */}
        {!loading && result && (
          <div className="space-y-8">
            {/* Header */}
            <div className="pb-4 flex items-center justify-between">
              <h1 className="text-3xl font-bold">Innovation Validation Report</h1>
              <button
                onClick={() => { setResult(null); setInput(''); }}
                className="px-6 py-2 text-[0.85rem] font-semibold bg-gray-900 text-white hover:bg-gray-700 transition-colors rounded-md"
              >
                Generate New
              </button>
            </div>

            {renderReport()}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;
