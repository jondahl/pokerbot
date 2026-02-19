'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logout } from '@/app/actions';

const navLinks = [
  { href: '/', label: 'Dashboard' },
  { href: '/players', label: 'Players' },
  { href: '/games', label: 'Games' },
  { href: '/escalations', label: 'Escalations' },
];

export default function Navigation() {
  const pathname = usePathname();

  async function handleLogout() {
    await logout();
  }

  return (
    <nav className="bg-gray-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <span className="text-xl font-bold">PokerList</span>
            <div className="ml-10 flex items-baseline space-x-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    pathname === link.href
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
