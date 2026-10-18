import { MapPin, Search, SlidersHorizontal } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useApp } from '../../contexts/AppContext';
import { useAuth } from '../../contexts/AuthContext';

function greeting(hour: number): string {
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

/** The friendly top of Home: who you are, where you are, and one search box that opens the evacuation map. */
export function HomeGreeting() {
  const { user } = useAuth();
  const { selectedLocation } = useApp();
  const first = (user?.name || 'there').split(' ')[0];
  const place = selectedLocation.split(',')[0].trim();

  return (
    <section aria-labelledby="hello" className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        <p className="flex items-center gap-1 text-xs font-semibold text-slate-600">
          <MapPin className="h-3.5 w-3.5 text-[#0E7C7B]" aria-hidden="true" /> Watching around <span className="text-[#0B5F60]">{place}</span>
        </p>
        <h1 id="hello" className="mt-1 font-heading text-[28px]/9 font-bold text-slate-900 md:text-3xl/10">
          {greeting(new Date().getHours())}, {first}
          <span className="block text-slate-900">
            Stay ahead of the <span className="text-[#0E7C7B]">water</span>.
          </span>
        </h1>
      </div>

      <div className="flex w-full gap-2 md:max-w-md">
        <Link
          to="/map"
          className="flex min-h-12 min-w-0 flex-1 items-center gap-2.5 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-500 shadow-[0_8px_24px_-18px_rgba(6,43,43,0.35)] hover:border-[#0E7C7B] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7C7B]"
        >
          <Search className="h-5 w-5 shrink-0 text-slate-500" aria-hidden="true" />
          <span className="truncate">Where do you need to go safely?</span>
        </Link>
        <Link
          to="/map"
          aria-label="Open the map with route options"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#0B5F60] text-white shadow-sm shadow-teal-900/20 hover:bg-[#084647] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7C7B] focus-visible:ring-offset-2"
        >
          <SlidersHorizontal className="h-5 w-5" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
