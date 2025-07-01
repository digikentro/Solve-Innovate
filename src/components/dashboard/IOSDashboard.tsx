import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ProjectService } from '@/services/projectService';
import { ErrorHandler, SmartSolveError } from '@/services/errorHandling';
import { FiTrendingUp, FiTrendingDown, FiActivity, FiShield, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';

interface IOSDashboardProps {
  className?: string;
}

export const IOSDashboard: React.FC<IOSDashboardProps> = ({ className = '' }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [projectStats, userProjects] = await Promise.all([
        ProjectService.getProjectStats(user!.id),
        ProjectService.getUserProjects(user!.id)
      ]);

      setStats(projectStats);
      setProjects(userProjects);
    } catch (err) {
      const smartSolveError = err instanceof SmartSolveError ? err : new SmartSolveError(
        'Failed to load dashboard data',
        { operation: 'load_dashboard_data', userId: user?.id, timestamp: new Date().toISOString() },
        false,
        'Unable to load dashboard. Please refresh the page.'
      );
      
      setError(smartSolveError.userMessage);
      ErrorHandler.logError(smartSolveError);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 70) return 'bg-green-100';
    if (score >= 50) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-200 h-32 rounded-lg"></div>
          ))}
        </div>
        <div className="bg-gray-200 h-96 rounded-lg"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-6 ${className}`}>
        <div className="flex items-center">
          <FiAlertCircle className="text-red-500 mr-3" size={24} />
          <div>
            <h3 className="text-red-800 font-medium">Error Loading Dashboard</h3>
            <p className="text-red-600 mt-1">{error}</p>
            <button
              onClick={loadDashboardData}
              className="mt-3 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">IOS Dashboard</h1>
        <button
          onClick={loadDashboardData}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FiActivity className="text-blue-600" size={20} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Projects</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.total || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <FiTrendingUp className="text-green-600" size={20} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Recent Projects</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.recentCount || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <FiShield className="text-purple-600" size={20} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Draft Projects</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.byStatus?.draft || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <FiCheckCircle className="text-yellow-600" size={20} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Projects</p>
              <p className="text-2xl font-bold text-gray-900">{(stats?.byStatus?.ready || 0) + (stats?.byStatus?.validating || 0)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Projects */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Projects</h3>
        <div className="space-y-4">
          {projects.slice(0, 5).map((project, index) => (
            <div key={project.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                  index === 0 ? 'bg-yellow-500' : 
                  index === 1 ? 'bg-gray-400' : 
                  index === 2 ? 'bg-orange-500' : 'bg-gray-300'
                }`}>
                  {index + 1}
                </div>
                <div className="ml-4">
                  <h4 className="font-medium text-gray-900">{project.title}</h4>
                  <p className="text-sm text-gray-600">{project.status}</p>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-lg font-bold ${getScoreColor(project.opportunityScore || 0)}`}>
                  {project.opportunityScore || 'N/A'}
                </div>
                <div className="text-xs text-gray-500">
                  {project.opportunityScore >= 70 ? 'High Opportunity' :
                   project.opportunityScore >= 50 ? 'Moderate Opportunity' :
                   'Limited Opportunity'}
                </div>
              </div>
            </div>
          ))}
          {projects.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No projects yet. Create your first project to get started!</p>
            </div>
          )}
        </div>
      </div>

      {/* Status Distribution */}
      {stats && Object.keys(stats.byStatus).length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Distribution by Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(stats.byStatus).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-medium text-gray-900 capitalize">
                  {status.replace('_', ' ')}
                </span>
                <span className="text-lg font-bold text-blue-600">{count as number}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}; 