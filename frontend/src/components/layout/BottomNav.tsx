import { NavLink } from 'react-router-dom';
import { FileText, LayoutDashboard, Map, Video } from 'lucide-react';

const TABS = [
  { label: 'Home', icon: LayoutDashboard, path: '/home' },
  { label: 'Map', icon: Map, path: '/map' },
  { label: 'Reports', icon: FileText, path: '/reports' },
  { label: 'Live', icon: Video, path: '/live' },
];

/** Phone tab bar: four places. Profile is reached from the avatar in the header. The active tab gets a blue pill behind its icon, so the current place reads at a glance. */
export function BottomNav() {
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/70 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-10px_30px_-20px_rgba(7,20,38,0.35)] backdrop-blur-xl md:hidden"
    >
      <ul className="mx-auto flex h-16 max-w-md items-stretch justify-around px-1">
        {TABS.map((tab) => (
          <li key={tab.path} className="flex flex-1">
            <NavLink
              to={tab.path}
              className={({ isActive }) =>
                `group flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1677FF] ${
                  isActive ? 'font-bold text-[#0958D9]' : 'font-medium text-slate-500 hover:text-slate-800'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`flex h-7 w-12 items-center justify-center rounded-full transition-colors duration-200 motion-reduce:transition-none ${
                      isActive ? 'bg-blue-100/80' : 'bg-transparent'
                    }`}
                  >
                    <tab.icon className="h-5 w-5" strokeWidth={isActive ? 2.4 : 2} aria-hidden="true" />
                  </span>
                  <span>{tab.label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
