import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, Marker, Polyline, Popup, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Navigation, Siren } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { useAuth } from '../../contexts/AuthContext';
import { dispatchArrivalCheckin, type TelegramResult } from '../../services/telegramService';
import { VisionHazardLayer } from './VisionHazardLayer';
import { FloodProneLayer, floodedZones } from './FloodProneLayer';
import { VerifiedReportLayer } from './VerifiedReportLayer';
import { BottomSheet, type Snap } from './BottomSheet';
import { MapPanel, type ShelterFilter } from './MapPanel';
import { NavigationHud } from './NavigationHud';
import { ArrivalDialog } from './ArrivalDialog';
import { createShelterIcon, gpsNavIcon } from './mapIcons';
import { BarrierLayer } from './BarrierLayer';
import { BaseMap } from './BaseMap';
import { ORIGINS } from '../../data/klDemo';
import { YOU_ID } from '../../data/familyDemo';
import { formatCapacity, formatMin } from '../../lib/format';
import type { TravelMode } from '../../lib/mappers';
import { nearestOriginId, placeAt, riskAt, sinceText, type Place } from '../../lib/family';
import { etaMin, lineLengthM, pointAtDistance, rankRoutes, stepAt, toRoadRoute, type LatLon, type ScoredRoute } from '../../lib/routing';
import { useVisionHazards } from '../../hooks/vision/useVisionHazards';
import { useVisionStore } from '../../hooks/vision/useVisionStore';
import { circleMembers, familyActions, useFamily, useFloodZones } from '../../hooks/useFamily';
import { closedBarrierZones } from '../../lib/vision/barriers';
import { useDriveSim } from '../../hooks/useDriveSim';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { useNow } from '../../hooks/useNow';
import { FamilyBody, FamilyHeader, type FamilyTab } from '../family/FamilyPanel';
import { memberIcon } from '../family/memberIcon';
import { CheckInDialog, SosDialog } from '../family/FamilyDialogs';
import { LayersDialog, MapActionPills, MapSideButtons, MapTopBar, SharingDialog } from '../family/MapChrome';

type RoutesDb = Record<string, Parameters<typeof toRoadRoute>[0][]>;

/** Length of the simulated drive on screen, whatever the real route length. Adjusted to 5s demo. */
const DRIVE_MS = 5000;
const KL_CENTER: LatLon = [3.155, 101.69];
const PEEK_PX = 150;

/** Captures the Leaflet map instance for external zoom/pan controls. */
function MapController({ onMap }: { onMap: (map: L.Map) => void }) {
  const map = useMap();
  useEffect(() => {
    onMap(map);
  }, [map, onMap]);
  return null;
}

/** Fits the chosen route in the visible part of the map. Only fits once when route changes, preserving user manual zoom/pan. */
function FitRoute({ line, bottomPad, enabled }: { line: LatLon[] | null; bottomPad: number; enabled: boolean }) {
  const map = useMap();
  const lastKeyRef = useRef<string>('');
  const lastEnabledRef = useRef(false);
  const key = line ? `${line[0]}|${line[line.length - 1]}|${line.length}` : '';

  useEffect(() => {
    if (!line || !enabled) {
      lastEnabledRef.current = enabled;
      return;
    }
    const becameEnabled = enabled && !lastEnabledRef.current;
    const keyChanged = key !== lastKeyRef.current;
    lastEnabledRef.current = enabled;

    if (keyChanged || becameEnabled) {
      lastKeyRef.current = key;
      map.fitBounds(L.latLngBounds(line), {
        paddingTopLeft: [32, 120],
        paddingBottomRight: [32, bottomPad + 24],
        maxZoom: 16,
        animate: true,
      });
    }
  }, [key, bottomPad, enabled, line, map]);

  return null;
}

/** Moves the map when a member, place or "centre on me" is picked. `key` changes on every request. */
function FlyTo({ target, bottomPad }: { target: { pos: LatLon; zoom: number; key: number } | null; bottomPad: number }) {
  const map = useMap();
  useEffect(() => {
    if (!target) return;
    // keep the point in the visible band above the sheet
    const p = map.project(target.pos, target.zoom).add([0, bottomPad / 2 - 40]);
    map.flyTo(map.unproject(p, target.zoom), target.zoom, { duration: 0.6 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target?.key, map]);
  return null;
}

/** Fits everyone in the circle once, when the circle changes. */
function FitCircle({ points, circleId, bottomPad, ready }: { points: LatLon[]; circleId: string; bottomPad: number; ready: boolean }) {
  const map = useMap();
  const done = useRef('');
  useEffect(() => {
    if (!ready || done.current === circleId || points.length === 0) return;
    done.current = circleId;
    map.fitBounds(L.latLngBounds(points), { paddingTopLeft: [36, 150], paddingBottomRight: [72, bottomPad + 80], maxZoom: 14, animate: false });
  }, [ready, circleId, points, bottomPad, map]);
  return null;
}

function FollowCar({
  pos,
  active,
  userPanned,
  onUserPan,
}: {
  pos: LatLon | null;
  active: boolean;
  userPanned: boolean;
  onUserPan: () => void;
}) {
  const map = useMap();
  const startedRef = useRef(false);
  const isZoomingRef = useRef(false);

  // Detect when user manually drags or touches the map to pan away, or when zoom starts/ends
  useEffect(() => {
    if (!active) {
      startedRef.current = false;
      return;
    }

    const handleDragStart = () => {
      onUserPan();
    };
    const onZoomStart = () => {
      isZoomingRef.current = true;
    };
    const onZoomEnd = () => {
      isZoomingRef.current = false;
    };

    map.on('dragstart', handleDragStart);
    map.on('zoomstart', onZoomStart);
    map.on('zoomend', onZoomEnd);
    return () => {
      map.off('dragstart', handleDragStart);
      map.off('zoomstart', onZoomStart);
      map.off('zoomend', onZoomEnd);
    };
  }, [active, map, onUserPan]);

  useEffect(() => {
    if (!active || !pos) return;

    if (!startedRef.current) {
      startedRef.current = true;
      // Initial zoom in to navigation focus
      map.flyTo(pos, 16, { duration: 0.5 });
      return;
    }

    // Only pan to vehicle if user hasn't panned away to explore and isn't actively zooming
    // Uses panTo with animate: false to preserve zoom level and avoid blocking input gestures
    if (!userPanned && !isZoomingRef.current) {
      map.panTo(pos, { animate: false });
    }
  }, [pos, active, userPanned, map]);

  return null;
}

/**
 * The map: a family-locator view (where your circle is, who is near flooding, check in, SOS) with the evacuation route
 * planner as one of its tabs. Phones get a full-screen map with a three-height sheet; wider screens a side panel.
 */
export function ShelterMapView() {
  const navigate = useNavigate();
  const { shelters, floodScenario, reports } = useApp();
  const { user } = useAuth();
  const family = useFamily();
  const zones = useFloodZones();
  const now = useNow(15000);

  const desktop = useMediaQuery('(min-width: 768px)');
  const [tab, setTab] = useState<FamilyTab>('people');
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [routeFor, setRouteFor] = useState<string | null>(null);
  const [dialog, setDialog] = useState<'sos' | 'checkin' | 'sharing' | 'layers' | null>(null);
  const [seenAt, setSeenAt] = useState(() => Date.now());
  const [fly, setFly] = useState<{ pos: LatLon; zoom: number; key: number } | null>(null);

  const [selectedId, setSelectedId] = useState('shelter-01');
  const [filter, setFilter] = useState<ShelterFilter>('all');
  const [mode, setMode] = useState<TravelMode>('car');
  const [chosen, setChosen] = useState(0);
  const [snap, setSnap] = useState<Snap>('half');
  const [sheetH, setSheetH] = useState(0);
  const [routesDb, setRoutesDb] = useState<RoutesDb | null>(null);
  const [arrival, setArrival] = useState<{ when: string; telegram: TelegramResult | null } | null>(null);
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);
  const [userPanned, setUserPanned] = useState(false);

  const members = circleMembers(family);
  const you = family.members[YOU_ID];
  const circle = family.circles.find((c) => c.id === family.circleId) ?? family.circles[0];
  const unread = family.events.filter((e) => e.at > seenAt).length;
  const bottomPad = desktop ? 0 : sheetH;

  const flyTo = (pos: LatLon, zoom = 15) => setFly({ pos, zoom, key: Date.now() });
  const openTab = (t: FamilyTab) => {
    setTab(t);
    if (t === 'activity') setSeenAt(Date.now());
    if (!desktop && snap === 'peek') setSnap('half');
  };

  // The road routes are a 170 kB data file: load it after the first paint.
  useEffect(() => {
    let live = true;
    import('../../data/klRoutes.json').then((m) => live && setRoutesDb((m.default as unknown as { routes: RoutesDb }).routes));
    return () => {
      live = false;
    };
  }, []);

  const selected = shelters.find((s) => s.id === selectedId) ?? shelters[0];
  const routeMember = (routeFor && family.members[routeFor]) || you;
  const originId = nearestOriginId([routeMember.lat, routeMember.lon]);
  const origin = ORIGINS.find((o) => o.id === originId)!;

  const cameraHazards = useVisionHazards();
  const { barriers } = useVisionStore();
  const closures = useMemo(() => closedBarrierZones(barriers), [barriers]);
  const closedBarriers = useMemo(() => barriers.filter((b) => b.state === 'CLOSED'), [barriers]);

  const rankedFor = useCallback(
    (shelterId: string): ScoredRoute[] => {
      const raw = routesDb?.[`${originId}|${shelterId}`];
      return raw ? rankRoutes(raw.map(toRoadRoute), zones, closures) : [];
    },
    [routesDb, originId, zones, closures],
  );
  const alternatives = useMemo(() => (selected ? rankedFor(selected.id) : []), [rankedFor, selected]);
  const best = useMemo(() => Object.fromEntries(shelters.map((s) => [s.id, rankedFor(s.id)[0] ?? null])), [shelters, rankedFor]);

  useEffect(() => setChosen(0), [selectedId, originId, floodScenario]);
  const route: ScoredRoute | null = alternatives[Math.min(chosen, alternatives.length - 1)] ?? null;
  const showRoute = tab === 'route';

  const lineLen = useMemo(() => (route ? lineLengthM(route.line) : 0), [route]);
  const speedup = route ? route.durationS / (DRIVE_MS / 1000) : 1;
  const onArrive = useCallback(() => {
    if (!route || !selected) return;
    const d = new Date();
    const date = d.toLocaleDateString('en-MY', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
    const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const name = selected.name.replace('Demo relief centre: ', '');
    if (!routeFor) familyActions.checkIn(`${name} (end of the demo drive)`);
    setArrival({ when: `${date} · ${time}`, telegram: null });
    dispatchArrivalCheckin({ userName: user?.name || 'Demo user', shelterName: selected.name, dateStr: date, timeStr: time })
      .then((telegram) => setArrival((a) => (a ? { ...a, telegram } : a)))
      .catch(() => setArrival((a) => (a ? { ...a, telegram: { success: false } } : a)));
  }, [route, selected, routeFor, user?.name]);
  const sim = useDriveSim(DRIVE_MS, onArrive);

  const travelled = route ? sim.progress * route.distanceM : 0;
  const car = useMemo(() => (route && sim.active ? pointAtDistance(route.line, sim.progress * lineLen).pos : null), [route, sim.active, sim.progress, lineLen]);
  const step = route && sim.active ? stepAt(route, travelled) : null;
  const nextText = step ? (step.next ? `${step.next.text}` : 'Arrive at the relief centre') : '';

  const handleZoomIn = useCallback(() => {
    mapInstance?.zoomIn();
  }, [mapInstance]);

  const handleZoomOut = useCallback(() => {
    mapInstance?.zoomOut();
  }, [mapInstance]);

  const handleRecenter = useCallback(() => {
    setUserPanned(false);
    if (car && mapInstance) {
      mapInstance.flyTo(car, Math.max(16, mapInstance.getZoom()), { duration: 0.4 });
    }
  }, [car, mapInstance]);

  const start = () => {
    if (!route || route.blockedBy.length > 0 || !selected || selected.status === 'FULL' || selected.status === 'CLOSED') return;
    setUserPanned(false);
    setSnap('peek');
    setArrival(null);
    sim.start();
  };

  const planRoute = (memberId: string) => {
    sim.stop();
    setUserPanned(false);
    setRouteFor(memberId === YOU_ID ? null : memberId);
    openTab('route');
  };

  const selectMember = (id: string) => {
    const m = family.members[id];
    setSelectedMember((cur) => (cur === id ? null : id));
    if (m) flyTo([m.lat, m.lon]);
  };

  const focusPlace = (p: Place) => flyTo([p.lat, p.lon], 16);

  const panel = (
    <MapPanel
      fromLabel={routeFor ? `Route for ${routeMember.name}` : 'Your route'}
      originLabel={origin.label}
      onClearFrom={routeFor ? () => setRouteFor(null) : undefined}
      floodedCount={floodedZones(floodScenario).length}
      cameraZoneCount={cameraHazards.length}
      reportAreaCount={zones.filter((z) => z.id.startsWith('rep-')).length}
      closedBarriers={closedBarriers}
      shelters={shelters}
      best={best}
      selectedId={selected?.id ?? ''}
      onSelect={(id) => {
        sim.stop();
        setUserPanned(false);
        setSelectedId(id);
      }}
      filter={filter}
      onFilter={setFilter}
      mode={mode}
      onMode={setMode}
      alternatives={alternatives}
      chosen={Math.min(chosen, Math.max(0, alternatives.length - 1))}
      onChoose={(i) => {
        sim.stop();
        setUserPanned(false);
        setChosen(i);
      }}
      navigating={sim.active}
      onStart={start}
      routesReady={routesDb !== null}
    />
  );

  const header = <FamilyHeader circleName={circle.name} members={members} zones={zones} tab={tab} onTab={openTab} />;
  const body = (
    <FamilyBody
      tab={tab}
      members={members}
      allMembers={family.members}
      places={family.places}
      events={family.events}
      zones={zones}
      shelters={shelters}
      selectedId={selectedMember}
      onSelect={selectMember}
      onPlanRoute={planRoute}
      onFocusPlace={focusPlace}
      now={now}
      route={panel}
    />
  );

  const memberPoints = useMemo<LatLon[]>(() => members.map((m) => [m.lat, m.lon]), [members]);
  const sosOn = you.status === 'sos';
  const sosOthers = members.filter((m) => !m.isYou && m.status === 'sos');

  return (
    <div className="relative flex h-[calc(100dvh-var(--nav-h))] w-full flex-col overflow-hidden bg-slate-100 md:h-[calc(100vh-64px)] md:flex-row">
      <div className="relative min-h-[350px] flex-1">
        <MapContainer center={KL_CENTER} zoom={12} scrollWheelZoom preferCanvas zoomControl={false} className="z-0 h-full w-full">
          <MapController onMap={setMapInstance} />
          <BaseMap />
          <VisionHazardLayer />
          <FloodProneLayer scenario={floodScenario} />
          <VerifiedReportLayer reports={reports} now={now} />
          <BarrierLayer />
          <FitCircle points={memberPoints} circleId={circle.id} bottomPad={bottomPad} ready={desktop || sheetH > 0} />
          <FitRoute line={showRoute ? (route?.line ?? null) : null} bottomPad={bottomPad} enabled={showRoute && !sim.active} />
          <FlyTo target={fly} bottomPad={bottomPad} />
          <FollowCar pos={car} active={sim.active} userPanned={userPanned} onUserPan={() => setUserPanned(true)} />

          {showRoute &&
            alternatives.map((r, i) =>
              i === chosen ? null : (
                <Polyline key={`alt-${r.index}`} positions={r.line} pathOptions={{ color: '#64748B', weight: 5, opacity: 0.8, dashArray: '8 8' }} eventHandlers={{ click: () => !sim.active && setChosen(i) }} />
              ),
            )}
          {showRoute && route && (
            <>
              <Polyline positions={route.line} pathOptions={{ color: '#FFFFFF', weight: 10, opacity: 0.9 }} />
              <Polyline positions={route.line} pathOptions={{ color: '#1677FF', weight: 6, opacity: 0.95 }} />
            </>
          )}
          {car && <Marker position={car} icon={gpsNavIcon} />}

          {shelters.map((s) => (
            <Marker
              key={s.id}
              position={[s.lat, s.lon]}
              icon={createShelterIcon(showRoute && s.id === selected?.id, s.status)}
              eventHandlers={{
                click: () => {
                  if (sim.active) return;
                  setSelectedId(s.id);
                  openTab('route');
                },
              }}
            >
              <Popup>
                <div className="p-1 text-xs">
                  <b className="block text-slate-900">{s.name}</b>
                  <span className="block font-semibold text-slate-700">
                    {s.status} · {formatCapacity(s.currentCapacity, s.maxCapacity)}
                  </span>
                  <span className="mt-1 block font-semibold text-slate-600">Demo relief centre, not an official register.</span>
                </div>
              </Popup>
            </Marker>
          ))}

          {!car &&
            members.map((m) => {
              const risk = riskAt([m.lat, m.lon], zones).risk;
              const sel = m.id === selectedMember;
              const where = placeAt([m.lat, m.lon], family.places);
              const tip = (m.speedKmh ?? 0) > 3 ? `Driving · ${m.speedKmh} km/h` : `${where ? `At ${where.name} · ` : ''}${m.since ? sinceText(m.since, now) : 'Just now'}`;
              return (
                <Marker key={m.id} position={[m.lat, m.lon]} icon={memberIcon(m, risk, sel)} zIndexOffset={m.status === 'sos' ? 1000 : sel ? 900 : m.isYou ? 500 : 0} eventHandlers={{ click: () => selectMember(m.id) }} keyboard>
                  {sel && (
                    <Tooltip permanent direction="top" offset={[0, -4]} className="fw-member-tip">
                      {tip}
                    </Tooltip>
                  )}
                </Marker>
              );
            })}
        </MapContainer>

        {!sim.active && (
          <MapTopBar circles={family.circles} circleId={family.circleId} unread={unread} onSettings={() => setDialog('sharing')} onActivity={() => openTab('activity')} onLayers={() => setDialog('layers')} />
        )}

        {(sosOn || sosOthers.length > 0) && !sim.active && (
          <div role="alert" className="absolute inset-x-3 top-[calc(max(0.75rem,env(safe-area-inset-top))+6.5rem)] z-[690] mx-auto flex max-w-md items-center gap-3 rounded-2xl bg-red-600 p-3 text-white shadow-xl md:top-28">
            <Siren className="h-6 w-6 shrink-0 animate-pulse motion-reduce:animate-none" aria-hidden="true" />
            <p className="min-w-0 flex-1 text-sm/5 font-semibold">
              {sosOn ? 'Your SOS is on. Your circle can see where you are.' : `${sosOthers.map((m) => m.name).join(', ')} sent an SOS.`}
            </p>
            {sosOn && (
              <button type="button" onClick={() => setDialog('sos')} className="min-h-11 shrink-0 rounded-xl bg-white px-3 text-xs font-bold text-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-red-600">
                Manage
              </button>
            )}
          </div>
        )}

        {(desktop || snap !== 'full' || sim.active) && (
          <>
            {!sim.active && (
              <MapActionPills bottom={bottomPad} sosOn={sosOn} onCheckIn={() => setDialog('checkin')} onSos={() => setDialog('sos')} />
            )}
            <MapSideButtons
              bottom={bottomPad + (sim.active ? 10 : 60)}
              onLocate={() => {
                if (sim.active && car) {
                  handleRecenter();
                } else {
                  flyTo([you.lat, you.lon], 15);
                  setSelectedMember(YOU_ID);
                }
              }}
              onLayers={() => setDialog('layers')}
              onZoomIn={handleZoomIn}
              onZoomOut={handleZoomOut}
              isNavigating={sim.active}
              onRecenter={handleRecenter}
              showRecenter={userPanned}
            />
          </>
        )}

        {sim.active && step && route && (
          <NavigationHud
            instruction={nextText}
            toNextM={step.toNextM}
            remainingM={Math.max(0, route.distanceM - travelled)}
            remainingMin={Math.max(0, etaMin(route, mode) * (1 - sim.progress))}
            progress={sim.progress}
            speedup={speedup}
            onCancel={() => {
              sim.stop();
              setUserPanned(false);
            }}
          />
        )}

        {arrival && selected && (
          <ArrivalDialog
            shelterName={selected.name.replace('Demo relief centre: ', '')}
            capacity={formatCapacity(selected.currentCapacity, selected.maxCapacity)}
            when={arrival.when}
            telegram={arrival.telegram}
            onClose={() => setArrival(null)}
            onReports={() => navigate('/reports')}
          />
        )}

        {!desktop && (
          <BottomSheet snap={snap} onSnapChange={setSnap} header={sim.active && route ? <DrivingHeader name={selected?.name ?? ''} onStop={sim.stop} min={etaMin(route, mode) * (1 - sim.progress)} /> : header} onHeight={setSheetH} peekPx={sim.active ? 92 : PEEK_PX} label={`${circle.name} circle`}>
            {body}
          </BottomSheet>
        )}
      </div>

      {desktop && (
        <aside aria-label={`${circle.name} circle`} className="z-20 flex h-full w-[360px] shrink-0 flex-col border-l border-slate-200 bg-[#F7F9FC] shadow-2xl lg:w-[420px] xl:w-[460px]">
          <div className="shrink-0 border-b border-slate-200/70 p-4">{header}</div>
          <div className="min-h-0 flex-1 overflow-y-auto">{body}</div>
        </aside>
      )}

      {dialog === 'sos' && <SosDialog you={you} shelters={shelters} onClose={() => setDialog(null)} />}
      {dialog === 'checkin' && <CheckInDialog you={you} places={family.places} onClose={() => setDialog(null)} />}
      {dialog === 'sharing' && <SharingDialog state={family} onClose={() => setDialog(null)} />}
      {dialog === 'layers' && <LayersDialog onClose={() => setDialog(null)} />}
    </div>
  );
}

function DrivingHeader({ name, min, onStop }: { name: string; min: number; onStop: () => void }) {
  return (
    <div className="flex items-center gap-2">
      <Navigation className="h-5 w-5 shrink-0 text-[#0958D9]" aria-hidden="true" />
      <p className="min-w-0 flex-1 truncate text-sm font-bold text-slate-900">
        {name.replace('Demo relief centre: ', '')} · ~{formatMin(Math.max(0, min))}
      </p>
      <button type="button" onClick={onStop} className="min-h-11 shrink-0 rounded-xl bg-red-600 px-3.5 text-xs font-bold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-red-700">
        Stop
      </button>
    </div>
  );
}
