import { useEffect, useState } from 'react';
import { FiSearch, FiMoreVertical, FiFolder, FiUser, FiCalendar, FiTrash2, FiEye, FiFilter, FiClock } from 'react-icons/fi';
import { AdminService, AdminProject } from '@/services/adminService';
import toast from 'react-hot-toast';

export function AdminProjectsPage() {
    const [projects, setProjects] = useState<AdminProject[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'draft'>('all');
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const data = await AdminService.getAllProjects();
                // Sort by created_at descending (latest first)
                const sortedData = [...data].sort((a, b) =>
                    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                );
                setProjects(sortedData);
            } catch (error) {
                console.error('Error fetching projects:', error);
                toast.error('Failed to load projects');
            } finally {
                setLoading(false);
            }
        };
        fetchProjects();
    }, []);

    const filteredProjects = projects.filter(project => {
        const matchesSearch =
            project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            project.owner_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            project.owner_name?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus =
            statusFilter === 'all' ||
            project.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const handleDeleteProject = async (projectId: string) => {
        try {
            await AdminService.deleteProject(projectId);
            setProjects(prev => prev.filter(p => p.id !== projectId));
            toast.success('Project deleted successfully');
        } catch (error) {
            toast.error('Failed to delete project');
        }
        setDeleteConfirm(null);
        setActiveDropdown(null);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active':
                return 'bg-green-100 text-green-700';
            case 'draft':
                return 'bg-amber-100 text-amber-700';
            default:
                return 'bg-gray-100 text-gray-700';
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="sm:flex sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Projects</h1>
                    <p className="mt-1 text-sm text-gray-600">View and manage all projects on the platform</p>
                </div>
                <div className="mt-4 sm:mt-0 flex items-center gap-2 px-3 py-2 bg-indigo-50 rounded-lg border border-indigo-200">
                    <FiFolder className="w-4 h-4 text-indigo-600" />
                    <span className="text-sm font-medium text-indigo-700">{projects.length} Total Projects</span>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="flex flex-col sm:flex-row gap-4">
                {/* Search */}
                <div className="relative flex-1">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by title or owner..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    />
                </div>

                {/* Status Filter */}
                <div className="flex items-center gap-2">
                    <FiFilter className="w-5 h-5 text-gray-400" />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'draft')}
                        className="px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="draft">Draft</option>
                    </select>
                </div>
            </div>

            {/* Projects Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProjects.map((project) => (
                    <div
                        key={project.id}
                        className="relative bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6 flex flex-col h-full border border-gray-200"
                    >
                        {/* Header */}
                        <div className="flex items-start justify-between gap-2 mb-3">
                            <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
                                {project.title}
                            </h3>
                            <div className="relative">
                                <button
                                    onClick={() => setActiveDropdown(activeDropdown === project.id ? null : project.id)}
                                    className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <FiMoreVertical className="w-4 h-4 text-gray-400" />
                                </button>

                                {activeDropdown === project.id && (
                                    <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-10 overflow-hidden">
                                        <button
                                            onClick={() => {
                                                toast.success(`Viewing: ${project.title}`);
                                                setActiveDropdown(null);
                                            }}
                                            className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                                        >
                                            <FiEye className="w-4 h-4" />
                                            View Details
                                        </button>
                                        <button
                                            onClick={() => setDeleteConfirm(project.id)}
                                            className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                                        >
                                            <FiTrash2 className="w-4 h-4" />
                                            Delete
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Description */}
                        <p className="text-gray-600 text-sm mb-4 line-clamp-2 flex-1">
                            {project.description || 'No description provided'}
                        </p>

                        {/* Owner */}
                        <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-100">
                            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                                <span className="text-xs font-semibold text-indigo-600">
                                    {project.owner_name?.split(' ').map(n => n[0]).join('') || project.owner_email[0].toUpperCase()}
                                </span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">{project.owner_name || 'Unknown'}</p>
                                <p className="text-xs text-gray-500 truncate">{project.owner_email}</p>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                                <FiCalendar className="w-3 h-3" />
                                <span>{formatDate(project.created_at)}</span>
                            </div>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                                {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Empty State */}
            {filteredProjects.length === 0 && (
                <div className="text-center py-12 bg-white rounded-lg shadow border border-gray-200">
                    <FiFolder className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No projects found</p>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FiTrash2 className="w-8 h-8 text-red-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Project?</h3>
                            <p className="text-sm text-gray-600 mb-6">
                                This action cannot be undone. All project data will be permanently removed.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setDeleteConfirm(null)}
                                    className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleDeleteProject(deleteConfirm)}
                                    className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
