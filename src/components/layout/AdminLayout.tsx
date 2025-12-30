import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { FiHome, FiUsers, FiFolder, FiSettings, FiArrowLeft, FiShield, FiLogOut } from 'react-icons/fi';
import { useAuth } from '@/contexts/AuthContext';

const navItems = [
    { path: '/admin', icon: FiHome, label: 'Dashboard', end: true },
    { path: '/admin/users', icon: FiUsers, label: 'Users', end: false },
    { path: '/admin/projects', icon: FiFolder, label: 'Projects', end: false },
    { path: '/admin/settings', icon: FiSettings, label: 'Settings', end: false },
];

export function AdminLayout() {
    const { signOut } = useAuth();
    const navigate = useNavigate();

    const handleBackToApp = () => {
        navigate('/projects');
    };

    const handleLogout = async () => {
        await signOut();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Sidebar */}
            <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 flex flex-col z-50 shadow-sm">
                {/* Logo Area */}
                <div className="p-5 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                            <FiShield className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-gray-900">Admin Panel</h1>
                            <p className="text-xs text-gray-500">Solve Innovate</p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-1">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.end}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-sm font-medium ${isActive
                                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                }`
                            }
                        >
                            <item.icon className="w-5 h-5" />
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                {/* Bottom Actions */}
                <div className="p-4 border-t border-gray-200 space-y-1">
                    <button
                        onClick={handleBackToApp}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all"
                    >
                        <FiArrowLeft className="w-5 h-5" />
                        <span>Back to App</span>
                    </button>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-all"
                    >
                        <FiLogOut className="w-5 h-5" />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="ml-64 min-h-screen">
                {/* Top Bar */}
                <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-sm border-b border-gray-200 px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Welcome back,</p>
                            <h2 className="text-lg font-semibold text-gray-900">Administrator</h2>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-full border border-green-200">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-xs font-medium text-green-700">System Online</span>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <div className="p-6">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
