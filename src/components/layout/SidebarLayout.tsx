import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useNavDirection } from '@/contexts/NavigationContext';
import { ProjectService } from '@/services/projectService';
import { Button } from '@/components/ui/button';
import type { Project } from '@/types/project';
import { PageTransition } from '@/components/layout/PageTransition';
import {
  Plus,
  Search,
  Menu,
  X,
  ChevronLeft,
  ArrowLeft,
  MoreVertical,
  UserPlus,
  Info,
  Edit2,
  Trash2,
} from 'lucide-react';
import { AssessmentProblemDetailedView } from '@/components/ui/AssessmentProblemDetailedView';
import { toast } from 'react-hot-toast';

export function SidebarLayout() {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { setDirection } = useNavDirection();
  const { topBarTitle, activeProjectScore, activeProjectAssessment } = useWorkspace();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [showAllProjects, setShowAllProjects] = useState(false);
  const [showAssessmentModal, setShowAssessmentModal] = useState(false);

  // Context menu for 3-dot (Edit / Delete)
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      ProjectService.getUserProjects(user.id).then(setProjects).catch(console.error);
    }
  }, [user]);

  // Close context menu on outside click
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpenId(null);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const isProjectPage = location.pathname.startsWith('/projects/');

  const displayName =
    user?.user_metadata?.full_name ??
    user?.user_metadata?.name ??
    user?.email ??
    'Guest';
  const avatarUrl =
    user?.user_metadata?.avatar_url ??
    user?.user_metadata?.picture ??
    user?.user_metadata?.avatar ??
    '';

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const closeMobileMenu = () => setIsMobileOpen(false);

  /** Navigate forward to project detail */
  const goForward = (path: string) => {
    setDirection('forward');
    navigate(path);
    closeMobileMenu();
  };

  /** Navigate back (reverse transition) */
  const goBack = () => {
    setDirection('back');
    navigate(-1);
  };

  /** Navigate to workspace with a forward transition */
  const goToWorkspace = () => {
    setDirection('forward');
    navigate('/workspace');
    closeMobileMenu();
  };

  /** Delete a project from the sidebar */
  const handleDeleteProject = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setMenuOpenId(null);
    if (!window.confirm('Delete this project? This cannot be undone.')) return;
    try {
      await ProjectService.deleteProject(id, user?.id || '');
      setProjects(prev => prev.filter(p => p.id !== id));
      toast.success('Project deleted');
    } catch {
      toast.error('Failed to delete project');
    }
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={closeMobileMenu}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 flex flex-col bg-sidebar border-r border-gray-200 transition-all duration-300 ease-in-out ${
          isProjectPage ? 'w-0 overflow-hidden border-r-0 opacity-0' : isCollapsed ? 'w-20' : 'w-64'
        } ${
          isMobileOpen && !isProjectPage ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-4 flex items-center justify-between h-16">
          {!isCollapsed && (
            <Link to="/" className="flex items-center gap-2" onClick={closeMobileMenu}>
              <div className="w-8 h-8 bg-primary rounded flex items-center justify-center text-white font-bold">
                S
              </div>
              <span className="font-semibold text-lg">SolveInnovate</span>
            </Link>
          )}
          {isCollapsed && (
            <div className="w-8 h-8 bg-primary rounded flex items-center justify-center text-white font-bold mx-auto">
              S
            </div>
          )}

          <button className="md:hidden p-2" onClick={closeMobileMenu}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sidebar Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 hide-scrollbar">
          {/* New Project Button — explicit white text so it's always readable */}
          <Button
            className={`w-full justify-start text-white bg-primary hover:bg-primary/90 ${isCollapsed ? 'px-0 justify-center' : ''}`}
            onClick={goToWorkspace}
          >
            <Plus className={`${isCollapsed ? '' : 'mr-2'} w-4 h-4`} />
            {!isCollapsed && 'New Project'}
          </Button>

          {/* Navigation Links */}
          <div className="space-y-1">
            <Button
              variant="ghost"
              className={`w-full justify-start ${isCollapsed ? 'px-0 justify-center' : ''}`}
              onClick={() => { navigate('/search'); closeMobileMenu(); }}
            >
              <Search className={`${isCollapsed ? '' : 'mr-2'} w-4 h-4`} />
              {!isCollapsed && 'Validate Project'}
            </Button>
          </div>

          {/* Recent Projects */}
          {!isCollapsed && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {showAllProjects ? 'All Projects' : 'Recent Projects'}
                </div>
              </div>
              <div className="space-y-0.5">
                {(showAllProjects ? projects : projects.slice(0, 5)).map(project => {
                  const isNew = Date.now() - new Date(project.created_at).getTime() < 24 * 60 * 60 * 1000;
                  const isMenuOpen = menuOpenId === project.id;

                  return (
                    <div
                      key={project.id}
                      className="relative"
                    >
                      <div
                        onClick={() => goForward(`/projects/${project.id}`)}
                        className="p-2 hover:bg-white rounded-md cursor-pointer group flex items-center justify-between transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="truncate text-sm text-gray-700 flex items-center gap-2">
                            <span className="truncate">{project.title}</span>
                            {isNew && (
                              <span className="flex-shrink-0 text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full font-medium">
                                New
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-gray-400 mt-0.5">
                            {new Date(project.created_at).toLocaleDateString()}
                          </div>
                        </div>

                        {/* 3-dot menu trigger */}
                        <button
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded transition-opacity ml-1 flex-shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            setMenuOpenId(isMenuOpen ? null : project.id);
                          }}
                          aria-label="Project options"
                        >
                          <MoreVertical className="w-3.5 h-3.5 text-gray-500" />
                        </button>
                      </div>

                      {/* Dropdown menu */}
                      {isMenuOpen && (
                        <div
                          ref={menuRef}
                          className="absolute right-0 top-full mt-0.5 w-36 z-50 bg-white rounded-lg border border-gray-200 shadow-lg py-1 overflow-hidden"
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setMenuOpenId(null);
                              navigate(`/projects/${project.id}/edit`);
                              closeMobileMenu();
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-indigo-500" />
                            Edit
                          </button>
                          <button
                            onClick={(e) => handleDeleteProject(e, project.id)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}

                {projects.length > 5 && (
                  <button
                    onClick={() => setShowAllProjects(!showAllProjects)}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-medium w-full text-left p-2 mt-1"
                  >
                    {showAllProjects ? 'Show less' : 'View all projects'}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 mt-auto border-t border-gray-200/50 space-y-2">
          {!isCollapsed && (
            <>
              <Button variant="outline" className="w-full justify-start text-sm">
                <UserPlus className="mr-2 w-4 h-4" />
                Invite Team Member
              </Button>
              <div className="text-xs text-gray-500 text-center py-2">
                Free trial ends in 7 days
              </div>
            </>
          )}

          <button
            className={`flex items-center text-sm text-gray-500 hover:text-gray-700 p-2 w-full ${isCollapsed ? 'justify-center' : ''}`}
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            <ChevronLeft className={`w-4 h-4 transition-transform ${isCollapsed ? 'rotate-180' : 'mr-2'}`} />
            {!isCollapsed && 'Collapse Menu'}
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="flex-1 flex flex-col min-w-0 bg-background overflow-hidden relative">
        {/* Topbar */}
        <header className="h-16 flex-shrink-0 flex items-center justify-between px-4 lg:px-8 border-b border-gray-100 bg-white/50 backdrop-blur-sm z-10">
          <div className="flex items-center gap-2 sm:gap-4 flex-1">
            <button
              className="md:hidden p-2 text-gray-500 hover:text-gray-700"
              onClick={() => setIsMobileOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Back arrow — reverse transition */}
            {isProjectPage && (
              <button
                onClick={goBack}
                className="p-2 text-gray-500 hover:text-gray-700 bg-white border border-gray-200 rounded-md transition-colors"
                title="Back to Workspace"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}

            <Button variant="outline" size="sm" className="hidden sm:flex bg-white text-gray-700">
              Share
            </Button>
          </div>

          <div className="flex-[2] flex justify-center items-center gap-3">
            <h1 className="text-sm font-semibold text-gray-900 truncate max-w-[200px] sm:max-w-md">
              {topBarTitle}
            </h1>

            {/* IOS Score pill */}
            {isProjectPage && activeProjectScore !== null && (
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-1 rounded-full">
                <span className="text-xs font-semibold text-gray-700">IOS Score:</span>
                <span className="text-sm font-bold text-gray-900">{activeProjectScore}</span>
                <button
                  onClick={() => setShowAssessmentModal(true)}
                  className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                  title="View Score Breakdown"
                >
                  <Info className="w-3.5 h-3.5 text-gray-500" />
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 flex-1">
            {/* Profile Dropdown */}
            <div className="relative group">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white cursor-pointer overflow-hidden">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs font-semibold">{displayName.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div
                className="
                  absolute right-0 top-[calc(100%+8px)]
                  w-44 rounded-xl border border-gray-200/60
                  bg-gradient-to-b from-white/95 to-gray-50/90
                  backdrop-blur-md shadow-lg
                  opacity-0 invisible translate-y-1
                  group-hover:opacity-100 group-hover:visible group-hover:translate-y-0
                  transition-all duration-200 ease-out
                  z-50
                "
              >
                <div className="p-1.5">
                  <Link
                    to="/profile"
                    className="
                      relative flex items-center px-3 py-2 text-sm font-medium text-gray-700
                      rounded-lg hover:bg-gray-100/70 transition-colors duration-150
                      after:absolute after:bottom-1 after:left-3 after:h-px after:w-0
                      after:bg-gray-700 after:transition-all after:duration-250 hover:after:w-[calc(100%-24px)]
                    "
                  >
                    Edit Profile
                  </Link>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="
                      relative w-full flex text-left items-center px-3 py-2 text-sm font-medium text-red-500
                      rounded-lg hover:bg-red-50/70 transition-colors duration-150
                      after:absolute after:bottom-1 after:left-3 after:h-px after:w-0
                      after:bg-red-400 after:transition-all after:duration-250 hover:after:w-[calc(100%-24px)]
                    "
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content — animated */}
        <div className="flex-1 overflow-auto">
          <PageTransition>
            <Outlet />
          </PageTransition>
        </div>

        {/* Assessment Score Modal */}
        {showAssessmentModal && activeProjectAssessment && (
          <AssessmentProblemDetailedView
            open={showAssessmentModal}
            onClose={() => setShowAssessmentModal(false)}
            assessment={activeProjectAssessment}
            problemTitle={topBarTitle}
            viewType="problem"
          />
        )}
      </main>
    </div>
  );
}
