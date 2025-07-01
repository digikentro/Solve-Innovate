import React, { useState } from 'react';
import { createAssessmentQuality } from '../../services/assessmentService';

interface QualityReviewFormProps {
  problemId: string;
  assessmentId: string;
}

const qualityFlags = [
  'incomplete_data',
  'source_unverified',
  'potential_bias',
  'outdated_information',
  'methodology_concerns',
  'cultural_sensitivity_issues'
];

const improvementRecommendations = [
  'Add more quantitative data',
  'Verify sources',
  'Include cultural context',
  'Update market information',
  'Add stakeholder input',
  'Conduct field research'
];

export const QualityReviewForm: React.FC<QualityReviewFormProps> = ({ 
  problemId, 
  assessmentId 
}) => {
  const [qualityScores, setQualityScores] = useState({
    completeness_score: 0,
    consistency_score: 0,
    source_verification_score: 0,
    bias_detection_score: 0,
    overall_quality_score: 0
  });
  const [selectedFlags, setSelectedFlags] = useState<string[]>([]);
  const [selectedRecommendations, setSelectedRecommendations] = useState<string[]>([]);
  const [validationNotes, setValidationNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleScoreChange = (field: string, value: number) => {
    const updated = { ...qualityScores, [field]: value };
    // Calculate overall quality score as average
    const overall = Object.values(updated).reduce((sum, score) => sum + score, 0) / 4;
    setQualityScores({ ...updated, overall_quality_score: Math.round(overall * 100) / 100 });
  };

  const handleFlagToggle = (flag: string) => {
    setSelectedFlags(prev => 
      prev.includes(flag) 
        ? prev.filter(f => f !== flag)
        : [...prev, flag]
    );
  };

  const handleRecommendationToggle = (rec: string) => {
    setSelectedRecommendations(prev => 
      prev.includes(rec) 
        ? prev.filter(r => r !== rec)
        : [...prev, rec]
    );
  };

  const handleSubmit = async () => {
    setLoading(true);
    setMessage(null);
    
    try {
      await createAssessmentQuality({
        problem_id: problemId,
        assessment_id: assessmentId,
        ...qualityScores,
        quality_flags: selectedFlags,
        improvement_recommendations: selectedRecommendations,
        validation_notes: validationNotes
      });
      setMessage('Quality review saved!');
    } catch (error) {
      setMessage('Error saving quality review');
    }
    setLoading(false);
  };

  return (
    <div className="space-y-4 p-4 border rounded bg-white">
      <h2 className="text-lg font-bold">Quality Review</h2>
      
      {/* Quality Scores */}
      <div className="border p-4 rounded">
        <h3 className="font-medium mb-4">Quality Scores (0-100)</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Completeness Score</label>
            <input
              type="number"
              min="0"
              max="100"
              value={qualityScores.completeness_score}
              onChange={e => handleScoreChange('completeness_score', Number(e.target.value))}
              className="border p-2 rounded w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Consistency Score</label>
            <input
              type="number"
              min="0"
              max="100"
              value={qualityScores.consistency_score}
              onChange={e => handleScoreChange('consistency_score', Number(e.target.value))}
              className="border p-2 rounded w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Source Verification Score</label>
            <input
              type="number"
              min="0"
              max="100"
              value={qualityScores.source_verification_score}
              onChange={e => handleScoreChange('source_verification_score', Number(e.target.value))}
              className="border p-2 rounded w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Bias Detection Score</label>
            <input
              type="number"
              min="0"
              max="100"
              value={qualityScores.bias_detection_score}
              onChange={e => handleScoreChange('bias_detection_score', Number(e.target.value))}
              className="border p-2 rounded w-full"
            />
          </div>
        </div>
        <div className="mt-4 p-3 bg-blue-50 rounded">
          <strong>Overall Quality Score: {qualityScores.overall_quality_score}</strong>
        </div>
      </div>

      {/* Quality Flags */}
      <div className="border p-4 rounded">
        <h3 className="font-medium mb-2">Quality Flags</h3>
        <div className="grid grid-cols-2 gap-2">
          {qualityFlags.map(flag => (
            <label key={flag} className="flex items-center">
              <input
                type="checkbox"
                checked={selectedFlags.includes(flag)}
                onChange={() => handleFlagToggle(flag)}
                className="mr-2"
              />
              {flag.replace(/_/g, ' ')}
            </label>
          ))}
        </div>
      </div>

      {/* Improvement Recommendations */}
      <div className="border p-4 rounded">
        <h3 className="font-medium mb-2">Improvement Recommendations</h3>
        <div className="grid grid-cols-1 gap-2">
          {improvementRecommendations.map(rec => (
            <label key={rec} className="flex items-center">
              <input
                type="checkbox"
                checked={selectedRecommendations.includes(rec)}
                onChange={() => handleRecommendationToggle(rec)}
                className="mr-2"
              />
              {rec}
            </label>
          ))}
        </div>
      </div>

      {/* Validation Notes */}
      <div className="border p-4 rounded">
        <h3 className="font-medium mb-2">Validation Notes</h3>
        <textarea
          value={validationNotes}
          onChange={e => setValidationNotes(e.target.value)}
          className="border p-2 rounded w-full"
          rows={4}
          placeholder="Enter validation notes, concerns, or additional context..."
        />
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={loading}
        className="bg-blue-600 text-white px-6 py-2 rounded"
      >
        {loading ? 'Saving...' : 'Save Quality Review'}
      </button>

      {message && (
        <div className={`mt-2 p-2 rounded ${message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {message}
        </div>
      )}
    </div>
  );
}; 