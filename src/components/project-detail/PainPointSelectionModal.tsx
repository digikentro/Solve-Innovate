import { useState, useEffect } from 'react';
import { X, AlertTriangle, TrendingUp } from 'lucide-react';
import { FiX } from 'react-icons/fi';
import { getAsIsMapContent } from '@/components/project/AsIsMap';

interface PainPoint {
  stage_id: number;
  step_id: number;
  pain_level: number;
  description: string;
  impact_scope?: string; // For top bottlenecks
  bottleneck_evidence?: string[];
  current_solutions_gap?: string[];
}

interface AsIsMapData {
  content?: {
    pain_point_analysis?: {
      steps?: PainPoint[];
    };
    pareto_prioritization?: {
      top_bottlenecks?: PainPoint[];
    };
  };
}

interface PainPointSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPainPoint: (painPoint: { step: string; description: string }) => void;
  onSelectAllPainPoints?: (payload: { steps: string; descriptions: string; items: PainPoint[] }) => void;
  asIsMapData: AsIsMapData | null;
  project: any;
}

export const PainPointSelectionModal = ({
  isOpen,
  onClose,
  onSelectPainPoint,
  onSelectAllPainPoints,
  asIsMapData,
  project
}: PainPointSelectionModalProps) => {

  if (!isOpen) return null;

  // Extract pain points from As-Is Map data using utility function
  const getAllPainPoints = (): PainPoint[] => {
    const content = getAsIsMapContent(asIsMapData, project?.as_is_map_data || project?.as_is_map);
    console.log('PainPointModal - AsIs Map Content:', content);
    
    // Handle both object format and array format
    if (content?.['PAIN POINT ANALYSIS']) {
      const painPointAnalysis = content['PAIN POINT ANALYSIS'];
      
      // If it's in the new format with steps array
      if (painPointAnalysis.steps) {
        return painPointAnalysis.steps;
      }
      
      // If it's in the old format with step keys
      const painPoints: PainPoint[] = [];
      Object.entries(painPointAnalysis).forEach(([stepKey, painInfo]: [string, any]) => {
        const isString = typeof painInfo === 'string';
        const painLevelFromString = isString ? (painInfo.match(/Pain\s*Level\s*(\d+)/i)?.[1] || '5') : null;
        const painLevel = !isString ? painInfo?.Pain_Level : parseInt(painLevelFromString || '5');
        const description = !isString ? painInfo?.Description : painInfo;
        
        // Extract stage and step from key (e.g., "Step_1_1" -> stage: 1, step: 1)
        const match = stepKey.match(/Step_(\d+)_(\d+)/);
        if (match) {
          painPoints.push({
            stage_id: parseInt(match[1]),
            step_id: parseInt(match[2]),
            pain_level: painLevel,
            description: description
          });
        }
      });
      
      return painPoints;
    }
    
    // Fallback to direct content structure
    return content?.pain_point_analysis?.steps || [];
  };



  const allPainPoints = getAllPainPoints();

  const getPainLevelColor = (level: number) => {
    if (level >= 8) return 'text-red-600 bg-red-100';
    if (level >= 6) return 'text-orange-600 bg-orange-100';
    if (level >= 4) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  const getPainLevelIcon = (level: number) => {
    if (level >= 8) return <AlertTriangle className="w-3 h-3" />;
    if (level >= 6) return <TrendingUp className="w-3 h-3" />;
    return null;
  };

  const handleSelectPainPoint = (painPoint: PainPoint) => {
    const stepLabel = `Stage ${painPoint.stage_id}, Step ${painPoint.step_id}`;
    onSelectPainPoint({
      step: stepLabel,
      description: painPoint.description
    });
    onClose();
  };

  const displayPainPoints = allPainPoints;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden shadow-2xl border border-gray-200">
        {/* Header */}
        <div className="px-8 py-6 bg-white border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100">
                <AlertTriangle className="h-5 w-5 text-gray-900" />
              </div>
              <div>
                <h3 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">Select Pain Point</h3>
                <p className="mt-2 max-w-xl text-base leading-snug text-gray-500">Choose a pain point from your As-Is Map analysis</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <FiX className="w-6 h-6 text-gray-500" />
            </button>
          </div>
        </div>



        {/* Content */}
        <div className="p-8 max-h-[55vh] overflow-y-auto">
          {!allPainPoints.length ? (
            <div className="text-center py-12">
              <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-semibold text-gray-900">No Pain Points Available</p>
              <p className="mt-2 text-sm text-gray-600">Please generate an As-Is Map first to see pain points here.</p>
              <p className="mt-4 text-xs bg-gray-50 text-gray-700 p-3 rounded-xl border border-gray-200">
                💡 <strong>Tip:</strong> Go to the "As-Is Map" section first, generate your map, and then come back here to select from the identified pain points.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {displayPainPoints.map((painPoint, index) => (
                <div
                  key={`${painPoint.stage_id}-${painPoint.step_id}`}
                  className="border border-gray-200 rounded-xl p-5 hover:border-gray-300 hover:shadow-md transition-all duration-200 cursor-pointer group bg-white"
                  onClick={() => handleSelectPainPoint(painPoint)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="text-xs font-semibold text-gray-700 bg-gray-100 px-2.5 py-1.5 rounded-lg uppercase tracking-wide">
                        Stage {painPoint.stage_id}, Step {painPoint.step_id}
                      </div>
                    </div>
                    <div className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold ${getPainLevelColor(painPoint.pain_level)} uppercase tracking-wide`}>
                      {getPainLevelIcon(painPoint.pain_level)}
                      Level: {painPoint.pain_level}/10
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-700 leading-relaxed group-hover:text-gray-900 transition-colors mb-2">
                    {painPoint.description}
                  </p>
                  
                  <div className="mt-3 text-xs text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    Click to select this pain point
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-6 bg-white border-t border-gray-100">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-600 uppercase tracking-wide">
              Select a pain point to populate the Extreme User Generator
            </p>
            <div className="flex items-center gap-3">
              {allPainPoints.length > 0 && (
                <button
                  onClick={() => {
                    const steps = allPainPoints
                      .map((pp) => `Stage ${pp.stage_id}, Step ${pp.step_id}`)
                      .join('; ');
                    const descriptions = allPainPoints
                      .map((pp, i) => `${pp.description}.`)
                      .join('\n');
                    if (onSelectAllPainPoints) {
                      onSelectAllPainPoints({ steps, descriptions, items: allPainPoints });
                    } else if (onSelectPainPoint) {
                      onSelectPainPoint({ step: steps, description: descriptions });
                    }
                    onClose();
                  }}
                  className="rounded-lg bg-black px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-white shadow hover:bg-black/90 transition-colors"
                >
                  Select All
                </button>
              )}
              <button
                onClick={onClose}
                className="rounded-lg border border-gray-200 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-gray-900 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};