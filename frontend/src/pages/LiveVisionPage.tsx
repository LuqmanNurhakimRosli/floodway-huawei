import { ChevronDown, SlidersHorizontal, Video } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardSidebar } from '../components/layout/DashboardSidebar';
import { Header } from '../components/layout/Header';
import { BottomNav } from '../components/layout/BottomNav';
import { AlertToast } from '../components/live/alerts/AlertToast';
import { AnalysisColumn } from '../components/live/analysis/AnalysisColumn';
import { CameraChips } from '../components/live/cameras/CameraChips';
import { CameraList } from '../components/live/cameras/CameraList';
import { NearbyFilters } from '../components/live/cameras/NearbyFilters';
import { CameraGrid } from '../components/live/feed/CameraGrid';
import { CameraStrip } from '../components/live/feed/CameraStrip';
import { CaptureStrip } from '../components/live/feed/CaptureStrip';
import { FeedHeader } from '../components/live/feed/FeedHeader';
import { FeedViewer } from '../components/live/feed/FeedViewer';
import { DEFAULT_OVERLAYS, OverlayToggles } from '../components/live/feed/OverlayToggles';
import type { OverlayState } from '../components/live/feed/OverlayToggles';
import { ViewToggle } from '../components/live/feed/ViewToggle';
import type { ViewMode } from '../components/live/feed/ViewToggle';
import { AddCameraWizard } from '../components/live/onboarding/AddCameraWizard';
import { EmptyState } from '../components/live/shared/EmptyState';
import { LiveVisionSkeleton } from '../components/live/shared/Skeleton';
import { card, focusRing, heading } from '../components/live/shared/ui';
import { useAlertEffects } from '../hooks/vision/useAlertEffects';
import { useGpsPlace } from '../hooks/vision/useGpsPlace';
import { useNearbyCameras } from '../hooks/vision/useNearbyCameras';
import type { CameraTab } from '../hooks/vision/useNearbyCameras';
import { useSelectedCamera } from '../hooks/vision/useSelectedCamera';
import { useVisionStore, visionActions } from '../hooks/vision/useVisionStore';
import { camTag } from '../lib/vision/camTag';
import { haversineKm, KLCC, PLACES } from '../lib/vision/geo';
import type { AlertEvent } from '../types/vision';

/** Live Vision: replaces the old 3D simulation page. Route: /live */
export default function LiveVisionPage() {
  const navigate = useNavigate();
  const state = useVisionStore();
  const gps = useGpsPlace();

  const places = useMemo(() => (gps ? [gps, ...PLACES] : PLACES), [gps]);
  const [placeId, setPlaceId] = useState(KLCC.id);
  const origin = places.find((p) => p.id === placeId) ?? KLCC;
  const [radiusKm, setRadiusKm] = useState(5);
  const [tab, setTab] = useState<CameraTab>('nearby');
  const [query, setQuery] = useState('');
  const [view, setView] = useState<ViewMode>('focus');
  const [overlays, setOverlays] = useState<OverlayState>(DEFAULT_OVERLAYS);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);

  const items = useNearbyCameras(state.cameras, { origin, radiusKm, tab, query });
  const visible = useMemo(() => items.map((i) => i.camera), [items]);
  const { selected, selectedId, setSelectedId } = useSelectedCamera(visible);
  const selectedDistance = selected ? haversineKm(origin.lat, origin.lon, selected.lat, selected.lon) : 0;

  useAlertEffects(state.unseen);
  useEffect(() => {
    if (selectedId) void visionActions.loadHistory(selectedId);
  }, [selectedId]);

  const showOnMap = useCallback((cameraId: string) => navigate(`/map?focus=${encodeURIComponent(cameraId)}`), [navigate]);
  const openAlert = useCallback((a: AlertEvent) => { visionActions.ackAlert(a.id); showOnMap(a.camera_id); }, [showOnMap]);
  const dismissAlert = useCallback((a: AlertEvent) => visionActions.ackAlert(a.id), []);

  const onlineCount = state.cameras.filter((c) => c.online).length;
  const loading = state.status === 'idle' || state.status === 'loading';

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <DashboardSidebar />
      <div className="flex h-screen min-w-0 flex-1 flex-col overflow-hidden pb-16 md:pb-0">
        <Header />
        <main className="flex-1 overflow-y-auto overscroll-contain" aria-label="Live Vision">
          {loading ? (
            <LiveVisionSkeleton />
          ) : (
            <div className="mx-auto w-full max-w-[1600px] space-y-3 p-3 sm:p-4 lg:p-5">
              {state.usingMock && (
                <p role="status" className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900">
                  Showing sample data: the FloodWay server could not be reached{state.error ? ` (${state.error})` : ''}. Readings below are self-running samples, not real cameras.
                </p>
              )}
              {!state.usingMock && !state.connected && (
                <p role="status" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700">
                  Reconnecting to live updates…
                </p>
              )}

              <div className="flex items-center justify-between gap-3 lg:hidden">
                <h1 className={`${heading} flex items-center gap-2 text-xl`}>
                  <Video className="h-5 w-5 text-[#1677FF]" aria-hidden="true" /> Live Vision
                </h1>
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-700">
                  {onlineCount} / {state.cameras.length} online
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-[320px_minmax(0,1fr)_340px] xl:grid-cols-[340px_minmax(0,1fr)_360px]">
                {/* LEFT: cameras near you (desktop) */}
                <aside className={`${card} hidden self-start p-4 lg:block`} aria-label="Cameras near you">
                  <div className="mb-3 flex items-center justify-between">
                    <h1 className={`${heading} text-xl`}>Cameras near you</h1>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">{onlineCount} / {state.cameras.length} online</span>
                  </div>
                  <NearbyFilters places={places} placeId={placeId} onPlace={setPlaceId} radiusKm={radiusKm} onRadius={setRadiusKm} tab={tab} onTab={setTab} query={query} onQuery={setQuery} />
                  <div className="mt-4">
                    <CameraList items={items} history={state.history} selectedId={selectedId} useScene={state.usingMock} isMineTab={tab === 'mine'} onSelect={setSelectedId} onAdd={() => setWizardOpen(true)} />
                  </div>
                </aside>

                {/* MOBILE / TABLET: compact filters + chips */}
                <div className="min-w-0 space-y-3 lg:hidden">
                  <button type="button" aria-expanded={filtersOpen} onClick={() => setFiltersOpen(!filtersOpen)} className={`${card} flex min-h-12 w-full items-center justify-between px-4 text-left text-sm font-bold text-slate-900 ${focusRing}`}>
                    <span className="flex items-center gap-2">
                      <SlidersHorizontal className="h-4 w-4 text-slate-600" aria-hidden="true" />
                      {origin.label.split(',')[0]} · {radiusKm} km · {tab === 'mine' ? 'My cameras' : tab === 'city' ? 'City' : 'Nearby'}
                    </span>
                    <ChevronDown className={`h-4 w-4 text-slate-500 ${filtersOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
                  </button>
                  {filtersOpen && (
                    <div className={`${card} p-4`}>
                      <NearbyFilters places={places} placeId={placeId} onPlace={setPlaceId} radiusKm={radiusKm} onRadius={setRadiusKm} tab={tab} onTab={setTab} query={query} onQuery={setQuery} />
                    </div>
                  )}
                  {items.length > 0 ? (
                    <CameraChips items={items} selectedId={selectedId} onSelect={setSelectedId} onAdd={() => setWizardOpen(true)} />
                  ) : (
                    <EmptyState icon={Video} title={tab === 'mine' ? 'No cameras of your own yet' : 'No cameras in this radius'} hint={tab === 'mine' ? 'Add a stream or snapshot URL and the AI starts watching it.' : 'Try a larger radius or the City tab.'} action={tab === 'mine' ? { label: 'Add your first camera', onClick: () => setWizardOpen(true) } : undefined} />
                  )}
                </div>

                {/* CENTRE: the feed */}
                <section className="min-w-0 space-y-3" aria-label="Camera feed">
                  {selected ? (
                    <>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <ViewToggle value={view} onChange={setView} />
                        {view === 'focus' && selected.online && <OverlayToggles value={overlays} onChange={setOverlays} />}
                      </div>
                      {view === 'focus' ? (
                        <>
                          <FeedHeader camera={selected} distanceKm={selectedDistance} />
                          <div className={`${card} p-2`}>
                            <FeedViewer camera={selected} tag={camTag(state.cameras, selected.id)} useScene={state.usingMock} overlays={overlays} onRetry={() => void visionActions.analyzeNow(selected.id).catch(() => undefined)} />
                          </div>
                          <CaptureStrip camera={selected} />
                          <div className="hidden lg:block"><CameraStrip cameras={visible} allCameras={state.cameras} selectedId={selectedId} useScene={state.usingMock} onSelect={setSelectedId} /></div>
                        </>
                      ) : (
                        <CameraGrid cameras={visible} allCameras={state.cameras} useScene={state.usingMock} overlays={overlays} selectedId={selectedId} onSelect={setSelectedId} />
                      )}
                    </>
                  ) : (
                    <EmptyState icon={Video} title="Select a camera" hint="Pick a camera from the list to see its live analysis." />
                  )}
                </section>

                {/* RIGHT: analysis */}
                <aside className="min-w-0 space-y-3" aria-label="AI analysis">
                  {selected && (
                    <AnalysisColumn
                      camera={selected}
                      distanceKm={selectedDistance}
                      history={state.history[selected.id] ?? []}
                      alerts={state.alerts}
                      onShowMap={() => showOnMap(selected.id)}
                      onRemove={async () => { await visionActions.removeCamera(selected.id); }}
                    />
                  )}
                </aside>
              </div>
            </div>
          )}
        </main>
        <BottomNav />
      </div>

      <AlertToast alert={state.unseen[0]} onOpen={openAlert} onDismiss={dismissAlert} />
      <AddCameraWizard open={wizardOpen} onClose={() => setWizardOpen(false)} onSaved={(id) => { setTab('mine'); setSelectedId(id); }} origin={origin} offlineDemo={state.usingMock} gpsAvailable={Boolean(gps)} />
    </div>
  );
}
