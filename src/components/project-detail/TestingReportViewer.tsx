import { useState } from 'react';
import { FiChevronDown, FiChevronRight, FiAlertTriangle, FiCheckCircle, FiInfo } from 'react-icons/fi';

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
            className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-cyan-50 to-blue-50 hover:from-cyan-100 hover:to-blue-100 transition-colors rounded-t-xl"
        >
            <div className="flex items-center gap-3">
                <Icon className="w-5 h-5 text-cyan-600" />
                <h2 className="text-lg font-bold text-gray-900">{title}</h2>
            </div>
            {expandedSections[id] ? (
                <FiChevronDown className="w-5 h-5 text-gray-600" />
            ) : (
                <FiChevronRight className="w-5 h-5 text-gray-600" />
            )}
        </button>
    );

    const IssueCard = ({ issue, index }: { issue: any; index: number }) => (
        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
            <div className="flex items-start justify-between gap-4">
                <p className="font-medium text-gray-900">{issue.issue}</p>
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
                    <summary className="cursor-pointer text-gray-600 hover:text-gray-900">
                        View manifestations per persona
                    </summary>
                    <div className="mt-2 space-y-2 pl-4 border-l-2 border-gray-200">
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
    );

    const ModificationCard = ({ mod, index }: { mod: any; index: number }) => (
        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
            <div className="font-medium text-gray-900 text-sm border-b pb-2">{mod.issue}</div>
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
                    <span className="font-medium text-green-700">Design Change:</span>
                    <p className="text-gray-600 mt-1">{mod.design_change}</p>
                </div>
                <div>
                    <span className="font-medium text-blue-700">Why It Matters:</span>
                    <p className="text-gray-600 mt-1">{mod.why_it_matters}</p>
                </div>
                <div>
                    <span className="font-medium text-orange-700">Implementation Approach:</span>
                    <p className="text-gray-600 mt-1">{mod.implementation_approach}</p>
                </div>
                <div>
                    <span className="font-medium text-cyan-700">Success Metric:</span>
                    <p className="text-gray-600 mt-1">{mod.success_metric}</p>
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between pb-4">
                <h1 className="text-2xl font-bold text-gray-900">Testing Analysis Report</h1>
                {onGenerateNew && (
                    <button
                        onClick={onGenerateNew}
                        className="px-6 py-2 font-semibold bg-gray-900 text-white hover:bg-gray-700 transition-colors rounded-lg"
                    >
                        Generate New
                    </button>
                )}
            </div>

            {/* Section A: Priority Issues */}
            {reportData['SECTION A: Priority Issues & Pain Points'] && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <SectionHeader id="sectionA" title="Priority Issues & Pain Points" icon={FiAlertTriangle} />
                    {expandedSections.sectionA && (
                        <div className="p-4 space-y-6">
                            {/* Critical Issues */}
                            {reportData['SECTION A: Priority Issues & Pain Points'].Critical && (
                                <div>
                                    <h3 className="text-sm font-bold text-red-700 mb-3 flex items-center gap-2">
                                        <span className="w-2 h-2 bg-red-500 rounded-full"></span>
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
                                    <h3 className="text-sm font-bold text-yellow-700 mb-3 flex items-center gap-2">
                                        <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
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
                                    <h3 className="text-sm font-bold text-green-700 mb-3 flex items-center gap-2">
                                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
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
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <SectionHeader id="sectionB" title="Key Modifications to Make Prototype Desirable" icon={FiCheckCircle} />
                    {expandedSections.sectionB && (
                        <div className="p-4 space-y-4">
                            {reportData['SECTION B: Key Modifications to Make the Prototype Desirable']['Issues mapped to modifications']?.map((mod: any, i: number) => (
                                <ModificationCard key={i} mod={mod} index={i} />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Section C: Design Recommendations */}
            {reportData['SECTION C: Design Recommendations by Category'] && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <SectionHeader id="sectionC" title="Design Recommendations by Category" icon={FiInfo} />
                    {expandedSections.sectionC && (
                        <div className="p-4 space-y-4">
                            {Object.entries(reportData['SECTION C: Design Recommendations by Category']).map(([category, items]) => (
                                <div key={category} className="bg-gray-50 rounded-lg p-4">
                                    <h4 className="font-semibold text-gray-900 mb-2">{category}</h4>
                                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
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
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <SectionHeader id="sectionD" title="Quick Wins vs Strategic Improvements" icon={FiInfo} />
                    {expandedSections.sectionD && (
                        <div className="p-4 grid md:grid-cols-3 gap-4">
                            {reportData['SECTION D: Quick Wins vs Strategic Improvements']['Quick Wins'] && (
                                <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                                    <h4 className="font-semibold text-green-800 mb-2">Quick Wins</h4>
                                    <ul className="list-disc list-inside space-y-1 text-sm text-green-700">
                                        {reportData['SECTION D: Quick Wins vs Strategic Improvements']['Quick Wins'].map((item: string, i: number) => (
                                            <li key={i}>{item}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {reportData['SECTION D: Quick Wins vs Strategic Improvements']['Strategic Improvements'] && (
                                <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                                    <h4 className="font-semibold text-blue-800 mb-2">Strategic Improvements</h4>
                                    <ul className="list-disc list-inside space-y-1 text-sm text-blue-700">
                                        {reportData['SECTION D: Quick Wins vs Strategic Improvements']['Strategic Improvements'].map((item: string, i: number) => (
                                            <li key={i}>{item}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {reportData['SECTION D: Quick Wins vs Strategic Improvements']['Future Enhancements'] && (
                                <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
                                    <h4 className="font-semibold text-purple-800 mb-2">Future Enhancements</h4>
                                    <ul className="list-disc list-inside space-y-1 text-sm text-purple-700">
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
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <SectionHeader id="sectionE" title="Implementation Roadmap" icon={FiInfo} />
                    {expandedSections.sectionE && (
                        <div className="p-4 space-y-4">
                            {Object.entries(reportData['SECTION E: Implementation Roadmap']).map(([phase, items], idx) => (
                                <div key={phase} className="flex gap-4">
                                    <div className="flex flex-col items-center">
                                        <div className="w-8 h-8 rounded-full bg-cyan-600 text-white flex items-center justify-center font-bold text-sm">
                                            {idx + 1}
                                        </div>
                                        {idx < Object.keys(reportData['SECTION E: Implementation Roadmap']).length - 1 && (
                                            <div className="w-0.5 flex-1 bg-cyan-200 mt-2"></div>
                                        )}
                                    </div>
                                    <div className="flex-1 pb-4">
                                        <h4 className="font-semibold text-gray-900 mb-2">{phase}</h4>
                                        <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
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
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <SectionHeader id="sectionF" title="Cross-Persona Insights & Themes" icon={FiInfo} />
                    {expandedSections.sectionF && (
                        <div className="p-4 grid md:grid-cols-2 gap-4">
                            {reportData['SECTION F: Cross-Persona Insights & Themes']['Recurring patterns'] && (
                                <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-100">
                                    <h4 className="font-semibold text-indigo-800 mb-2">Recurring Patterns</h4>
                                    <ul className="list-disc list-inside space-y-1 text-sm text-indigo-700">
                                        {reportData['SECTION F: Cross-Persona Insights & Themes']['Recurring patterns'].map((item: string, i: number) => (
                                            <li key={i}>{item}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {reportData['SECTION F: Cross-Persona Insights & Themes']['Design implications'] && (
                                <div className="bg-amber-50 rounded-lg p-4 border border-amber-100">
                                    <h4 className="font-semibold text-amber-800 mb-2">Design Implications</h4>
                                    <ul className="list-disc list-inside space-y-1 text-sm text-amber-700">
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
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <SectionHeader id="sectionG" title="What Works Well (Keep & Enhance)" icon={FiCheckCircle} />
                    {expandedSections.sectionG && (
                        <div className="p-4">
                            <ul className="list-disc list-inside space-y-2 text-sm text-gray-700">
                                {reportData['SECTION G: What Works Well (Keep & Enhance)'].map((item: string, i: number) => (
                                    <li key={i} className="bg-green-50 p-2 rounded">{item}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}

            {/* Section H: Final Recommendations */}
            {reportData['SECTION H: Final Recommendations for Next Iteration'] && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <SectionHeader id="sectionH" title="Final Recommendations for Next Iteration" icon={FiInfo} />
                    {expandedSections.sectionH && (
                        <div className="p-4 space-y-4">
                            {reportData['SECTION H: Final Recommendations for Next Iteration']['Top 3 priority actions'] && (
                                <div className="bg-red-50 rounded-lg p-4 border border-red-100">
                                    <h4 className="font-semibold text-red-800 mb-2">Top 3 Priority Actions</h4>
                                    <ol className="list-decimal list-inside space-y-1 text-sm text-red-700">
                                        {reportData['SECTION H: Final Recommendations for Next Iteration']['Top 3 priority actions'].map((item: string, i: number) => (
                                            <li key={i}>{item}</li>
                                        ))}
                                    </ol>
                                </div>
                            )}
                            {reportData['SECTION H: Final Recommendations for Next Iteration']['Success criteria'] && (
                                <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                                    <h4 className="font-semibold text-green-800 mb-2">Success Criteria</h4>
                                    <ul className="list-disc list-inside space-y-1 text-sm text-green-700">
                                        {reportData['SECTION H: Final Recommendations for Next Iteration']['Success criteria'].map((item: string, i: number) => (
                                            <li key={i}>{item}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {reportData['SECTION H: Final Recommendations for Next Iteration']['Validation plan'] && (
                                <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                                    <h4 className="font-semibold text-blue-800 mb-2">Validation Plan</h4>
                                    <ul className="list-disc list-inside space-y-1 text-sm text-blue-700">
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
                <div className="text-sm text-gray-500 text-center pt-4">
                    Report generated on {new Date(data.generated_at).toLocaleString()}
                </div>
            )}
        </div>
    );
};
