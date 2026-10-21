import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="sticky top-0 bg-nav text-white px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-8">
        <h1 className="text-xl font-bold text-emerald-400">CEE-First</h1>
        <div className="flex gap-4 text-sm font-medium text-nav-text">
          <Link href="/students" className="hover:text-white transition-colors">
            Students
          </Link>
          <Link href="/contacts" className="hover:text-white transition-colors">
            Contacts & Family
          </Link>
          <Link href="/groups" className="hover:text-white transition-colors">
            Groups
          </Link>
        </div>
      </div>
      <div className="text-xs text-slate-400 bg-slate-800 px-3 py-1.5 rounded-full">
        Director Portal (Dev)
      </div>
    </nav>
  );
}