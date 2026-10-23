'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, LogOut, Menu, Stethoscope, Users, X } from 'lucide-react';
import clsx from 'clsx';
import { useLogout } from '@/lib/queries';
import { Avatar } from './ui';

const NAV = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/doctors', label: 'Doctors', icon: Stethoscope },
  { href: '/patients', label: 'Patients', icon: Users },
];

export function Logo({ light }) {
  return (
    <span className="flex items-center gap-2.5">
      <svg viewBox="0 0 40 24" className="h-6 w-10" fill="none" aria-hidden>
        <path d="M1 13h9l3-9 6 18 4-12 3 3h13" stroke="#F0436B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className={clsx('font-display text-lg font-bold tracking-tight', light ? 'text-white' : 'text-petrol-950')}>Doctor Tracker</span>
    </span>
  );
}

export default function AppShell({ user, children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const logout = useLogout();
  useEffect(() => setOpen(false), [pathname]);

  const signOut = () => logout.mutate(undefined, { onSuccess: () => { router.replace('/login'); router.refresh(); } });
  const isActive = (href) => (href === '/' ? pathname === '/' : pathname.startsWith(href));

  const sidebar = (
    <div className="flex h-full flex-col bg-petrol-900 text-petrol-300">
      <div className="flex h-16 items-center justify-between px-5"><Logo light /></div>
      <nav className="flex-1 space-y-1 px-3 py-4" aria-label="Main">
        {NAV.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} aria-current={isActive(href) ? 'page' : undefined}
            className={clsx('flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
              isActive(href) ? 'bg-white/10 text-white' : 'hover:bg-white/5 hover:text-white')}>
            <Icon className={clsx('h-[18px] w-[18px]', isActive(href) && 'text-pulse-500')} aria-hidden />
            {label}
          </Link>
        ))}
      </nav>
      <div className="border-t border-white/10 p-3">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <Avatar name={user.name} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">{user.name}</p>
            <p className="truncate text-xs">{user.email}</p>
          </div>
          <button onClick={signOut} aria-label="Sign out" className="rounded-md p-2 hover:bg-white/10 hover:text-white"><LogOut className="h-4 w-4" /></button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen lg:pl-64">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 lg:block">{sidebar}</aside>

      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-mist-200 bg-white/90 px-4 backdrop-blur lg:hidden">
        <Logo />
        <button onClick={() => setOpen(true)} aria-label="Open menu" className="rounded-md p-2 hover:bg-mist-100"><Menu className="h-5 w-5" /></button>
      </header>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-petrol-950/50" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 animate-pop shadow-pop">
            {sidebar}
            <button onClick={() => setOpen(false)} aria-label="Close menu" className="absolute right-3 top-4 rounded-md p-1.5 text-petrol-300 hover:bg-white/10"><X className="h-5 w-5" /></button>
          </div>
        </div>
      )}

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
    </div>
  );
}
