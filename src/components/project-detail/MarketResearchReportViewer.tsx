import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { FiChevronDown, FiChevronUp, FiExternalLink, FiCheck, FiAlertCircle, FiImage, FiArrowRight } from 'react-icons/fi';

interface MarketResearchReportViewerProps {
  data: any;
  onGenerateNew?: () => void;
  projectId?: string;
  onSave?: (updatedData: any) => Promise<void>;
}

export const MarketResearchReportViewer = ({ data, onGenerateNew, projectId, onSave }: MarketResearchReportViewerProps) => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'part1': true,
    'competitive': false,
    'comparative': false,
    'differentiation': false,
    'affordability': false,
    'references': false,
  });

  let reportData = data?.content || data;
  
  // If the LLM returned it as an array (as per the prompt schema), extract the first object
  if (Array.isArray(reportData) && reportData.length > 0) {
    reportData = reportData[0];
  }

  if (!reportData || Object.keys(reportData).length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 border border-dashed border-gray-100">
        <FiAlertCircle className="w-8 h-8 text-gray-200 mb-4" />
        <p className="text-xs text-gray-400 uppercase tracking-widest">No Market Research Data Available</p>
      </div>
    );
  }

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const part1 = reportData['Part 1'];
  const part2 = reportData['Part 2'];
  const references = reportData['References'];

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-gray-100 pb-8 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
        <div className="min-w-0 text-left">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">
            Market Research
          </h1>
          <p className="mt-2 max-w-xl text-base leading-snug text-gray-500">
            Competitive landscape and differentiation analysis report
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-start gap-2 sm:justify-end">
          {onGenerateNew && (
            <button
              type="button"
              onClick={onGenerateNew}
              className="rounded-lg bg-black px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-white hover:bg-black/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Generate New
            </button>
          )}
        </div>
      </div>

      {/* Part 1: Project Overview */}
      {part1 && (
        <section className="rounded-2xl border border-gray-200 bg-white p-8">
          <h2 className="mb-8 text-xs font-medium uppercase tracking-wide text-gray-500">Project Overview</h2>
          
          <div className="flex flex-col gap-10">
            {part1['Project Name'] && (
              <div>
                <label className="mb-3 block text-xs font-medium uppercase tracking-wide text-gray-500">Project Name</label>
                <p className="border-l-2 border-gray-900 pl-4 text-xl font-bold text-gray-900 leading-tight">
                  {part1['Project Name']}
                </p>
              </div>
            )}
            
            {part1['Core Idea'] && (
              <div>
                <label className="mb-3 block text-xs font-medium uppercase tracking-wide text-gray-500">Core Idea</label>
                <p className="border-l border-gray-200 pl-4 text-sm leading-relaxed text-gray-600">
                  {part1['Core Idea']}
                </p>
              </div>
            )}

            {part1['Key Features'] && (
              <div>
                <label className="mb-3 block text-xs font-medium uppercase tracking-wide text-gray-500">Key Features</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-4 border-l border-gray-200">
                  {part1['Key Features'].map((feature: string, i: number) => (
                    <div key={i} className="flex items-start gap-3">
                      <FiArrowRight className="w-3 h-3 mt-1 text-gray-400 flex-shrink-0" />
                      <p className="text-sm text-gray-600 leading-relaxed">{feature}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {part1['Prototype Artifacts'] && part1['Prototype Artifacts'].length > 0 && (
              <div>
                <label className="mb-3 block text-xs font-medium uppercase tracking-wide text-gray-500">Prototype Artifacts</label>
                <div className="flex gap-4 flex-wrap pl-4 border-l border-gray-200">
                  {part1['Prototype Artifacts'].map((artifact: any, i: number) => (
                    <div key={i} className="flex gap-2">
                      {artifact.Sketch && (
                        <a href={artifact.Sketch} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-100 text-gray-900 text-[10px] font-bold uppercase tracking-widest rounded-lg hover:bg-gray-100 transition-colors">
                          <FiImage className="w-3 h-3" /> Sketch <FiExternalLink className="w-2 h-2" />
                        </a>
                      )}
                      {artifact.Image && (
                        <a href={artifact.Image} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-100 text-gray-900 text-[10px] font-bold uppercase tracking-widest rounded-lg hover:bg-gray-100 transition-colors">
                          <FiImage className="w-3 h-3" /> Image <FiExternalLink className="w-2 h-2" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Part 2 Sections */}
      <div className="space-y-6">
        <h2 className="mb-8 text-xs font-medium uppercase tracking-wide text-gray-500">Market Analysis</h2>

        {/* Competitive Landscape */}
        {part2?.['1. Competitive Landscape'] && (
          <div className="overflow-hidden rounded-xl border border-gray-200">
            <button
              onClick={() => toggleSection('competitive')}
              className={`flex w-full items-center justify-between px-6 py-4 text-left transition-colors ${expandedSections.competitive ? 'bg-black text-white' : 'bg-white text-gray-900 hover:bg-gray-50'}`}
            >
              <div className="flex items-center gap-4">
                <span className={`text-xs font-medium uppercase tracking-wide ${expandedSections.competitive ? 'opacity-70' : 'text-gray-500'}`}>Part 2.1</span>
                <span className="text-sm font-medium">Competitive Landscape</span>
              </div>
              <span className="text-xs">{expandedSections.competitive ? 'CLOSE' : 'EXPAND'}</span>
            </button>
            {expandedSections.competitive && (
              <div className="bg-white p-8 flex flex-col gap-8 border-t border-gray-100">
                <div className="grid grid-cols-1 gap-8">
                  {part2['1. Competitive Landscape'].map((competitor: any, i: number) => (
                    <div key={i} className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide">{competitor['Competitor Name']}</h4>
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed italic border-l-2 border-gray-100 pl-4">
                        {competitor['Description of Their Solution']}
                      </p>
                      <div className="grid md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Strengths (Pros)</label>
                          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <p className="text-xs text-gray-600 leading-relaxed">{competitor['Pros']}</p>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Weaknesses (Cons)</label>
                          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <p className="text-xs text-gray-600 leading-relaxed">{competitor['Cons']}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Comparative Analysis */}
        {part2?.['2. Comparative Analysis: Your Idea vs. Existing Solutions'] && (
          <div className="overflow-hidden rounded-xl border border-gray-200">
            <button
              onClick={() => toggleSection('comparative')}
              className={`flex w-full items-center justify-between px-6 py-4 text-left transition-colors ${expandedSections.comparative ? 'bg-black text-white' : 'bg-white text-gray-900 hover:bg-gray-50'}`}
            >
              <div className="flex items-center gap-4">
                <span className={`text-xs font-medium uppercase tracking-wide ${expandedSections.comparative ? 'opacity-70' : 'text-gray-500'}`}>Part 2.2</span>
                <span className="text-sm font-medium">Comparative Analysis</span>
              </div>
              <span className="text-xs">{expandedSections.comparative ? 'CLOSE' : 'EXPAND'}</span>
            </button>
            {expandedSections.comparative && (
              <div className="bg-white p-8 flex flex-col gap-12 border-t border-gray-100">
                {/* How the Proposed Idea is Better */}
                {part2['2. Comparative Analysis: Your Idea vs. Existing Solutions']['How the Proposed Idea is Better'] && (
                  <div className="space-y-6">
                    <label className="text-xs font-medium uppercase tracking-wide text-gray-500">Core Advantages</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {part2['2. Comparative Analysis: Your Idea vs. Existing Solutions']['How the Proposed Idea is Better'].map((item: any, i: number) => (
                        <div key={i} className="space-y-3 pl-6 border-l border-gray-200">
                          <p className="text-sm font-semibold text-gray-900">{item['Advantage']}</p>
                          {item['Evidence'] && (
                            <ul className="space-y-2">
                              {item['Evidence'].map((ev: string, j: number) => (
                                <li key={j} className="text-xs text-gray-500 leading-relaxed flex items-start gap-2">
                                  <span className="mt-1.5 w-1 h-1 bg-gray-300 rounded-full flex-shrink-0" />
                                  {ev}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Final Assessment */}
                {part2['2. Comparative Analysis: Your Idea vs. Existing Solutions']['Is the Proposed Idea Truly the Best Option?'] && (
                  <div className="pt-12 border-t border-gray-100">
                    <div className="rounded-xl border border-gray-200 bg-white p-8 flex flex-col md:flex-row items-center gap-12">
                      <div className="flex-shrink-0">
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Strategic Assessment</span>
                      </div>
                      <div className="flex-1 w-full">
                        <h3 className="text-lg font-medium text-gray-900 leading-relaxed italic">
                          "{part2['2. Comparative Analysis: Your Idea vs. Existing Solutions']['Is the Proposed Idea Truly the Best Option?']['Assessment']}"
                        </h3>
                        {part2['2. Comparative Analysis: Your Idea vs. Existing Solutions']['Is the Proposed Idea Truly the Best Option?']['Evidence'] && (
                          <div className="mt-6 flex flex-wrap gap-x-8 gap-y-2">
                            {part2['2. Comparative Analysis: Your Idea vs. Existing Solutions']['Is the Proposed Idea Truly the Best Option?']['Evidence'].map((ev: string, j: number) => (
                              <p key={j} className="text-xs font-medium text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <FiCheck className="w-3 h-3 text-gray-300" /> {ev}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Differentiation and Value Proposition */}
        {part2?.['3. Differentiation and Value Proposition'] && (
          <div className="overflow-hidden rounded-xl border border-gray-200">
            <button
              onClick={() => toggleSection('differentiation')}
              className={`flex w-full items-center justify-between px-6 py-4 text-left transition-colors ${expandedSections.differentiation ? 'bg-black text-white' : 'bg-white text-gray-900 hover:bg-gray-50'}`}
            >
              <div className="flex items-center gap-4">
                <span className={`text-xs font-medium uppercase tracking-wide ${expandedSections.differentiation ? 'opacity-70' : 'text-gray-500'}`}>Part 2.3</span>
                <span className="text-sm font-medium">Differentiation & Value Prop</span>
              </div>
              <span className="text-xs">{expandedSections.differentiation ? 'CLOSE' : 'EXPAND'}</span>
            </button>
            {expandedSections.differentiation && (
              <div className="bg-white p-8 flex flex-col gap-12 border-t border-gray-100">
                {part2['3. Differentiation and Value Proposition'].map((item: any, i: number) => (
                  <div key={i} className="flex flex-col gap-12">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                      <div className="space-y-6">
                        <label className="text-xs font-medium uppercase tracking-wide text-gray-500">Unique Differentiator</label>
                        <p className="text-sm font-medium text-gray-900 border-l-2 border-black pl-4">
                          {item['Unique Differentiator']}
                        </p>
                      </div>
                      <div className="space-y-6">
                        <label className="text-xs font-medium uppercase tracking-wide text-gray-500">Evidence of Differentiation</label>
                        <div className="space-y-3 pl-6 border-l border-gray-200">
                          {item['Evidence']?.map((ev: string, j: number) => (
                            <p key={j} className="text-sm text-gray-600 leading-relaxed">{ev}</p>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="pt-12 border-t border-gray-100">
                      <div className="bg-gray-900 text-white p-8 rounded-xl">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-4">Value Proposition</label>
                        <p className="text-lg font-medium leading-relaxed italic">
                          "{item['Value Proposition']}"
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Affordability Analysis */}
        {part2?.['4. Affordability Analysis'] && (
          <div className="overflow-hidden rounded-xl border border-gray-200">
            <button
              onClick={() => toggleSection('affordability')}
              className={`flex w-full items-center justify-between px-6 py-4 text-left transition-colors ${expandedSections.affordability ? 'bg-black text-white' : 'bg-white text-gray-900 hover:bg-gray-50'}`}
            >
              <div className="flex items-center gap-4">
                <span className={`text-xs font-medium uppercase tracking-wide ${expandedSections.affordability ? 'opacity-70' : 'text-gray-500'}`}>Part 2.4</span>
                <span className="text-sm font-medium">Affordability Analysis</span>
              </div>
              <span className="text-xs">{expandedSections.affordability ? 'CLOSE' : 'EXPAND'}</span>
            </button>
            {expandedSections.affordability && (
              <div className="bg-white p-8 flex flex-col gap-12 border-t border-gray-100">
                {part2['4. Affordability Analysis'].map((item: any, i: number) => (
                  <div key={i} className="flex flex-col gap-10">
                    <div className="flex flex-col md:flex-row gap-12">
                      <div className="md:w-1/3">
                        <label className="text-xs font-medium uppercase tracking-wide text-gray-500 block mb-4">Statement</label>
                        <div className={`p-4 rounded-xl border ${item['Affordability Statement']?.toLowerCase().includes('not affordable') ? 'border-red-100 bg-red-50 text-red-900' : 'border-gray-100 bg-gray-50 text-gray-900'}`}>
                          <div className="flex items-center gap-2">
                            {item['Affordability Statement']?.toLowerCase().includes('not affordable') ? <FiAlertCircle className="w-4 h-4" /> : <FiCheck className="w-4 h-4" />}
                            <span className="text-xs font-bold uppercase tracking-wider">{item['Affordability Statement']}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex-1">
                        <label className="text-xs font-medium uppercase tracking-wide text-gray-500 block mb-4">Justification</label>
                        <p className="text-sm leading-relaxed text-gray-600 border-l border-gray-200 pl-6">
                          {item['Justification']}
                        </p>
                      </div>
                    </div>
                    {item['Evidence'] && (
                      <div className="pt-8 border-t border-gray-100">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-4">Validation Data</label>
                        <div className="flex flex-wrap gap-8 pl-6 border-l border-gray-200">
                          {item['Evidence'].map((ev: string, j: number) => (
                            <p key={j} className="text-xs text-gray-400 font-medium">{ev}</p>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* References */}
        {references && references.length > 0 && (
          <div className="overflow-hidden rounded-xl border border-gray-200">
            <button
              onClick={() => toggleSection('references')}
              className={`flex w-full items-center justify-between px-6 py-4 text-left transition-colors ${expandedSections.references ? 'bg-black text-white' : 'bg-white text-gray-900 hover:bg-gray-50'}`}
            >
              <div className="flex items-center gap-4">
                <span className={`text-xs font-medium uppercase tracking-wide ${expandedSections.references ? 'opacity-70' : 'text-gray-500'}`}>REF</span>
                <span className="text-sm font-medium">Credible Sources</span>
              </div>
              <span className="text-xs">{expandedSections.references ? 'CLOSE' : 'EXPAND'}</span>
            </button>
            {expandedSections.references && (
              <div className="bg-white p-8 border-t border-gray-100">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {references.map((ref: any, i: number) => (
                    <div key={i} className="rounded-xl p-6 border border-gray-50 hover:border-black group transition-all">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="text-sm font-medium text-gray-900 mb-2">{ref['Title']}</h3>
                          <a href={ref['URL']} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold uppercase tracking-widest text-gray-400 group-hover:text-black transition-colors border-b border-gray-100 hover:border-black inline-flex items-center gap-1">
                            View Full Source <FiExternalLink className="w-2 h-2" />
                          </a>
                        </div>
                        <span className="text-[10px] font-bold text-gray-300 group-hover:text-black">REF-0{i + 1}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Metadata */}
      {data.generated_at && (
        <div className="text-xs text-gray-400 text-center pt-8 border-t border-gray-100 uppercase tracking-widest">
          Market Intelligence Synchronized on {new Date(data.generated_at).toLocaleString()}
        </div>
      )}
    </div>
  );
};
