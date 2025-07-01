import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

interface AssessmentHistoryProps {
  problemId: string;
}

interface HistoryEntry {
  id: string;
  version_number: number;
  change_type: string;
  change_reason: string;
  previous_scores: any;
  previous_metadata: any;
  changed_by: string;
  change_date: string;
}

export const AssessmentHistory: React.FC<AssessmentHistoryProps> = ({ problemId }) => {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchHistory();
  }, [problemId]);

  const fetchHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('assessment_history')
        .select('*')
        .eq('problem_id', problemId)
        .order('version_number', { ascending: false });

      if (error) throw error;
      setHistory(data || []);
    } catch (err) {
      setError('Failed to load assessment history');
      console.error('Error fetching history:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getChangeTypeColor = (changeType: string) => {
    switch (changeType) {
      case 'initial': return 'bg-green-100 text-green-800';
      case 'update': return 'bg-blue-100 text-blue-800';
      case 'revision': return 'bg-yellow-100 text-yellow-800';
      case 'correction': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 p-4 border rounded bg-white">
        <h2 className="text-lg font-bold">Assessment History</h2>
        <div className="text-center py-8">Loading history...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4 p-4 border rounded bg-white">
        <h2 className="text-lg font-bold">Assessment History</h2>
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="space-y-4 p-4 border rounded bg-white">
        <h2 className="text-lg font-bold">Assessment History</h2>
        <div className="text-gray-500 text-center py-8">No assessment history found</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 border rounded bg-white">
      <h2 className="text-lg font-bold">Assessment History</h2>
      
      <div className="space-y-4">
        {history.map((entry) => (
          <div key={entry.id} className="border rounded p-4">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center space-x-3">
                <span className="font-bold text-lg">v{entry.version_number}</span>
                <span className={`px-2 py-1 rounded text-sm font-medium ${getChangeTypeColor(entry.change_type)}`}>
                  {entry.change_type}
                </span>
              </div>
              <div className="text-sm text-gray-500">
                {formatDate(entry.change_date)}
              </div>
            </div>
            
            <div className="mb-3">
              <strong>Change Reason:</strong>
              <p className="text-gray-700 mt-1">{entry.change_reason || 'No reason provided'}</p>
            </div>
            
            <div className="mb-3">
              <strong>Changed By:</strong>
              <p className="text-gray-700 mt-1">{entry.changed_by || 'Unknown'}</p>
            </div>
            
            {entry.previous_scores && (
              <div className="mb-3">
                <strong>Previous Scores:</strong>
                <div className="mt-1 p-2 bg-gray-50 rounded text-sm">
                  <pre className="whitespace-pre-wrap">{JSON.stringify(entry.previous_scores, null, 2)}</pre>
                </div>
              </div>
            )}
            
            {entry.previous_metadata && (
              <div>
                <strong>Previous Metadata:</strong>
                <div className="mt-1 p-2 bg-gray-50 rounded text-sm">
                  <pre className="whitespace-pre-wrap">{JSON.stringify(entry.previous_metadata, null, 2)}</pre>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}; 