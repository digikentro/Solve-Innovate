import { FiSettings, FiGlobe, FiBell, FiDatabase, FiSave } from 'react-icons/fi';
import toast from 'react-hot-toast';

export function AdminSettingsPage() {
    const handleSave = () => {
        toast.success('Settings saved successfully');
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
                <p className="mt-1 text-sm text-gray-600">Configure platform settings and preferences</p>
            </div>

            {/* Settings Sections */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* General Settings */}
                <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                            <FiSettings className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-lg font-semibold text-gray-900">General Settings</h2>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Platform Name</label>
                            <input
                                type="text"
                                defaultValue="Solve Innovate"
                                className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Support Email</label>
                            <input
                                type="email"
                                defaultValue="support@solveinnovate.com"
                                className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                            />
                        </div>
                    </div>
                </div>

                {/* Webhook Settings */}
                <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <FiGlobe className="w-5 h-5 text-blue-600" />
                        </div>
                        <h2 className="text-lg font-semibold text-gray-900">Webhook URLs</h2>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Chat Webhook</label>
                            <input
                                type="url"
                                defaultValue="https://n8n.srv922914.hstgr.cloud/webhook/chatbox"
                                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 font-mono text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Extreme User Webhook</label>
                            <input
                                type="url"
                                defaultValue="https://n8n.srv922914.hstgr.cloud/webhook/extreme-user"
                                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 font-mono text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Notification Settings */}
                <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                            <FiBell className="w-5 h-5 text-amber-600" />
                        </div>
                        <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
                    </div>

                    <div className="space-y-3">
                        <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                            <span className="text-sm text-gray-700">Email alerts for new signups</span>
                            <input type="checkbox" defaultChecked className="w-4 h-4 rounded accent-indigo-600" />
                        </label>
                        <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                            <span className="text-sm text-gray-700">Weekly activity reports</span>
                            <input type="checkbox" defaultChecked className="w-4 h-4 rounded accent-indigo-600" />
                        </label>
                        <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                            <span className="text-sm text-gray-700">System error notifications</span>
                            <input type="checkbox" defaultChecked className="w-4 h-4 rounded accent-indigo-600" />
                        </label>
                    </div>
                </div>

                {/* Database Info */}
                <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <FiDatabase className="w-5 h-5 text-green-600" />
                        </div>
                        <h2 className="text-lg font-semibold text-gray-900">Database Status</h2>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <span className="text-sm text-gray-600">Provider</span>
                            <span className="text-sm font-medium text-gray-900">Supabase</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <span className="text-sm text-gray-600">Status</span>
                            <span className="flex items-center gap-2 text-sm font-medium text-green-600">
                                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                Connected
                            </span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <span className="text-sm text-gray-600">Region</span>
                            <span className="text-sm font-medium text-gray-900">ap-south-1</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
                <button
                    onClick={handleSave}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                >
                    <FiSave className="w-4 h-4" />
                    Save Changes
                </button>
            </div>
        </div>
    );
}
