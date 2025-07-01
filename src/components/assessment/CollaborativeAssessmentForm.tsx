import React, { useState } from 'react';
import { createCollaborativeAssessment } from '../../services/assessmentService';

interface Collaborator {
  collaborator_id: string;
  collaborator_role: 'expert' | 'stakeholder' | 'community_member';
  collaboration_type: 'review' | 'validation' | 'input';
  contributed_dimensions: string[];
  contribution_notes: string;
  contribution_score: number;
}

interface CollaborativeAssessmentFormProps {
  problemId: string;
  assessmentId: string;
}

const dimensions = [
  'market_opportunity',
  'innovation_potential', 
  'feasibility',
  'impact_potential',
  'india_context',
  'global_relevance'
];

export const CollaborativeAssessmentForm: React.FC<CollaborativeAssessmentFormProps> = ({ 
  problemId, 
  assessmentId 
}) => {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [newCollaborator, setNewCollaborator] = useState<Partial<Collaborator>>({
    collaborator_role: 'expert',
    collaboration_type: 'review',
    contributed_dimensions: [],
    contribution_notes: '',
    contribution_score: 0
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleDimensionToggle = (dimension: string) => {
    const current = newCollaborator.contributed_dimensions || [];
    const updated = current.includes(dimension)
      ? current.filter(d => d !== dimension)
      : [...current, dimension];
    setNewCollaborator({ ...newCollaborator, contributed_dimensions: updated });
  };

  const handleAddCollaborator = () => {
    if (!newCollaborator.collaborator_id) {
      setMessage('Please enter collaborator ID');
      return;
    }
    setCollaborators([...collaborators, newCollaborator as Collaborator]);
    setNewCollaborator({
      collaborator_role: 'expert',
      collaboration_type: 'review',
      contributed_dimensions: [],
      contribution_notes: '',
      contribution_score: 0
    });
  };

  const handleSubmit = async () => {
    setLoading(true);
    setMessage(null);
    
    try {
      for (const collaborator of collaborators) {
        await createCollaborativeAssessment({
          problem_id: problemId,
          assessment_id: assessmentId,
          ...collaborator
        });
      }
      setMessage('Collaborative assessment saved!');
      setCollaborators([]);
    } catch (error) {
      setMessage('Error saving collaborative assessment');
    }
    setLoading(false);
  };

  return (
    <div className="space-y-4 p-4 border rounded bg-white">
      <h2 className="text-lg font-bold">Collaborative Assessment</h2>
      
      {/* Add New Collaborator */}
      <div className="border p-4 rounded">
        <h3 className="font-medium mb-2">Add Collaborator</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Collaborator ID</label>
            <input
              type="text"
              value={newCollaborator.collaborator_id || ''}
              onChange={e => setNewCollaborator({...newCollaborator, collaborator_id: e.target.value})}
              className="border p-2 rounded w-full"
              placeholder="User ID"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Role</label>
            <select
              value={newCollaborator.collaborator_role}
              onChange={e => setNewCollaborator({...newCollaborator, collaborator_role: e.target.value as any})}
              className="border p-2 rounded w-full"
            >
              <option value="expert">Expert</option>
              <option value="stakeholder">Stakeholder</option>
              <option value="community_member">Community Member</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">Collaboration Type</label>
            <select
              value={newCollaborator.collaboration_type}
              onChange={e => setNewCollaborator({...newCollaborator, collaboration_type: e.target.value as any})}
              className="border p-2 rounded w-full"
            >
              <option value="review">Review</option>
              <option value="validation">Validation</option>
              <option value="input">Input</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">Contribution Score</label>
            <input
              type="number"
              min="0"
              max="100"
              value={newCollaborator.contribution_score}
              onChange={e => setNewCollaborator({...newCollaborator, contribution_score: Number(e.target.value)})}
              className="border p-2 rounded w-full"
            />
          </div>
        </div>
        
        <div className="mt-4">
          <label className="block text-sm font-medium mb-2">Contributed Dimensions</label>
          <div className="grid grid-cols-3 gap-2">
            {dimensions.map(dimension => (
              <label key={dimension} className="flex items-center">
                <input
                  type="checkbox"
                  checked={newCollaborator.contributed_dimensions?.includes(dimension) || false}
                  onChange={() => handleDimensionToggle(dimension)}
                  className="mr-2"
                />
                {dimension.replace('_', ' ')}
              </label>
            ))}
          </div>
        </div>
        
        <div className="mt-4">
          <label className="block text-sm font-medium">Contribution Notes</label>
          <textarea
            value={newCollaborator.contribution_notes}
            onChange={e => setNewCollaborator({...newCollaborator, contribution_notes: e.target.value})}
            className="border p-2 rounded w-full"
            rows={3}
          />
        </div>
        
        <button
          onClick={handleAddCollaborator}
          className="mt-4 bg-green-600 text-white px-4 py-2 rounded"
        >
          Add Collaborator
        </button>
      </div>

      {/* Collaborators List */}
      {collaborators.length > 0 && (
        <div>
          <h3 className="font-medium mb-2">Collaborators ({collaborators.length})</h3>
          <div className="space-y-2">
            {collaborators.map((collaborator, index) => (
              <div key={index} className="border p-3 rounded bg-gray-50">
                <div className="flex justify-between items-start">
                  <div>
                    <p><strong>ID:</strong> {collaborator.collaborator_id}</p>
                    <p><strong>Role:</strong> {collaborator.collaborator_role}</p>
                    <p><strong>Type:</strong> {collaborator.collaboration_type}</p>
                    <p><strong>Score:</strong> {collaborator.contribution_score}</p>
                    <p><strong>Dimensions:</strong> {collaborator.contributed_dimensions.join(', ')}</p>
                  </div>
                  <button
                    onClick={() => setCollaborators(collaborators.filter((_, i) => i !== index))}
                    className="text-red-600 text-sm"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Submit */}
      {collaborators.length > 0 && (
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-2 rounded"
        >
          {loading ? 'Saving...' : 'Save Collaborative Assessment'}
        </button>
      )}

      {message && (
        <div className={`mt-2 p-2 rounded ${message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {message}
        </div>
      )}
    </div>
  );
}; 