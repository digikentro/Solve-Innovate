import React, { useState } from 'react';
import { createDynamicIndicator } from '../../services/assessmentService';

interface DynamicIndicator {
  id?: string;
  problem_id: string;
  indicator_type: string;
  indicator_name: string;
  indicator_value: string;
  source: string;
  trend_direction: string;
  momentum_score: number;
  created_at?: string;
  updated_at?: string;
}

interface DynamicIndicatorsFormProps {
  problemId: string;
}

const defaultIndicator: Partial<DynamicIndicator> = {
  indicator_type: '',
  indicator_name: '',
  indicator_value: '',
  source: '',
  trend_direction: '',
  momentum_score: 0,
};

export const DynamicIndicatorsForm: React.FC<DynamicIndicatorsFormProps> = ({ problemId }) => {
  const [indicator, setIndicator] = useState(defaultIndicator);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setIndicator({ ...indicator, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const data: DynamicIndicator = {
      ...indicator,
      problem_id: problemId,
      momentum_score: Number(indicator.momentum_score),
    } as DynamicIndicator;
    const { error } = await createDynamicIndicator(data);
    setLoading(false);
    if (error) setMessage('Error saving indicator');
    else setMessage('Indicator saved!');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded bg-white mt-4">
      <h2 className="text-lg font-bold">Add Dynamic Indicator</h2>
      <div>
        <label className="block font-medium">Type</label>
        <select name="indicator_type" value={indicator.indicator_type} onChange={handleChange} className="border p-2 rounded w-full">
          <option value="">Select type</option>
          <option value="trend">Trend</option>
          <option value="momentum">Momentum</option>
          <option value="market_signal">Market Signal</option>
          <option value="regulatory">Regulatory</option>
        </select>
      </div>
      <div>
        <label className="block font-medium">Name</label>
        <input name="indicator_name" value={indicator.indicator_name} onChange={handleChange} className="border p-2 rounded w-full" />
      </div>
      <div>
        <label className="block font-medium">Value</label>
        <input name="indicator_value" value={indicator.indicator_value as string} onChange={handleChange} className="border p-2 rounded w-full" />
      </div>
      <div>
        <label className="block font-medium">Source</label>
        <input name="source" value={indicator.source} onChange={handleChange} className="border p-2 rounded w-full" />
      </div>
      <div>
        <label className="block font-medium">Trend Direction</label>
        <select name="trend_direction" value={indicator.trend_direction} onChange={handleChange} className="border p-2 rounded w-full">
          <option value="">Select</option>
          <option value="increasing">Increasing</option>
          <option value="decreasing">Decreasing</option>
          <option value="stable">Stable</option>
        </select>
      </div>
      <div>
        <label className="block font-medium">Momentum Score</label>
        <input type="number" name="momentum_score" value={indicator.momentum_score} onChange={handleChange} className="border p-2 rounded w-full" min={-100} max={100} />
      </div>
      <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded" disabled={loading}>
        {loading ? 'Saving...' : 'Save Indicator'}
      </button>
      {message && <div className="text-green-600 mt-2">{message}</div>}
    </form>
  );
}; 