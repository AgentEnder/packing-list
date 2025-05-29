import './tailwind.css';
import './style.css';
import { useState } from 'react';
import logoUrl from '../assets/logo.svg';
import { Link } from '../components/Link.js';

export default function LayoutDefault({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      {/* Mobile Header - only visible on mobile */}
      <div className="lg:hidden flex items-center justify-between p-4 border-b">
        <Logo />
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2"
          aria-label="Toggle menu"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {isMobileMenuOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </div>

      <div className="flex-1 flex justify-center">
        <div className="w-full max-w-7xl flex relative">
          {/* Desktop Sidebar */}
          <Sidebar className="hidden lg:flex">
            <Logo className="lg:block" />
            <NavLinks />
          </Sidebar>

          {/* Mobile Menu Overlay */}
          {isMobileMenuOpen && (
            <div className="lg:hidden fixed inset-0 z-50 bg-white overflow-hidden">
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between p-4 border-b">
                  <Logo />
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-2"
                    aria-label="Close menu"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                  <NavLinks onClick={() => setIsMobileMenuOpen(false)} />
                </div>
              </div>
            </div>
          )}

          {/* Main Content */}
          <Content>{children}</Content>
        </div>
      </div>
    </div>
  );
}

function NavLinks({ onClick }: { onClick?: () => void }) {
  return (
    <>
      <div onClick={onClick} className="mb-2">
        <Link href="/">Overview</Link>
      </div>
      <div onClick={onClick} className="mb-2">
        <Link href="/people">People</Link>
      </div>
      <div onClick={onClick} className="mb-2">
        <Link href="/days">Days</Link>
      </div>
      <div onClick={onClick} className="mb-2">
        <Link href="/defaults">Default Items</Link>
      </div>
      <div onClick={onClick} className="mb-2">
        <Link href="/packing-list">Packed List</Link>
      </div>
    </>
  );
}

function Sidebar({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      id="sidebar"
      className={`w-64 p-5 flex flex-col shrink-0 border-r-2 border-r-gray-200 ${className}`}
    >
      {children}
    </div>
  );
}

function Content({ children }: { children: React.ReactNode }) {
  return (
    <div id="page-container" className="flex-1 w-full overflow-x-hidden">
      <div id="page-content" className="p-5 pb-12 min-h-screen">
        {children}
      </div>
    </div>
  );
}

function Logo({ className = '' }: { className?: string }) {
  return (
    <div className={`mb-2 ${className}`}>
      <a href="/">
        <img src={logoUrl} height={64} width={64} alt="logo" />
      </a>
    </div>
  );
}
