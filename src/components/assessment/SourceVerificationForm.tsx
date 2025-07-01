import React, { useState } from 'react';

interface Source {
  id: string;
  title: string;
  url: string;
  source_type: 'government' | 'academic' | 'industry' | 'media' | 'social';
  tier: 1 | 2 | 3 | 4 | 5;
  bias_score: number;
  verification_status: 'verified' | 'pending' | 'flagged';
  notes: string;
}

interface SourceVerificationFormProps {
  problemId: string;
  assessmentId: string;
}

const sourceTypes = [
  { value: 'government', label: 'Government/Regulatory', tier: 1 },
  { value: 'academic', label: 'Academic/Peer-Reviewed', tier: 1 },
  { value: 'industry', label: 'Industry Report', tier: 2 },
  { value: 'media', label: 'Media/News', tier: 3 },
  { value: 'social', label: 'Social Media/Forum', tier: 5 }
];

const tierDescriptions = {
  1: 'Highest reliability - Government sources, peer-reviewed research',
  2: 'High reliability - Industry reports, established organizations',
  3: 'Medium reliability - News media, company announcements',
  4: 'Low reliability - Blogs, unverified reports',
  5: 'Lowest reliability - Social media, anonymous sources'
};

export const SourceVerificationForm: React.FC<SourceVerificationFormProps> = ({
  problemId,
  assessmentId
}) => {
  const [sources, setSources] = useState<Source[]>([]);
  const [newSource, setNewSource] = useState<Partial<Source>>({
    source_type: 'industry',
    tier: 2,
    bias_score: 50,
    verification_status: 'pending'
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleAddSource = () => {
    if (!newSource.title || !newSource.url) {
      setMessage('Please provide source title and URL');
      return;
    }

    const source: Source = {
      id: Date.now().toString(),
      title: newSource.title!,
      url: newSource.url!,
      source_type: newSource.source_type!,
      tier: newSource.tier!,
      bias_score: newSource.bias_score!,
      verification_status: newSource.verification_status!,
      notes: newSource.notes || ''
    };

    setSources([...sources, source]);
    setNewSource({
      source_type: 'industry',
      tier: 2,
      bias_score: 50,
      verification_status: 'pending'
    });
    setMessage('Source added successfully');
  };

  const handleTierChange = (tier: number) => {
    setNewSource({ ...newSource, tier: tier as any });
  };

  const handleSourceTypeChange = (type: string) => {
    const sourceType = sourceTypes.find(st => st.value === type);
    if (sourceType) {
      setNewSource({ 
        ...newSource, 
        source_type: type as any,
        tier: sourceType.tier as any
      });
    }
  };

  const getTierColor = (tier: number) => {
    switch (tier) {
      case 1: return 'bg-green-100 text-green-800';
      case 2: return 'bg-blue-100 text-blue-800';
      case 3: return 'bg-yellow-100 text-yellow-800';
      case 4: return 'bg-orange-100 text-orange-800';
      case 5: return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getBiasColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const calculateOverallVerificationScore = () => {
    if (sources.length === 0) return 0;
    
    const tierWeights = { 1: 1.0, 2: 0.8, 3: 0.6, 4: 0.4, 5: 0.2 };
    const totalScore = sources.reduce((sum, source) => {
      const tierWeight = tierWeights[source.tier as keyof typeof tierWeights];
      const biasWeight = source.bias_score / 100;
      return sum + (tierWeight * biasWeight);
    }, 0);
    
    return Math.round((totalScore / sources.length) * 100);
  };

  return (
    <div className="space-y-4 p-4 border rounded bg-white">
      <h2 className="text-lg font-bold">Source Verification & Bias Detection</h2>
      
      {/* Add New Source */}
      <div className="border p-4 rounded">
        <h3 className="font-medium mb-3">Add Source</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Source Title</label>
            <input
              type="text"
              value={newSource.title || ''}
              onChange={e => setNewSource({...newSource, title: e.target.value})}
              className="border p-2 rounded w-full"
              placeholder="Source title"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">URL</label>
            <input
              type="url"
              value={newSource.url || ''}
              onChange={e => setNewSource({...newSource, url: e.target.value})}
              className="border p-2 rounded w-full"
              placeholder="https://..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Source Type</label>
            <select
              value={newSource.source_type}
              onChange={e => handleSourceTypeChange(e.target.value)}
              className="border p-2 rounded w-full"
            >
              {sourceTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">Tier (Auto-assigned)</label>
            <div className="border p-2 rounded bg-gray-50">
              <span className={`px-2 py-1 rounded text-sm font-medium ${getTierColor(newSource.tier || 2)}`}>
                Tier {newSource.tier}
              </span>
              <p className="text-xs text-gray-600 mt-1">{tierDescriptions[newSource.tier as keyof typeof tierDescriptions]}</p>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium">Bias Score (0-100)</label>
            <input
              type="range"
              min="0"
              max="100"
              value={newSource.bias_score}
              onChange={e => setNewSource({...newSource, bias_score: Number(e.target.value)})}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-600">
              <span>High Bias</span>
              <span className={getBiasColor(newSource.bias_score || 50)}>{newSource.bias_score}%</span>
              <span>Low Bias</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium">Verification Status</label>
            <select
              value={newSource.verification_status}
              onChange={e => setNewSource({...newSource, verification_status: e.target.value as any})}
              className="border p-2 rounded w-full"
            >
              <option value="pending">Pending</option>
              <option value="verified">Verified</option>
              <option value="flagged">Flagged</option>
            </select>
          </div>
        </div>
        
        <div className="mt-4">
          <label className="block text-sm font-medium">Notes</label>
          <textarea
            value={newSource.notes}
            onChange={e => setNewSource({...newSource, notes: e.target.value})}
            className="border p-2 rounded w-full"
            rows={2}
            placeholder="Additional notes about this source..."
          />
        </div>
        
        <button
          onClick={handleAddSource}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded"
        >
          Add Source
        </button>
      </div>

      {/* Sources List */}
      {sources.length > 0 && (
        <div>
          <h3 className="font-medium mb-3">Verified Sources ({sources.length})</h3>
          <div className="space-y-3">
            {sources.map((source) => (
              <div key={source.id} className="border p-3 rounded">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getTierColor(source.tier)}`}>
                        Tier {source.tier}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getBiasColor(source.bias_score)}`}>
                        Bias: {source.bias_score}%
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        source.verification_status === 'verified' ? 'bg-green-100 text-green-800' :
                        source.verification_status === 'flagged' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {source.verification_status}
                      </span>
                    </div>
                    <h4 className="font-medium">{source.title}</h4>
                    <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-sm hover:underline">
                      {source.url}
                    </a>
                    {source.notes && (
                      <p className="text-sm text-gray-600 mt-1">{source.notes}</p>
                    )}
                  </div>
                  <button
                    onClick={() => setSources(sources.filter(s => s.id !== source.id))}
                    className="text-red-600 text-sm"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          {/* Overall Score */}
          <div className="mt-4 p-3 bg-blue-50 rounded">
            <div className="flex justify-between items-center">
              <span className="font-medium">Overall Verification Score:</span>
              <span className="text-2xl font-bold text-blue-600">
                {calculateOverallVerificationScore()}%
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Based on {sources.length} sources with tier weighting and bias adjustment
            </p>
          </div>
        </div>
      )}

      {message && (
        <div className={`mt-2 p-2 rounded ${message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {message}
        </div>
      )}
    </div>
  );
}; 