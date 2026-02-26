import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { UserCircle } from 'lucide-react';

export function Navbar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <nav className="border-b bg-background">
      <div className="container mx-auto px-4">
        <div className="relative flex h-16 items-center justify-between">

          {/* Left — Logo */}
          <Link to="/" className="text-3xl font-semibold font-sans flex-shrink-0">
            SOLVEINNOVATE
          </Link>

          {/* Center — Nav links */}
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-8">
            <Link
              to=""
              className="relative text-sm font-medium text-muted-foreground transition-colors hover:text-primary
                after:absolute after:bottom-0 after:left-0 after:h-px after:w-0 after:bg-current
                after:transition-all after:duration-300 hover:after:w-full"
            >
              Intro
            </Link>
            <Link
              to="/projects"
              className="relative text-sm font-medium text-muted-foreground transition-colors hover:text-primary
                after:absolute after:bottom-0 after:left-0 after:h-px after:w-0 after:bg-current
                after:transition-all after:duration-300 hover:after:w-full"
            >
              Projects
            </Link>
            <Link
              to="/search"
              className="relative text-sm font-medium text-muted-foreground transition-colors hover:text-primary
                after:absolute after:bottom-0 after:left-0 after:h-px after:w-0 after:bg-current
                after:transition-all after:duration-300 hover:after:w-full"
            >
              Validate Idea
            </Link>
          </div>

          {/* Right — Profile icon or auth buttons */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {user ? (
              /* Profile icon with hover dropdown */
              <div className="relative group">
                <button
                  type="button"
                  className="flex items-center justify-center w-9 h-9 rounded-full text-muted-foreground hover:text-primary hover:bg-gray-100 transition-colors duration-200"
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

        </div>
      </div>
    </nav>
  );
}
