import React, { useState, useEffect } from 'react';
import { createEnhancedScoring } from '../../services/assessmentService';
import { useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';

interface EnhancedScoring {
  id?: string;
  problem_id: string;
  market_opportunity_score: number;
  innovation_potential_score: number;
  feasibility_score: number;
  impact_potential_score: number;
  india_context_score: number;
  global_relevance_score: number;
  total_score: number;
  assessment_notes: string;
  created_at?: string;
  updated_at?: string;
}

interface AssessmentFormProps {
  problemId: string;
  mode: 'quantitative' | 'qualitative' | 'hybrid';
}

const defaultScores = {
  market_opportunity_score: 0,
  innovation_potential_score: 0,
  feasibility_score: 0,
  impact_potential_score: 0,
  india_context_score: 0,
  global_relevance_score: 0,
};

export const AssessmentForm: React.FC<AssessmentFormProps> = ({ problemId, mode }) => {
  const [scores, setScores] = useState(defaultScores);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setScores({ ...scores, [e.target.name]: Number(e.target.value) });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    
    // Calculate total score
    const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
    
    const data: EnhancedScoring = {
      problem_id: problemId,
      ...scores,
      total_score: totalScore,
      assessment_notes: `Assessment completed in ${mode} mode`
    };
    
    const { error } = await createEnhancedScoring(data);
    setLoading(false);
    if (error) setMessage('Error saving assessment');
    else setMessage('Assessment saved!');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded bg-white">
      <h2 className="text-lg font-bold">Multi-Modal Assessment ({mode})</h2>
      {Object.keys(defaultScores).map((key) => (
        <div key={key}>
          <label className="block font-medium capitalize">{key.replace(/_/g, ' ')}</label>
          <input
            type="number"
            name={key}
            value={scores[key as keyof typeof defaultScores]}
            onChange={handleChange}
            min={0}
            max={100}
            className="border p-2 rounded w-full"
          />
        </div>
      ))}
      <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded" disabled={loading}>
        {loading ? 'Saving...' : 'Save Assessment'}
      </button>
      {message && <div className="text-green-600 mt-2">{message}</div>}
    </form>
  );
}; 