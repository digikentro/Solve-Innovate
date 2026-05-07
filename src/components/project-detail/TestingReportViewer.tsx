import { useState } from 'react';
import { ChevronDown, ChevronRight, AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface TestingReportViewerProps {
    data: any;
    onGenerateNew?: () => void;
    projectId?: string;
    onSave?: (updatedData: any) => Promise<void>;
}

export const TestingReportViewer = ({ data, onGenerateNew, projectId, onSave }: TestingReportViewerProps) => {
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
        'sectionA': true,
        'sectionB': false,
        'sectionC': false,
        'sectionD': false,
        'sectionE': false,
        'sectionF': false,
        'sectionG': false,
        'sectionH': false,
    });

    const reportData = data?.content || data;

    if (!reportData) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500">No Testing data available</p>
            </div>
        );
    }

    const toggleSection = (section: string) => {
        setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const getImpactColor = (impact: string) => {
        switch (impact?.toLowerCase()) {
            case 'high': return 'bg-red-100 text-red-700 border-red-200';
            case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'low': return 'bg-green-100 text-green-700 border-green-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const SectionHeader = ({ id, title, icon: Icon }: { id: string; title: string; icon: any }) => (
        <button
            onClick={() => toggleSection(id)}
            className={`flex w-full items-center justify-between px-6 py-4 text-left transition-colors ${
                expandedSections[id] ? 'bg-black text-white' : 'bg-white text-gray-900 hover:bg-gray-50'
            }`}
        >
            <div className="flex items-center gap-3">
                <Icon className="w-5 h-5" />
                <span className="text-sm font-semibold">{title}</span>
            </div>
            {expandedSections[id] ? (
                <ChevronDown className="w-5 h-5" />
            ) : (
                <ChevronRight className="w-5 h-5" />
            )}
        </button>
    );

    const IssueCard = ({ issue, index }: { issue: any; index: number }) => (
        <div className="rounded-xl border border-gray-200 bg-gray-50">
            <div className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-4">
                    <p className="text-sm font-medium text-gray-900">{issue.issue}</p>
                    <span className={`px-2 py-1 text-xs font-medium rounded border ${getImpactColor(issue.impact)}`}>
                        {issue.impact}
                    </span>
                </div>
                {issue.identified_by && (
                    <div>
                        <p className="text-xs font-medium text-gray-500 mb-1">Identified by:</p>
                        <div className="flex flex-wrap gap-1">
                            {issue.identified_by.map((persona: string, i: number) => (
                                <span key={i} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded">
                                    {persona}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
                {issue.manifestations_per_persona && (
                    <details className="text-sm">
                        <summary className="cursor-pointer text-gray-600 hover:text-gray-900 text-xs">
                            View manifestations per persona
                        </summary>
                        <div className="mt-2 space-y-2 pl-4 border-l-2 border-gray-300">
                            {Object.entries(issue.manifestations_per_persona).map(([persona, manifestation]) => (
                                <div key={persona} className="text-xs">
                                    <span className="font-medium text-gray-700">{persona}:</span>
                                    <span className="text-gray-600 ml-1">{manifestation as string}</span>
                                </div>
                            ))}
                        </div>
                    </details>
                )}
            </div>
        </div>
    );

    const ModificationCard = ({ mod, index }: { mod: any; index: number }) => (
        <div className="rounded-xl border border-gray-200 bg-gray-50">
            <div className="p-4 space-y-3">
                <div className="text-sm font-medium text-gray-900 border-b pb-2">{mod.issue}</div>
                {mod.user_impact && (
                    <div className="flex flex-wrap gap-1">
                        {mod.user_impact.map((user: string, i: number) => (
                            <span key={i} className="px-2 py-0.5 bg-purple-50 text-purple-700 text-xs rounded">
                                {user}
                            </span>
                        ))}
                    </div>
                )}
                <div className="space-y-2 text-sm">
                    <div>
                        <span className="text-xs font-semibold text-green-700">Design Change:</span>
                        <p className="text-xs text-gray-600 mt-1">{mod.design_change}</p>
                    </div>
                    <div>
                        <span className="text-xs font-semibold text-blue-700">Why It Matters:</span>
                        <p className="text-xs text-gray-600 mt-1">{mod.why_it_matters}</p>
                    </div>
                    <div>
                        <span className="text-xs font-semibold text-orange-700">Implementation Approach:</span>
                        <p className="text-xs text-gray-600 mt-1">{mod.implementation_approach}</p>
                    </div>
                    <div>
                        <span className="text-xs font-semibold text-cyan-700">Success Metric:</span>
                        <p className="text-xs text-gray-600 mt-1">{mod.success_metric}</p>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col gap-8">
            {/* Header */}
            <div className="flex flex-col gap-4 border-b border-gray-100 pb-8 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
                <div className="min-w-0 text-left">
                    <h1 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">
                        Testing Analysis Report
                    </h1>
                    <p className="mt-2 max-w-xl text-base leading-snug text-gray-500">
                        Comprehensive testing scenarios and recommendations
                    </p>
                </div>
                {onGenerateNew && (
                    <button
                        type="button"
                        onClick={onGenerateNew}
                        className="rounded-lg bg-black px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-white hover:bg-black/90"
                    >
                        Generate New
                    </button>
                )}
            </div>

            {/* Section A: Priority Issues */}
            {reportData['SECTION A: Priority Issues & Pain Points'] && (
                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
                    <SectionHeader id="sectionA" title="Priority Issues & Pain Points" icon={AlertTriangle} />
                    {expandedSections.sectionA && (
                        <div className="space-y-6 bg-white p-8">
                            {/* Critical Issues */}
                            {reportData['SECTION A: Priority Issues & Pain Points'].Critical && (
                                <div>
                                    <h3 className="text-sm font-semibold text-red-700 mb-3 flex items-center gap-2">
                                        <span className="w-2 h-2 bg-red-500 rounded-md"></span>
                                        Critical Issues ({reportData['SECTION A: Priority Issues & Pain Points'].Critical.length})
                                    </h3>
                                    <div className="space-y-3">
                                        {reportData['SECTION A: Priority Issues & Pain Points'].Critical.map((issue: any, i: number) => (
                                            <IssueCard key={i} issue={issue} index={i} />
                                        ))}
                                    </div>
                                </div>
                            )}
                            {/* Important Issues */}
                            {reportData['SECTION A: Priority Issues & Pain Points'].Important && (
                                <div>
                                    <h3 className="text-sm font-semibold text-yellow-700 mb-3 flex items-center gap-2">
                                        <span className="w-2 h-2 bg-yellow-500 rounded-md"></span>
                                        Important Issues ({reportData['SECTION A: Priority Issues & Pain Points'].Important.length})
                                    </h3>
                                    <div className="space-y-3">
                                        {reportData['SECTION A: Priority Issues & Pain Points'].Important.map((issue: any, i: number) => (
                                            <IssueCard key={i} issue={issue} index={i} />
                                        ))}
                                    </div>
                                </div>
                            )}
                            {/* Minor Issues */}
                            {reportData['SECTION A: Priority Issues & Pain Points'].Minor && (
                                <div>
                                    <h3 className="text-sm font-semibold text-green-700 mb-3 flex items-center gap-2">
                                        <span className="w-2 h-2 bg-green-500 rounded-md"></span>
                                        Minor Issues ({reportData['SECTION A: Priority Issues & Pain Points'].Minor.length})
                                    </h3>
                                    <div className="space-y-3">
                                        {reportData['SECTION A: Priority Issues & Pain Points'].Minor.map((issue: any, i: number) => (
                                            <IssueCard key={i} issue={issue} index={i} />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Section B: Key Modifications */}
            {reportData['SECTION B: Key Modifications to Make the Prototype Desirable'] && (
                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
                    <SectionHeader id="sectionB" title="Key Modifications to Make Prototype Desirable" icon={CheckCircle} />
                    {expandedSections.sectionB && (
                        <div className="space-y-4 bg-white p-8">
                            {reportData['SECTION B: Key Modifications to Make the Prototype Desirable']['Issues mapped to modifications']?.map((mod: any, i: number) => (
                                <ModificationCard key={i} mod={mod} index={i} />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Section C: Design Recommendations */}
            {reportData['SECTION C: Design Recommendations by Category'] && (
                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
                    <SectionHeader id="sectionC" title="Design Recommendations by Category" icon={Info} />
                    {expandedSections.sectionC && (
                        <div className="space-y-4 bg-white p-8">
                            {Object.entries(reportData['SECTION C: Design Recommendations by Category']).map(([category, items]) => (
                                <div key={category} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                                    <h4 className="text-sm font-semibold text-gray-900 mb-2">{category}</h4>
                                    <ul className="list-disc list-inside space-y-1 text-xs text-gray-600">
                                        {(items as string[]).map((item, i) => (
                                            <li key={i}>{item}</li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Section D: Quick Wins vs Strategic */}
            {reportData['SECTION D: Quick Wins vs Strategic Improvements'] && (
                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
                    <SectionHeader id="sectionD" title="Quick Wins vs Strategic Improvements" icon={Info} />
                    {expandedSections.sectionD && (
                        <div className="grid gap-4 bg-white p-8 md:grid-cols-3">
                            {reportData['SECTION D: Quick Wins vs Strategic Improvements']['Quick Wins'] && (
                                <div className="rounded-xl border border-green-100 bg-green-50 p-4">
                                    <h4 className="text-sm font-semibold text-green-800 mb-2">Quick Wins</h4>
                                    <ul className="list-disc list-inside space-y-1 text-xs text-green-700">
                                        {reportData['SECTION D: Quick Wins vs Strategic Improvements']['Quick Wins'].map((item: string, i: number) => (
                                            <li key={i}>{item}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {reportData['SECTION D: Quick Wins vs Strategic Improvements']['Strategic Improvements'] && (
                                <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                                    <h4 className="text-sm font-semibold text-blue-800 mb-2">Strategic Improvements</h4>
                                    <ul className="list-disc list-inside space-y-1 text-xs text-blue-700">
                                        {reportData['SECTION D: Quick Wins vs Strategic Improvements']['Strategic Improvements'].map((item: string, i: number) => (
                                            <li key={i}>{item}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {reportData['SECTION D: Quick Wins vs Strategic Improvements']['Future Enhancements'] && (
                                <div className="rounded-xl border border-purple-100 bg-purple-50 p-4">
                                    <h4 className="text-sm font-semibold text-purple-800 mb-2">Future Enhancements</h4>
                                    <ul className="list-disc list-inside space-y-1 text-xs text-purple-700">
                                        {reportData['SECTION D: Quick Wins vs Strategic Improvements']['Future Enhancements'].map((item: string, i: number) => (
                                            <li key={i}>{item}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Section E: Implementation Roadmap */}
            {reportData['SECTION E: Implementation Roadmap'] && (
                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
                    <SectionHeader id="sectionE" title="Implementation Roadmap" icon={Info} />
                    {expandedSections.sectionE && (
                        <div className="space-y-4 bg-white p-8">
                            {Object.entries(reportData['SECTION E: Implementation Roadmap']).map(([phase, items], idx) => (
                                <div key={phase} className="flex gap-4">
                                    <div className="flex flex-col items-center">
                                        <div className="w-8 h-8 rounded-md bg-primary text-white flex items-center justify-center font-bold text-sm">
                                            {idx + 1}
                                        </div>
                                        {idx < Object.keys(reportData['SECTION E: Implementation Roadmap']).length - 1 && (
                                            <div className="w-0.5 flex-1 bg-gray-200 mt-2"></div>
                                        )}
                                    </div>
                                    <div className="flex-1 pb-4">
                                        <h4 className="text-sm font-semibold text-gray-900 mb-2">{phase}</h4>
                                        <ul className="list-disc list-inside space-y-1 text-xs text-gray-600">
                                            {(items as string[]).map((item, i) => (
                                                <li key={i}>{item}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Section F: Cross-Persona Insights */}
            {reportData['SECTION F: Cross-Persona Insights & Themes'] && (
                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
                    <SectionHeader id="sectionF" title="Cross-Persona Insights & Themes" icon={Info} />
                    {expandedSections.sectionF && (
                        <div className="grid gap-4 bg-white p-8 md:grid-cols-2">
                            {reportData['SECTION F: Cross-Persona Insights & Themes']['Recurring patterns'] && (
                                <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4">
                                    <h4 className="text-sm font-semibold text-indigo-800 mb-2">Recurring Patterns</h4>
                                    <ul className="list-disc list-inside space-y-1 text-xs text-indigo-700">
                                        {reportData['SECTION F: Cross-Persona Insights & Themes']['Recurring patterns'].map((item: string, i: number) => (
                                            <li key={i}>{item}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {reportData['SECTION F: Cross-Persona Insights & Themes']['Design implications'] && (
                                <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
                                    <h4 className="text-sm font-semibold text-amber-800 mb-2">Design Implications</h4>
                                    <ul className="list-disc list-inside space-y-1 text-xs text-amber-700">
                                        {reportData['SECTION F: Cross-Persona Insights & Themes']['Design implications'].map((item: string, i: number) => (
                                            <li key={i}>{item}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Section G: What Works Well */}
            {reportData['SECTION G: What Works Well (Keep & Enhance)'] && (
                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
                    <SectionHeader id="sectionG" title="What Works Well (Keep & Enhance)" icon={CheckCircle} />
                    {expandedSections.sectionG && (
                        <div className="bg-white p-8">
                            <ul className="list-disc list-inside space-y-2 text-xs text-gray-700">
                                {reportData['SECTION G: What Works Well (Keep & Enhance)'].map((item: string, i: number) => (
                                    <li key={i} className="rounded bg-green-50 p-2">{item}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}

            {/* Section H: Final Recommendations */}
            {reportData['SECTION H: Final Recommendations for Next Iteration'] && (
                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
                    <SectionHeader id="sectionH" title="Final Recommendations for Next Iteration" icon={Info} />
                    {expandedSections.sectionH && (
                        <div className="space-y-4 bg-white p-8">
                            {reportData['SECTION H: Final Recommendations for Next Iteration']['Top 3 priority actions'] && (
                                <div className="rounded-xl border border-red-100 bg-red-50 p-4">
                                    <h4 className="text-sm font-semibold text-red-800 mb-2">Top 3 Priority Actions</h4>
                                    <ol className="list-decimal list-inside space-y-1 text-xs text-red-700">
                                        {reportData['SECTION H: Final Recommendations for Next Iteration']['Top 3 priority actions'].map((item: string, i: number) => (
                                            <li key={i}>{item}</li>
                                        ))}
                                    </ol>
                                </div>
                            )}
                            {reportData['SECTION H: Final Recommendations for Next Iteration']['Success criteria'] && (
                                <div className="rounded-xl border border-green-100 bg-green-50 p-4">
                                    <h4 className="text-sm font-semibold text-green-800 mb-2">Success Criteria</h4>
                                    <ul className="list-disc list-inside space-y-1 text-xs text-green-700">
                                        {reportData['SECTION H: Final Recommendations for Next Iteration']['Success criteria'].map((item: string, i: number) => (
                                            <li key={i}>{item}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {reportData['SECTION H: Final Recommendations for Next Iteration']['Validation plan'] && (
                                <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                                    <h4 className="text-sm font-semibold text-blue-800 mb-2">Validation Plan</h4>
                                    <ul className="list-disc list-inside space-y-1 text-xs text-blue-700">
                                        {reportData['SECTION H: Final Recommendations for Next Iteration']['Validation plan'].map((item: string, i: number) => (
                                            <li key={i}>{item}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Report Metadata */}
            {data?.generated_at && (
                <div className="border-t border-gray-100 pt-8 text-center text-[10px] uppercase tracking-[0.2em] text-gray-400">
                    Generated on {new Date(data.generated_at).toLocaleString()} — Solver Labs Research Engine
                </div>
            )}
        </div>
    );
};
