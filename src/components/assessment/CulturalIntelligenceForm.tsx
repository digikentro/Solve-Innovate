import React, { useState, useEffect } from 'react';
import { createCulturalIntelligence } from '../../services/assessmentService';
import { useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';

interface CulturalIntelligence {
  id?: string;
  problem_id: string;
  cultural_values_analysis: string;
  social_dynamics_assessment: string;
  behavioral_pattern_analysis: string;
  community_context_evaluation: string;
  cultural_adaptation_recommendations: string[];
  regional_variations: string;
  community_engagement_notes: string;
  created_at?: string;
  updated_at?: string;
}

interface CulturalIntelligenceFormProps {
  problemId: string;
}

const defaultData: Partial<CulturalIntelligence> = {
  cultural_values_analysis: '',
  social_dynamics_assessment: '',
  behavioral_pattern_analysis: '',
  community_context_evaluation: '',
  cultural_adaptation_recommendations: [],
  regional_variations: '',
  community_engagement_notes: '',
};

export const CulturalIntelligenceForm: React.FC<CulturalIntelligenceFormProps> = ({ problemId }) => {
  const [data, setData] = useState(defaultData);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setData({ ...data, [e.target.name]: e.target.value });
  };

  const handleRecommendationsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setData({ ...data, cultural_adaptation_recommendations: e.target.value.split(',').map(s => s.trim()) });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const payload: CulturalIntelligence = {
      ...data,
      problem_id: problemId,
    } as CulturalIntelligence;
    const { error } = await createCulturalIntelligence(payload);
    setLoading(false);
    if (error) setMessage('Error saving cultural intelligence');
    else setMessage('Cultural intelligence saved!');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded bg-white mt-4">
      <h2 className="text-lg font-bold">Cultural Intelligence</h2>
      <div>
        <label className="block font-medium">Cultural Values Analysis</label>
        <textarea name="cultural_values_analysis" value={data.cultural_values_analysis as string} onChange={handleChange} className="border p-2 rounded w-full" />
      </div>
      <div>
        <label className="block font-medium">Social Dynamics Assessment</label>
        <textarea name="social_dynamics_assessment" value={data.social_dynamics_assessment as string} onChange={handleChange} className="border p-2 rounded w-full" />
      </div>
      <div>
        <label className="block font-medium">Behavioral Pattern Analysis</label>
        <textarea name="behavioral_pattern_analysis" value={data.behavioral_pattern_analysis as string} onChange={handleChange} className="border p-2 rounded w-full" />
      </div>
      <div>
        <label className="block font-medium">Community Context Evaluation</label>
        <textarea name="community_context_evaluation" value={data.community_context_evaluation as string} onChange={handleChange} className="border p-2 rounded w-full" />
      </div>
      <div>
        <label className="block font-medium">Cultural Adaptation Recommendations (comma separated)</label>
        <input name="cultural_adaptation_recommendations" value={(data.cultural_adaptation_recommendations as string[]).join(', ')} onChange={handleRecommendationsChange} className="border p-2 rounded w-full" />
      </div>
      <div>
        <label className="block font-medium">Regional Variations</label>
        <textarea name="regional_variations" value={data.regional_variations as string} onChange={handleChange} className="border p-2 rounded w-full" />
      </div>
      <div>
        <label className="block font-medium">Community Engagement Notes</label>
        <textarea name="community_engagement_notes" value={data.community_engagement_notes as string} onChange={handleChange} className="border p-2 rounded w-full" />
      </div>
      <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded" disabled={loading}>
        {loading ? 'Saving...' : 'Save Cultural Intelligence'}
      </button>
      {message && <div className="text-green-600 mt-2">{message}</div>}
    </form>
  );
}; 