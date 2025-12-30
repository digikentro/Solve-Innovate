import { useEffect, useState } from 'react';
import { FiSearch, FiMoreVertical, FiUser, FiMail, FiCalendar, FiFolder, FiSlash, FiCheckCircle, FiFilter } from 'react-icons/fi';
import { AdminService, AdminUser } from '@/services/adminService';
import toast from 'react-hot-toast';

export function AdminUsersPage() {
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'banned'>('all');
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const data = await AdminService.getAllUsers();
                // Sort by created_at descending (latest first)
                const sortedData = [...data].sort((a, b) =>
                    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                );
                setUsers(sortedData);
            } catch (error) {
                console.error('Error fetching users:', error);
                toast.error('Failed to load users');
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, []);

    const filteredUsers = users.filter(user => {
        const matchesSearch =
            user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.username?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus =
            statusFilter === 'all' ||
            (statusFilter === 'active' && user.status === 'active') ||
            (statusFilter === 'banned' && user.status === 'banned');

        return matchesSearch && matchesStatus;
    });

    const handleBanUser = async (userId: string) => {
        try {
            await AdminService.banUser(userId);
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: 'banned' as const } : u));
            toast.success('User banned successfully');
        } catch (error) {
            toast.error('Failed to ban user');
        }
        setActiveDropdown(null);
    };

    const handleUnbanUser = async (userId: string) => {
        try {
            await AdminService.unbanUser(userId);
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: 'active' as const } : u));
            toast.success('User unbanned successfully');
        } catch (error) {
            toast.error('Failed to unban user');
        }
        setActiveDropdown(null);
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'Never';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
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
                    <h1 className="text-2xl font-semibold text-gray-900">Users</h1>
                    <p className="mt-1 text-sm text-gray-600">Manage all registered users on the platform</p>
                </div>
                <div className="mt-4 sm:mt-0 flex items-center gap-2 px-3 py-2 bg-indigo-50 rounded-lg border border-indigo-200">
                    <FiUser className="w-4 h-4 text-indigo-600" />
                    <span className="text-sm font-medium text-indigo-700">{users.length} Total Users</span>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="flex flex-col sm:flex-row gap-4">
                {/* Search */}
                <div className="relative flex-1">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by name, email, or username..."
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
                        onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'banned')}
                        className="px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="banned">Banned</option>
                    </select>
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr className="border-b border-gray-200">
                                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Institution</th>
                                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Last Active</th>
                                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Projects</th>
                                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {filteredUsers.map((user) => (
                                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                    {/* User Info */}
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                                                <span className="text-sm font-semibold text-indigo-600">
                                                    {user.full_name?.split(' ').map(n => n[0]).join('') || user.email[0].toUpperCase()}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">{user.full_name || 'No Name'}</p>
                                                <div className="flex items-center gap-1">
                                                    <FiMail className="w-3 h-3 text-gray-400" />
                                                    <p className="text-xs text-gray-500">{user.email}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Institution */}
                                    <td className="px-6 py-4">
                                        <span className="text-sm text-gray-700">{user.institution || '—'}</span>
                                    </td>

                                    {/* Joined */}
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1">
                                            <FiCalendar className="w-3 h-3 text-gray-400" />
                                            <span className="text-sm text-gray-700">{formatDate(user.created_at)}</span>
                                        </div>
                                    </td>

                                    {/* Last Active */}
                                    <td className="px-6 py-4">
                                        <span className="text-sm text-gray-700">{formatDate(user.last_sign_in_at)}</span>
                                    </td>

                                    {/* Projects */}
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1">
                                            <FiFolder className="w-4 h-4 text-indigo-500" />
                                            <span className="text-sm font-medium text-gray-900">{user.project_count}</span>
                                        </div>
                                    </td>

                                    {/* Status */}
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${user.status === 'active'
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-red-100 text-red-700'
                                            }`}>
                                            {user.status === 'active' ? <FiCheckCircle className="w-3 h-3" /> : <FiSlash className="w-3 h-3" />}
                                            {user.status === 'active' ? 'Active' : 'Banned'}
                                        </span>
                                    </td>

                                    {/* Actions */}
                                    <td className="px-6 py-4 text-right">
                                        <div className="relative inline-block">
                                            <button
                                                onClick={() => setActiveDropdown(activeDropdown === user.id ? null : user.id)}
                                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                            >
                                                <FiMoreVertical className="w-5 h-5 text-gray-400" />
                                            </button>

                                            {activeDropdown === user.id && (
                                                <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10 overflow-hidden">
                                                    <button
                                                        onClick={() => toast.success(`Viewing ${user.full_name || user.email}`)}
                                                        className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                                                    >
                                                        <FiUser className="w-4 h-4" />
                                                        View Profile
                                                    </button>
                                                    {user.status === 'active' ? (
                                                        <button
                                                            onClick={() => handleBanUser(user.id)}
                                                            className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                                                        >
                                                            <FiSlash className="w-4 h-4" />
                                                            Ban User
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleUnbanUser(user.id)}
                                                            className="w-full px-4 py-2.5 text-left text-sm text-green-600 hover:bg-green-50 transition-colors flex items-center gap-2"
                                                        >
                                                            <FiCheckCircle className="w-4 h-4" />
                                                            Unban User
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Empty State */}
                {filteredUsers.length === 0 && (
                    <div className="text-center py-12">
                        <FiUser className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">No users found</p>
                    </div>
                )}
            </div>
        </div>
    );
}
