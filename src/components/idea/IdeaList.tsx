import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ideaService } from '@/services/ideaService';
import { toast } from 'react-hot-toast';
import { FiEdit2, FiTrash2, FiChevronDown, FiChevronRight } from 'react-icons/fi';
import { Idea } from '@/types/idea';

interface IdeaListProps {
  projectId: string;
  limit?: number;
  showHeader?: boolean;
  onIdeaSelect?: (idea: Idea) => void;
}

export const IdeaList = ({
  projectId,
  limit,
  showHeader = true,
  onIdeaSelect,
}: IdeaListProps) => {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedIdea, setExpandedIdea] = useState<string | null>(null);

  useEffect(() => {
    const loadIdeas = async () => {
      try {
        setIsLoading(true);
        const data = await ideaService.getProjectIdeas(projectId);
        setIdeas(limit ? data.slice(0, limit) : data);
      } catch (error) {
        console.error('Error loading ideas:', error);
        toast.error('Failed to load ideas');
      } finally {
        setIsLoading(false);
      }
    };

    if (projectId) {
      loadIdeas();
    }
  }, [projectId, limit]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this idea? This action cannot be undone.')) {
      try {
        await ideaService.deleteIdea(id);
        setIdeas(ideas.filter(idea => idea.id !== id));
        toast.success('Idea deleted successfully');
      } catch (error) {
        console.error('Error deleting idea:', error);
        toast.error('Failed to delete idea');
      }
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedIdea(expandedIdea === id ? null : id);
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { color: string; label: string }> = {
      draft: { color: 'bg-gray-100 text-gray-800', label: 'Draft' },
      refining: { color: 'bg-blue-100 text-blue-800', label: 'Refining' },
      validating: { color: 'bg-yellow-100 text-yellow-800', label: 'Validating' },
      ready: { color: 'bg-green-100 text-green-800', label: 'Ready' },
      archived: { color: 'bg-gray-200 text-gray-800', label: 'Archived' },
    };

    const statusInfo = statusMap[status] || { color: 'bg-gray-100 text-gray-800', label: status };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
        {statusInfo.label}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (ideas.length === 0) {
    return (
      <div className="text-center py-8">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1}
            d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No ideas yet</h3>
        <p className="mt-1 text-sm text-gray-500">
          Get started by creating a new idea.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden">
      {showHeader && (
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Ideas</h3>
        </div>
      )}
      
      <ul className="divide-y divide-gray-200">
        {ideas.map((idea) => (
          <li key={idea.id} className="hover:bg-gray-50">
            <div 
              className="px-4 py-4 sm:px-6 cursor-pointer"
              onClick={() => onIdeaSelect ? onIdeaSelect(idea) : toggleExpand(idea.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleExpand(idea.id);
                    }}
                    className="mr-2 text-gray-500 hover:text-gray-700"
                  >
                    {expandedIdea === idea.id ? (
                      <FiChevronDown className="h-5 w-5" />
                    ) : (
                      <FiChevronRight className="h-5 w-5" />
                    )}
                  </button>
                  <p className="text-sm font-medium text-indigo-600 truncate">
                    {idea.content.split('\n')[0].substring(0, 100)}
                    {idea.content.length > 100 && '...'}
                  </p>
                </div>
                <div className="ml-2 flex-shrink-0 flex space-x-2">
                  {getStatusBadge(idea.status)}
                  <div className="flex space-x-1">
                    <Link
                      to={`/ideas/${idea.id}/edit`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-gray-400 hover:text-indigo-600"
                    >
                      <FiEdit2 className="h-5 w-5" />
                    </Link>
                    <button
                      onClick={(e) => handleDelete(idea.id, e)}
                      className="text-gray-400 hover:text-red-600"
                    >
                      <FiTrash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
              
              {expandedIdea === idea.id && (
                <div className="mt-2 ml-7">
                  <div className="mt-2 text-sm text-gray-600 whitespace-pre-line">
                    {idea.content}
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    Created on {new Date(idea.created_at).toLocaleDateString()}
                  </div>
                  {idea.notes && (
                    <div className="mt-2 p-2 bg-yellow-50 border-l-4 border-yellow-400">
                      <p className="text-sm text-yellow-700">{idea.notes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};
