import './tailwind.css';
import './style.css';
import { useState } from 'react';
// import logoUrl from '../assets/logo.svg';
import { Link } from '../components/Link';
import {
  Menu,
  Home,
  Users,
  Calendar,
  ClipboardList,
  CheckSquare,
} from 'lucide-react';

export default function LayoutDefault({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <div className="drawer lg:drawer-open">
      <input
        id="drawer"
        type="checkbox"
        className="drawer-toggle"
        checked={isDrawerOpen}
        onChange={(e) => setIsDrawerOpen(e.target.checked)}
      />
      <div className="drawer-content flex flex-col min-h-screen">
        {/* Navbar */}
        <div className="navbar bg-base-100 lg:hidden">
          <div className="flex-none">
            <label
              htmlFor="drawer"
              className="btn btn-square btn-ghost drawer-button"
            >
              <Menu className="w-5 h-5 stroke-current" />
            </label>
          </div>
          <div className="flex-1">
            <Link href="/" className="btn btn-ghost normal-case text-xl">
              Packing List
            </Link>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 p-4">{children}</main>
      </div>

      {/* Sidebar */}
      <div className="drawer-side">
        <label htmlFor="drawer" className="drawer-overlay"></label>
        <div className="menu p-4 w-80 min-h-full bg-base-200 text-base-content">
          <div className="hidden lg:flex mb-8">
            <Link href="./" className="btn btn-ghost normal-case text-xl">
              Packing List
            </Link>
          </div>
          <ul className="menu menu-lg gap-2">
            <li>
              <Link href="/" className="flex items-center gap-2">
                <Home className="w-5 h-5" />
                Overview
              </Link>
            </li>
            <li>
              <Link href="/people" className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                People
              </Link>
            </li>
            <li>
              <Link href="/days" className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Days
              </Link>
            </li>
            <li>
              <Link href="/defaults" className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5" />
                Default Items
              </Link>
            </li>
            <li>
              <Link href="/packing-list" className="flex items-center gap-2">
                <CheckSquare className="w-5 h-5" />
                Packing List
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// function Logo({ className = '' }: { className?: string }) {
//   return (
//     <div className={`mb-2 ${className}`}>
//       <a href="/">
//         <img src={logoUrl} height={64} width={64} alt="logo" />
//       </a>
//     </div>
//   );
// }
