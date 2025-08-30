import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

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
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link to="/" className="text-3xl font-semibold font-sans">
              SOLVEINNOVATE
            </Link>
            <div className="ml-10 flex items-center space-x-4">
            <Link
                to=""
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
              >
                Intro
              </Link>
              <Link
                to="/projects"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
              >
                Projects
              </Link>

              <Link
                to="/search"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
              >
                Search
              </Link>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <Link
                  to="/profile"
                  className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
                >
                  Profile
                </Link>
                <Button
                  variant="ghost"
                  onClick={handleSignOut}
                  className="text-sm font-medium"
                >
                  Sign Out
                </Button>
              </>
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