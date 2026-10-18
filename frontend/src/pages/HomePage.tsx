import { DashboardSidebar } from '../components/layout/DashboardSidebar';
import { Header } from '../components/layout/Header';
import { BottomNav } from '../components/layout/BottomNav';
import { FamilySafetyBanner } from '../components/dashboard/FamilySafetyBanner';
import { SystemStatusStrip } from '../components/dashboard/SystemStatusStrip';
import { DistrictRiskBars } from '../components/home/DistrictRiskBars';
import { FamilyCard } from '../components/home/FamilyCard';
import { ForecastTimeline } from '../components/home/ForecastTimeline';
import { HeroStatus } from '../components/home/HeroStatus';
import { HomeGreeting } from '../components/home/HomeGreeting';
import { HomeMap } from '../components/home/HomeMap';
import { NearYou } from '../components/home/NearYou';
import { RefugeAction } from '../components/home/RefugeAction';
import { ReliefList } from '../components/home/ReliefList';
import { ReportsSummary } from '../components/home/ReportsSummary';
import { RiverTrend } from '../components/home/RiverTrend';
import { useVisionStore } from '../hooks/vision/useVisionStore';
import { allSampleCameras, cameraCounts, highestRisk, newestReadingAt, overallLevel } from '../lib/home';

/**
 * The first screen. A greeting and one search, the overall level, your family, the one primary action, then what is near you and the
 * evidence behind it. Everything is computed from data (sample cameras, the shelter list, the forecast endpoint) or
 * labelled simulated; see config/demoScenario.ts.
 */
export function HomePage() {
  const vision = useVisionStore();
  const loading = vision.status === 'idle' || vision.status === 'loading';
  const sample = vision.usingMock || (vision.cameras.length > 0 && allSampleCameras(vision.cameras));

  return (
    <div className="flex min-h-screen bg-[#F4F7FB]">
      <DashboardSidebar />

      <div className="flex min-w-0 flex-1 flex-col pb-[calc(var(--nav-h)+1rem)] md:pb-6">
        <Header />

        <main className="mx-auto w-full max-w-7xl flex-1 space-y-5 p-4 md:space-y-6 md:p-6 lg:p-8" aria-label="Home">
          <HomeGreeting />
          <FamilySafetyBanner />

          <HeroStatus
            loading={loading}
            level={overallLevel(vision.cameras)}
            topCamera={highestRisk(vision.cameras)}
            updatedAt={newestReadingAt(vision.cameras)}
            sample={sample}
            counts={cameraCounts(vision.cameras)}
          />

          <FamilyCard />

          {/* Phones: action, then what is near you, then the map. Desktop: action beside the map, near-you row below. */}
          <div className="grid grid-cols-1 gap-5 md:gap-6 lg:grid-cols-12">
            <div className="lg:col-span-5"><RefugeAction /></div>
            <div className="min-w-0 lg:order-last lg:col-span-12"><NearYou /></div>
            <div className="lg:col-span-7"><HomeMap /></div>
          </div>

          <div className="grid grid-cols-1 gap-5 md:gap-6 lg:grid-cols-12">
            <div className="min-w-0 lg:col-span-5"><ReliefList /></div>
            <div className="min-w-0 lg:col-span-7"><RiverTrend loading={loading} cameras={vision.cameras} history={vision.history} /></div>
          </div>

          <div className="grid grid-cols-1 gap-5 md:gap-6 lg:grid-cols-12">
            <div className="lg:col-span-7"><ForecastTimeline /></div>
            <div className="lg:col-span-5"><DistrictRiskBars loading={loading} cameras={vision.cameras} /></div>
          </div>

          <div className="grid grid-cols-1 gap-5 md:gap-6 lg:grid-cols-12">
            <div className="lg:col-span-5"><ReportsSummary /></div>
            <div className="lg:col-span-7 lg:self-center"><SystemStatusStrip /></div>
          </div>
        </main>

        <BottomNav />
      </div>
    </div>
  );
}
