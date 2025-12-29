import { useState } from 'react';
import { FiChevronDown, FiChevronRight, FiExternalLink, FiCheck, FiAlertCircle, FiImage } from 'react-icons/fi';

interface MarketResearchReportViewerProps {
    data: any;
    onGenerateNew?: () => void;
}

export const MarketResearchReportViewer = ({ data, onGenerateNew }: MarketResearchReportViewerProps) => {
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
        'part1': true,
        'competitive': false,
        'comparative': false,
        'differentiation': false,
        'affordability': false,
        'references': false,
    });

    const reportData = data?.content || data;

    if (!reportData) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500">No Market Research data available</p>
            </div>
        );
    }

    const toggleSection = (section: string) => {
        setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const SectionHeader = ({ id, title, color = 'emerald' }: { id: string; title: string; color?: string }) => (
        <button
            onClick={() => toggleSection(id)}
            className={`w-full flex items-center justify-between p-4 bg-gradient-to-r from-${color}-50 to-teal-50 hover:from-${color}-100 hover:to-teal-100 transition-colors rounded-t-xl`}
        >
            <h2 className="text-lg font-bold text-gray-900">{title}</h2>
            {expandedSections[id] ? (
                <FiChevronDown className="w-5 h-5 text-gray-600" />
            ) : (
                <FiChevronRight className="w-5 h-5 text-gray-600" />
            )}
        </button>
    );

    const part1 = reportData['Part 1'];
    const part2 = reportData['Part 2'];
    const references = reportData['References'];

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between pb-4">
                <h1 className="text-2xl font-bold text-gray-900">Market Research Report</h1>
                {onGenerateNew && (
                    <button
                        onClick={onGenerateNew}
                        className="px-6 py-2 font-semibold bg-gray-900 text-white hover:bg-gray-700 transition-colors rounded-lg"
                    >
                        Generate New
                    </button>
                )}
            </div>

            {/* Part 1: Project Overview */}
            {part1 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <SectionHeader id="part1" title="Part 1: Project Overview" />
                    {expandedSections.part1 && (
                        <div className="p-6 space-y-4">
                            {part1['Project Name'] && (
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Project Name</h3>
                                    <p className="text-xl font-bold text-emerald-700 mt-1">{part1['Project Name']}</p>
                                </div>
                            )}
                            {part1['Core Idea'] && (
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Core Idea</h3>
                                    <p className="text-gray-700 mt-1">{part1['Core Idea']}</p>
                                </div>
                            )}
                            {part1['Key Features'] && (
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Key Features</h3>
                                    <ul className="space-y-2">
                                        {part1['Key Features'].map((feature: string, i: number) => (
                                            <li key={i} className="flex items-start gap-2 text-gray-700">
                                                <FiCheck className="w-4 h-4 text-emerald-500 mt-1 flex-shrink-0" />
                                                <span>{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {part1['Prototype Artifacts'] && part1['Prototype Artifacts'].length > 0 && (
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Prototype Artifacts</h3>
                                    <div className="flex gap-4 flex-wrap">
                                        {part1['Prototype Artifacts'].map((artifact: any, i: number) => (
                                            <div key={i}>
                                                {artifact.Sketch && (
                                                    <a href={artifact.Sketch} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors">
                                                        <FiImage className="w-4 h-4" /> Sketch
                                                        <FiExternalLink className="w-3 h-3" />
                                                    </a>
                                                )}
                                                {artifact.Image && (
                                                    <a href={artifact.Image} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors">
                                                        <FiImage className="w-4 h-4" /> Image
                                                        <FiExternalLink className="w-3 h-3" />
                                                    </a>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Competitive Landscape */}
            {part2?.['1. Competitive Landscape'] && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <SectionHeader id="competitive" title="1. Competitive Landscape" />
                    {expandedSections.competitive && (
                        <div className="p-6 space-y-4">
                            {part2['1. Competitive Landscape'].map((competitor: any, i: number) => (
                                <div key={i} className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                                    <h4 className="font-bold text-gray-900 mb-2">{competitor['Competitor Name']}</h4>
                                    <p className="text-sm text-gray-600 mb-3">{competitor['Description of Their Solution']}</p>
                                    <div className="grid md:grid-cols-2 gap-3">
                                        <div className="bg-green-50 rounded p-3">
                                            <span className="text-xs font-semibold text-green-700 uppercase">Pros</span>
                                            <p className="text-sm text-green-800 mt-1">{competitor['Pros']}</p>
                                        </div>
                                        <div className="bg-red-50 rounded p-3">
                                            <span className="text-xs font-semibold text-red-700 uppercase">Cons</span>
                                            <p className="text-sm text-red-800 mt-1">{competitor['Cons']}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Comparative Analysis */}
            {part2?.['2. Comparative Analysis: Your Idea vs. Existing Solutions'] && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <SectionHeader id="comparative" title="2. Comparative Analysis" />
                    {expandedSections.comparative && (
                        <div className="p-6 space-y-6">
                            {/* How the Proposed Idea is Better */}
                            {part2['2. Comparative Analysis: Your Idea vs. Existing Solutions']['How the Proposed Idea is Better'] && (
                                <div>
                                    <h3 className="font-semibold text-emerald-700 mb-3">How Your Idea is Better</h3>
                                    <div className="space-y-3">
                                        {part2['2. Comparative Analysis: Your Idea vs. Existing Solutions']['How the Proposed Idea is Better'].map((item: any, i: number) => (
                                            <div key={i} className="bg-emerald-50 rounded-lg p-4 border border-emerald-100">
                                                <p className="font-medium text-emerald-800">{item['Advantage']}</p>
                                                {item['Evidence'] && (
                                                    <ul className="mt-2 space-y-1">
                                                        {item['Evidence'].map((ev: string, j: number) => (
                                                            <li key={j} className="text-sm text-emerald-700 italic">• {ev}</li>
                                                        ))}
                                                    </ul>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Is the Proposed Idea Truly the Best Option? */}
                            {part2['2. Comparative Analysis: Your Idea vs. Existing Solutions']['Is the Proposed Idea Truly the Best Option?'] && (
                                <div>
                                    <h3 className="font-semibold text-amber-700 mb-3">Assessment: Is This Truly the Best Option?</h3>
                                    <div className="bg-amber-50 rounded-lg p-4 border border-amber-100">
                                        <p className="text-amber-900">{part2['2. Comparative Analysis: Your Idea vs. Existing Solutions']['Is the Proposed Idea Truly the Best Option?']['Assessment']}</p>
                                        {part2['2. Comparative Analysis: Your Idea vs. Existing Solutions']['Is the Proposed Idea Truly the Best Option?']['Evidence'] && (
                                            <ul className="mt-3 space-y-1">
                                                {part2['2. Comparative Analysis: Your Idea vs. Existing Solutions']['Is the Proposed Idea Truly the Best Option?']['Evidence'].map((ev: string, j: number) => (
                                                    <li key={j} className="text-sm text-amber-700 italic">• {ev}</li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Differentiation and Value Proposition */}
            {part2?.['3. Differentiation and Value Proposition'] && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <SectionHeader id="differentiation" title="3. Differentiation & Value Proposition" />
                    {expandedSections.differentiation && (
                        <div className="p-6 space-y-4">
                            {part2['3. Differentiation and Value Proposition'].map((item: any, i: number) => (
                                <div key={i}>
                                    {item['Unique Differentiator'] && (
                                        <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-100 mb-3">
                                            <h4 className="font-semibold text-indigo-800">Unique Differentiator</h4>
                                            <p className="text-indigo-700 mt-1">{item['Unique Differentiator']}</p>
                                            {item['Evidence'] && (
                                                <ul className="mt-2 space-y-1">
                                                    {item['Evidence'].map((ev: string, j: number) => (
                                                        <li key={j} className="text-sm text-indigo-600 italic">• {ev}</li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    )}
                                    {item['Value Proposition'] && (
                                        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg p-4 text-white">
                                            <h4 className="font-semibold">Value Proposition</h4>
                                            <p className="mt-1">{item['Value Proposition']}</p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Affordability Analysis */}
            {part2?.['4. Affordability Analysis'] && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <SectionHeader id="affordability" title="4. Affordability Analysis" />
                    {expandedSections.affordability && (
                        <div className="p-6 space-y-4">
                            {part2['4. Affordability Analysis'].map((item: any, i: number) => (
                                <div key={i} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                    <div className="flex items-center gap-2 mb-2">
                                        {item['Affordability Statement']?.toLowerCase().includes('not affordable') ? (
                                            <FiAlertCircle className="w-5 h-5 text-red-500" />
                                        ) : (
                                            <FiCheck className="w-5 h-5 text-green-500" />
                                        )}
                                        <span className={`font-bold ${item['Affordability Statement']?.toLowerCase().includes('not affordable') ? 'text-red-700' : 'text-green-700'}`}>
                                            {item['Affordability Statement']}
                                        </span>
                                    </div>
                                    <p className="text-gray-700 text-sm">{item['Justification']}</p>
                                    {item['Evidence'] && (
                                        <ul className="mt-2 space-y-1">
                                            {item['Evidence'].map((ev: string, j: number) => (
                                                <li key={j} className="text-xs text-gray-500 italic">• {ev}</li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* References */}
            {references && references.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <SectionHeader id="references" title="References" />
                    {expandedSections.references && (
                        <div className="p-6">
                            <ul className="space-y-2">
                                {references.map((ref: any, i: number) => (
                                    <li key={i} className="flex items-center gap-2">
                                        <span className="text-gray-500 text-sm">[{i + 1}]</span>
                                        <a
                                            href={ref['URL']}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:underline text-sm flex items-center gap-1"
                                        >
                                            {ref['Title']}
                                            <FiExternalLink className="w-3 h-3" />
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}

            {/* Report Metadata */}
            {data?.generated_at && (
                <div className="text-sm text-gray-500 text-center pt-4">
                    Report generated on {new Date(data.generated_at).toLocaleString()}
                </div>
            )}
        </div>
    );
};
