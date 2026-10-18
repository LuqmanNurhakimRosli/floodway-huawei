import { DashboardSidebar } from '../components/layout/DashboardSidebar';
import { Header } from '../components/layout/Header';
import { BottomNav } from '../components/layout/BottomNav';
import { ShelterMapView } from '../components/map/ShelterMapView';

/** Phones: the map fills the screen above the tab bar, with its own floating controls (no app header). */
export function MapPage() {
  return (
    <div className="flex min-h-screen bg-[#F4F7FB]">
      <DashboardSidebar defaultCollapsed />
      <div className="flex min-w-0 flex-1 flex-col pb-[var(--nav-h)] md:pb-0">
        <div className="hidden md:block">
          <Header />
        </div>
        <ShelterMapView />
        <BottomNav />
      </div>
    </div>
  );
}
