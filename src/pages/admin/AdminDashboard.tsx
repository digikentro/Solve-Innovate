import { useEffect, useState } from 'react';
import { FiUsers, FiFolder, FiActivity, FiTrendingUp, FiArrowUpRight, FiArrowDownRight, FiClock } from 'react-icons/fi';
import { AdminService, SystemStats } from '@/services/adminService';

export function AdminDashboard() {
    const [stats, setStats] = useState<SystemStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await AdminService.getSystemStats();
                setStats(data);
            } catch (error) {
                console.error('Error fetching stats:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    const statCards = [
        {
            title: 'Total Users',
            value: stats?.totalUsers || 0,
            change: '+12%',
            isPositive: true,
            icon: FiUsers,
            iconBg: 'bg-blue-100',
            iconColor: 'text-blue-600',
        },
        {
            title: 'Total Projects',
            value: stats?.totalProjects || 0,
            change: '+8%',
            isPositive: true,
            icon: FiFolder,
            iconBg: 'bg-indigo-100',
            iconColor: 'text-indigo-600',
        },
        {
            title: 'Active Today',
            value: stats?.activeUsersToday || 0,
            change: '-3%',
            isPositive: false,
            icon: FiActivity,
            iconBg: 'bg-green-100',
            iconColor: 'text-green-600',
        },
        {
            title: 'Projects This Week',
            value: stats?.projectsThisWeek || 0,
            change: '+24%',
            isPositive: true,
            icon: FiTrendingUp,
            iconBg: 'bg-amber-100',
            iconColor: 'text-amber-600',
        },
    ];

    const recentActivities = [
        { user: 'John Doe', action: 'created a new project', time: '2 minutes ago', type: 'project' },
        { user: 'Jane Smith', action: 'signed up', time: '15 minutes ago', type: 'signup' },
        { user: 'Alex Kumar', action: 'generated Extreme Users', time: '32 minutes ago', type: 'ai' },
        { user: 'Sarah Wilson', action: 'published project slides', time: '1 hour ago', type: 'publish' },
        { user: 'Mike Chen', action: 'updated their profile', time: '2 hours ago', type: 'profile' },
    ];

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
                <p className="mt-1 text-sm text-gray-600">Overview of your platform's performance and activity</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {statCards.map((card, index) => (
                    <div
                        key={index}
                        className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6 border border-gray-200"
                    >
                        <div className="flex items-start justify-between">
                            <div className={`w-12 h-12 ${card.iconBg} rounded-lg flex items-center justify-center`}>
                                <card.icon className={`w-6 h-6 ${card.iconColor}`} />
                            </div>
                            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${card.isPositive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                                }`}>
                                {card.isPositive ? <FiArrowUpRight className="w-3 h-3" /> : <FiArrowDownRight className="w-3 h-3" />}
                                {card.change}
                            </div>
                        </div>
                        <p className="mt-4 text-sm text-gray-600">{card.title}</p>
                        <p className="text-2xl font-bold text-gray-900">{card.value.toLocaleString()}</p>
                    </div>
                ))}
            </div>

            {/* Charts & Activity */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Signup Trends Chart */}
                <div className="xl:col-span-2 bg-white rounded-lg shadow border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6">Signup Trends</h3>
                    <div className="h-64 flex items-end justify-between gap-3">
                        {stats?.recentSignups.map((day, index) => {
                            const maxCount = Math.max(...(stats?.recentSignups.map(d => d.count) || [1]));
                            const height = (day.count / maxCount) * 100;
                            return (
                                <div key={index} className="flex-1 flex flex-col items-center gap-2">
                                    <div className="w-full bg-gray-100 rounded-lg overflow-hidden" style={{ height: '200px' }}>
                                        <div
                                            className="w-full bg-indigo-500 hover:bg-indigo-600 rounded-lg transition-colors"
                                            style={{ height: `${height}%`, marginTop: `${100 - height}%` }}
                                        ></div>
                                    </div>
                                    <span className="text-xs text-gray-500">
                                        {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6">Recent Activity</h3>
                    <div className="space-y-4">
                        {recentActivities.map((activity, index) => (
                            <div key={index} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                                    <span className="text-sm font-semibold text-indigo-600">
                                        {activity.user.split(' ').map(n => n[0]).join('')}
                                    </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-gray-900">
                                        <span className="font-medium">{activity.user}</span>{' '}
                                        <span className="text-gray-600">{activity.action}</span>
                                    </p>
                                    <div className="flex items-center gap-1 mt-1">
                                        <FiClock className="w-3 h-3 text-gray-400" />
                                        <span className="text-xs text-gray-500">{activity.time}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Quick Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">User Status</h3>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Active Users</span>
                            <span className="text-sm font-medium text-green-600">122</span>
                        </div>
                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-green-500 rounded-full" style={{ width: '96%' }}></div>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Banned Users</span>
                            <span className="text-sm font-medium text-red-600">5</span>
                        </div>
                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-red-500 rounded-full" style={{ width: '4%' }}></div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Status</h3>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Active Projects</span>
                            <span className="text-sm font-medium text-blue-600">287</span>
                        </div>
                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full" style={{ width: '84%' }}></div>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Draft Projects</span>
                            <span className="text-sm font-medium text-amber-600">55</span>
                        </div>
                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-500 rounded-full" style={{ width: '16%' }}></div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Institutions</h3>
                    <div className="space-y-3">
                        {['Stanford University', 'MIT', 'IIT Delhi', 'Harvard'].map((inst, index) => (
                            <div key={index} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors">
                                <span className="text-sm text-gray-700">{inst}</span>
                                <span className="text-xs text-gray-500">{Math.floor(Math.random() * 20 + 5)} users</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
