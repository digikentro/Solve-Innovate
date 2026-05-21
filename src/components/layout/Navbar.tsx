import { type CSSProperties, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Menu, UserCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useScrollLock } from '@/hooks/useScrollLock';

export function Navbar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === '/';
  const navHeight = '64px';
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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

  useScrollLock(isMobileMenuOpen);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <>
      <nav
        style={{ '--nav-height': navHeight } as CSSProperties}
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
          'border-b border-white/10 bg-white/70 backdrop-blur-md shadow-sm'
        )}
      >
        <div className="container mx-auto px-4">
          <div className="relative flex h-16 items-center justify-between">

            {/* Left — Logo */}
            <Link
              to="/"
              className="text-3xl font-semibold font-sans flex-shrink-0 transition-colors text-gray-900/90"
            >
              SOLVEINNOVATE
            </Link>

            {/* Center — Nav links */}
            <div className="absolute left-1/2 -translate-x-1/2 hidden items-center gap-8 md:flex">
              <Link
                to="/"
                className="relative text-sm font-medium transition-colors text-gray-700/90 hover:text-gray-900 after:absolute after:bottom-0 after:left-0 after:h-px after:w-0 after:bg-current after:transition-all after:duration-300 hover:after:w-full"
              >
                Home
              </Link>
              <Link
                to="/projects"
                className="relative text-sm font-medium transition-colors text-gray-700/90 hover:text-gray-900 after:absolute after:bottom-0 after:left-0 after:h-px after:w-0 after:bg-current after:transition-all after:duration-300 hover:after:w-full"
              >
                Projects
              </Link>
              <Link
                to="/search"
                className="relative text-sm font-medium transition-colors text-gray-700/90 hover:text-gray-900 after:absolute after:bottom-0 after:left-0 after:h-px after:w-0 after:bg-current after:transition-all after:duration-300 hover:after:w-full"
              >
                Validate Idea
              </Link>
            </div>

            {/* Right — Profile icon / auth buttons + Mobile menu */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="hidden items-center gap-3 md:flex">
                {user ? (
                  /* Profile icon with hover dropdown */
                  <div className="relative group">
                    <button
                      type="button"
                      className="flex items-center justify-center w-9 h-9 rounded-full transition-colors duration-200 text-gray-700/90 hover:text-gray-900 hover:bg-white/30"
                      aria-label="Account menu"
                    >
                      <UserCircle className="w-7 h-7" />
                    </button>

                    {/* Dropdown */}
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
                            relative w-full flex items-center px-3 py-2 text-sm font-medium text-red-500
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
                ) : (
                  <>
                    <Link to="/login">
                      <Button variant="ghost" className="text-sm font-medium">
                        Sign In
                      </Button>
                    </Link>
                    <Link to="/register">
                      <Button className="text-sm font-medium">Sign Up</Button>
                    </Link>
                  </>
                )}
              </div>

              <button
                type="button"
                className="md:hidden flex items-center justify-center w-9 h-9 rounded-full transition-colors duration-200 text-gray-700/90 hover:text-gray-900 hover:bg-white/30"
                aria-label="Toggle navigation"
                aria-expanded={isMobileMenuOpen}
                aria-controls="mobile-navigation"
                onClick={() => setIsMobileMenuOpen((open) => !open)}
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>

          </div>
        </div>
      </nav>

      {/* Mobile Menu — Moved outside <nav> and using higher z-index */}
      <div
        className={cn(
          'md:hidden fixed inset-0 z-[100] transition-opacity duration-300',
          isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
      >
        {/* Backdrop overlay */}
        <div
          className={cn(
            'absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300',
            isMobileMenuOpen ? 'opacity-100' : 'opacity-0'
          )}
          onClick={closeMobileMenu}
        />

        {/* Menu drawer */}
        <aside
          id="mobile-navigation"
          role="dialog"
          aria-modal="true"
          className={cn(
            'absolute right-0 top-0 h-[100dvh] w-4/5 max-w-sm bg-white shadow-2xl transition-transform duration-300 ease-out rounded-l-3xl flex flex-col',
            isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
          )}
          aria-label="Mobile navigation"
        >
          <div className="flex items-center justify-between px-6 pt-6">
            <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400">
              Navigation
            </div>
            <button
              type="button"
              onClick={closeMobileMenu}
              className="p-2 -mr-2 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close navigation"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="px-6 pt-8 pb-6">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl border-2 border-gray-100 bg-gray-50 flex items-center justify-center overflow-hidden shadow-sm">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Profile"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <UserCircle className="h-10 w-10 text-gray-300" />
                )}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Welcome</div>
                <div className="truncate text-lg font-bold text-gray-900 leading-tight">
                  {displayName}
                </div>
                {user ? (
                  <Link
                    to="/profile"
                    onClick={closeMobileMenu}
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-700 mt-1 inline-block"
                  >
                    View profile
                  </Link>
                ) : (
                  <div className="text-sm text-gray-500">Sign in to personalize</div>
                )}
              </div>
            </div>
          </div>

          <div className="px-6">
            <div className="h-px bg-gray-100" />
          </div>

          <nav className="px-4 pt-6 space-y-1">
            <Link
              to="/"
              onClick={closeMobileMenu}
              className={cn(
                "flex items-center px-4 py-4 text-xl font-bold rounded-2xl transition-all",
                location.pathname === '/' ? "bg-indigo-50 text-indigo-600" : "text-gray-800 hover:bg-gray-50"
              )}
            >
              Home
            </Link>
            <Link
              to="/projects"
              onClick={closeMobileMenu}
              className={cn(
                "flex items-center px-4 py-4 text-xl font-bold rounded-2xl transition-all",
                location.pathname === '/projects' ? "bg-indigo-50 text-indigo-600" : "text-gray-800 hover:bg-gray-50"
              )}
            >
              Projects
            </Link>
            <Link
              to="/search"
              onClick={closeMobileMenu}
              className={cn(
                "flex items-center px-4 py-4 text-xl font-bold rounded-2xl transition-all",
                location.pathname === '/search' ? "bg-indigo-50 text-indigo-600" : "text-gray-800 hover:bg-gray-50"
              )}
            >
              Validate Idea
            </Link>
          </nav>

          <div className="mt-auto p-6 bg-gray-50/50">
            {user ? (
              <div className="space-y-3">
                <Link
                  to="/profile"
                  onClick={closeMobileMenu}
                  className="flex items-center justify-center w-full py-4 px-6 text-base font-bold text-gray-700 bg-white border border-gray-200 rounded-2xl shadow-sm hover:bg-gray-50 transition-all"
                >
                  Profile Settings
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    closeMobileMenu();
                    void handleSignOut();
                  }}
                  className="flex items-center justify-center w-full py-4 px-6 text-base font-bold text-red-600 bg-red-50 rounded-2xl hover:bg-red-100 transition-all"
                >
                  Log out
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <Link
                  to="/login"
                  onClick={closeMobileMenu}
                  className="flex items-center justify-center py-4 px-4 text-base font-bold text-gray-900 bg-white border border-gray-200 rounded-2xl hover:bg-gray-50 transition-all"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={closeMobileMenu}
                  className="flex items-center justify-center py-4 px-4 text-base font-bold text-white bg-indigo-600 rounded-2xl hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-all"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </aside>
      </div>
    </>
  );
}

