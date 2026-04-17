import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';

export function Layout() {
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className={`container mx-auto px-4 pt-16 ${isHome ? 'pb-8' : 'py-4'}`}>
        <Outlet />
      </main>
    </div>
  );
} 