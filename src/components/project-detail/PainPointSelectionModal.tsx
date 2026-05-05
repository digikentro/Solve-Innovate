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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-md max-w-4xl w-full max-h-[80vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-8 py-6 bg-gradient-to-r from-purple-50 to-pink-50 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-600 rounded-md flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Select Pain Point</h3>
                <p className="text-sm text-gray-600">Choose a pain point from your As-Is Map analysis</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/50 rounded-md transition-colors"
            >
              <FiX className="w-6 h-6 text-gray-500" />
            </button>
          </div>
        </div>



        {/* Content */}
        <div className="p-8 max-h-[50vh] overflow-y-auto">
          {!allPainPoints.length ? (
            <div className="text-center py-12 text-gray-500">
              <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-lg font-medium">No Pain Points Available</p>
              <p className="text-sm mt-2">Please generate an As-Is Map first to see pain points here.</p>
              <p className="text-xs mt-4 bg-blue-50 text-blue-700 p-3 rounded-md">
                💡 <strong>Tip:</strong> Go to the "As-Is Map" section first, generate your map, and then come back here to select from the identified pain points.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {displayPainPoints.map((painPoint, index) => (
                <div
                  key={`${painPoint.stage_id}-${painPoint.step_id}`}
                  className="border border-gray-200 rounded-md p-6 hover:border-purple-300 hover:shadow-lg transition-all duration-200 cursor-pointer group"
                  onClick={() => handleSelectPainPoint(painPoint)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="text-sm font-medium text-gray-600 bg-gray-100 px-3 py-1 rounded-md">
                        Stage {painPoint.stage_id}, Step {painPoint.step_id}
                      </div>
                    </div>
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-md text-sm font-medium ${getPainLevelColor(painPoint.pain_level)}`}>
                      {getPainLevelIcon(painPoint.pain_level)}
                      Pain Level: {painPoint.pain_level}/10
                    </div>
                  </div>
                  
                  <p className="text-gray-700 leading-relaxed group-hover:text-gray-900 transition-colors mb-3">
                    {painPoint.description}
                  </p>
                  
                  <div className="mt-4 text-sm text-purple-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    Click to select this pain point →
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-6 bg-gray-50 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Select a pain point to automatically populate the Extreme User Generator form
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
                  className="px-6 py-2 rounded-md bg-purple-600 text-white text-sm font-semibold shadow hover:bg-purple-700 transition-colors"
                >
                  Select All
                </button>
              )}
              <button
                onClick={onClose}
                className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
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