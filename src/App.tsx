import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { LoginForm } from '@/components/auth/LoginForm';
import { SignupForm } from '@/components/auth/SignupForm';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { ProfilePage } from '@/pages/ProfilePage';
import { ProjectsPage } from '@/pages/ProjectsPage';
import { ProjectDetailPage } from '@/pages/ProjectDetailPage';
import CreateProjectPage from '@/pages/CreateProjectPage';
import { ProfileCard } from '@/components/dashboard/ProfileCard';
import { IOSDashboard } from '@/components/dashboard/IOSDashboard';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { Toaster } from 'react-hot-toast';
import { Layout } from '@/components/layout/Layout';
import { SidebarLayout } from '@/components/layout/SidebarLayout';
import { WorkspacePage } from '@/pages/WorkspacePage';

import { HomePage } from '@/pages/HomePage';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import ProjectEditPage from '@/pages/ProjectEditPage';
import { EditProfilePage } from '@/pages/ProfilePage';
import ProjectSlidePage from '@/pages/ProjectSlidePage';
import ProjectCanvasPage from '@/pages/ProjectCanvasPage';
import SearchPage from '@/pages/SearchPage';
import UniversalDeepEmpathyPage from '@/pages/UniversalDeepEmpathyPage';
import { ChatPage } from '@/pages/ChatPage';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { AdminDashboard } from '@/pages/admin/AdminDashboard';
import { AdminUsersPage } from '@/pages/admin/AdminUsersPage';
import { AdminProjectsPage } from '@/pages/admin/AdminProjectsPage';
import { AdminSettingsPage } from '@/pages/admin/AdminSettingsPage';
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage';
import { ResetPasswordPage } from '@/pages/ResetPasswordPage';
import { WorkspaceProvider } from '@/contexts/WorkspaceContext';
import { NavigationProvider } from '@/contexts/NavigationContext';

// Dashboard component (protected route)
const Dashboard = () => {
  const { user, signOut } = useAuth(); 

  return (
    <div className="min-h-screen bg-gray-100">
      <main className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="pb-5 border-b border-gray-200 sm:flex sm:items-center sm:justify-between">
            <h2 className="text-2xl font-bold leading-tight text-gray-900">Dashboard</h2>
            <div className="mt-3 sm:mt-0 sm:ml-4">
              <Link
                to="/projects/new"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Create New Project
              </Link>
            </div>
          </div>

          <div className="mt-8 grid gap-6 grid-cols-1 lg:grid-cols-3">
            {/* Profile Card */}
            <div className="lg:col-span-1">
              <ProfileCard />
            </div>

            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* IOS Dashboard */}
              <IOSDashboard />

              {/* Welcome Section */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Welcome to SolveInnovate</h3>
                <p className="text-gray-600">Start shaping your ideas with AI assistance. Create a new project or explore existing ones to get started.</p>

                <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div className="bg-indigo-50 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-indigo-800">Projects</h4>
                    <p className="mt-2 text-2xl font-semibold text-indigo-900">0</p>
                    <p className="mt-1 text-sm text-indigo-700">
                      <Link to="/projects" className="hover:underline">View all →</Link>
                    </p>
                  </div>

                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-green-800">Ideas</h4>
                    <p className="mt-2 text-2xl font-semibold text-green-900">0</p>
                    <p className="mt-1 text-sm text-green-700">
                      <Link to="/projects" className="hover:underline">View all →</Link>
                    </p>
                  </div>
                </div>
              </div>

              {/* Recent Activity Section */}
              <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="bg-white px-6 py-5 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
                </div>
                <div className="px-6 py-4">
                  <p className="text-sm text-gray-500 text-center py-8">No recent activity to display</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

// Setup Profile component (protected route)
const SetupProfile = () => {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      // Here you would typically update the user's profile in your database
      // For now, we'll just navigate to the dashboard
      navigate('/dashboard');
    } catch (error) {
      console.error('Error setting up profile:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Complete your profile
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Tell us a bit about yourself
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="full-name" className="sr-only">
                Full Name
              </label>
              <input
                id="full-name"
                name="name"
                type="text"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Continue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


const RootRoute = () => {
  const { user } = useAuth();
  return user ? <Navigate to="/workspace" replace /> : <HomePage />;
};

function App() {
  return (
    <ErrorBoundary>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider>
          <Toaster position="top-right" />
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<RootRoute />} />
              <Route path="login" element={<LoginPage />} />
              <Route path="register" element={<RegisterPage />} />
              <Route path="forgot-password" element={<ForgotPasswordPage />} />
              <Route path="reset-password" element={<ResetPasswordPage />} />
            </Route>

            {/* Authenticated Routes with SidebarLayout */}
            <Route element={
              <ProtectedRoute>
                <NavigationProvider>
                  <WorkspaceProvider>
                    <SidebarLayout />
                  </WorkspaceProvider>
                </NavigationProvider>
              </ProtectedRoute>
            }>
              <Route path="workspace" element={<WorkspacePage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="profile/edit" element={<EditProfilePage />} />
              <Route path="projects" element={<ProjectsPage />} />
              <Route path="projects/new" element={<WorkspacePage />} />
              <Route path="projects/:id" element={<ProjectDetailPage />} />
              <Route path="projects/:id/edit" element={<ProjectEditPage />} />
              <Route path="projects/:id/slide" element={<ProjectSlidePage />} />
              <Route path="projects/:id/canvas" element={<ProjectCanvasPage />} />
              <Route path="projects/:id/deep_empathy" element={<UniversalDeepEmpathyPage />} />
              <Route path="projects/:id/chat" element={<ChatPage />} />
              <Route path="dashboard" element={<Navigate to="/workspace" replace />} />
              <Route path="setup-profile" element={<SetupProfile />} />
              <Route path="search" element={<SearchPage />} />
            </Route>

            {/* Admin Routes */}
            <Route path="/admin" element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }>
              <Route index element={<AdminDashboard />} />
              <Route path="users" element={<AdminUsersPage />} />
              <Route path="projects" element={<AdminProjectsPage />} />
              <Route path="settings" element={<AdminSettingsPage />} />
            </Route>
          </Routes>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
