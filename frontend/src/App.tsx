import React, { useState, useEffect } from 'react';
import { Header } from './components/layout/Header';
import { LeftLayerPanel } from './components/layout/LeftLayerPanel';
import { RightAnalysisPanel } from './components/layout/RightAnalysisPanel';
import { BottomEventSummary } from './components/layout/BottomEventSummary';
import { MapView } from './components/map/MapView';
import { SitRepModal } from './components/modals/SitRepModal';
import { FeatureDetailDrawer, InspectableFeature } from './components/layout/FeatureDetailDrawer';

// Specialized Operational Views
import { ExecutiveCommandView } from './components/views/ExecutiveCommandView';
import { SatelliteDamageView } from './components/views/SatelliteDamageView';
import { RoutePlannerView } from './components/views/RoutePlannerView';
import { GovernmentAnalyticsView } from './components/views/GovernmentAnalyticsView';
import { IncidentSitRepView } from './components/views/IncidentSitRepView';
import { EvacuationNavigatorView } from './components/views/EvacuationNavigatorView';
import { DamageRegistryView } from './components/views/DamageRegistryView';
import { AlertDispatchView } from './components/views/AlertDispatchView';

// Desktop & Mobile Navigation Components
import { DashboardSidebar, MainAppView } from './components/desktop/DashboardSidebar';
import { MobileHeader } from './components/mobile/MobileHeader';
import { MobileNavBar } from './components/mobile/MobileNavBar';
import { QuickSosModal } from './components/mobile/QuickSosButton';
import { BottomSheetDrawer } from './components/mobile/BottomSheetDrawer';

// Responsive & Operational Hooks
import { useDeviceType } from './hooks/useDeviceType';
import { useUserLocation } from './hooks/useUserLocation';
import { useOfflineStatus } from './hooks/useOfflineStatus';

import { MOCK_SCENARIOS } from './data/mockScenarios';
import { DisasterScenario, MapLayer, CriticalFacility, RouteAnalysis } from './types';
import { WifiOff } from 'lucide-react';

const INITIAL_LAYERS: MapLayer[] = [
  {
    id: 'flood_extent',
    name: 'Flood Inundation Extent',
    category: 'damage',
    visible: true,
    opacity: 0.85,
    color: '#06b6d4',
    featureCount: 2,
    description: 'Sentinel-1 SAR C-band amplitude anomaly mask',
    badge: 'SAR EO',
  },
  {
    id: 'damage_buildings',
    name: 'Damaged Structures',
    category: 'damage',
    visible: true,
    opacity: 0.9,
    color: '#ef4444',
    featureCount: 142,
    description: 'Siamese U-Net building change & collapse detection',
    badge: 'AI MASK',
  },
  {
    id: 'road_network',
    name: 'OSM Road Accessibility',
    category: 'infrastructure',
    visible: true,
    opacity: 0.85,
    color: '#f59e0b',
    featureCount: 18,
    description: 'OpenStreetMap highway graph intersected with flood contours',
    badge: 'VECTOR',
  },
  {
    id: 'candidate_routes',
    name: 'Candidate Rescue Corridors',
    category: 'routing',
    visible: true,
    opacity: 0.95,
    color: '#10b981',
    featureCount: 3,
    description: 'Multi-criteria least-cost path avoiding water impedance',
    badge: 'ROUTING',
  },
  {
    id: 'critical_facilities',
    name: 'Critical Infrastructure Hubs',
    category: 'infrastructure',
    visible: true,
    opacity: 1.0,
    color: '#38bdf8',
    featureCount: 4,
    description: 'Hospitals, Staging Posts, Bridges, and Evacuation Centres',
    badge: 'POI',
  },
];

export const App: React.FC = () => {
  const [scenarios] = useState<DisasterScenario[]>(MOCK_SCENARIOS);
  const [activeScenario, setActiveScenario] = useState<DisasterScenario>(MOCK_SCENARIOS[0]);
  const [layers, setLayers] = useState<MapLayer[]>(INITIAL_LAYERS);
  
  // Theme management: Executive Light Theme is system default
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('geo-theme') as 'dark' | 'light') || 'light';
  });

  const [activeBasemap, setActiveBasemap] = useState<string>(() => {
    const savedTheme = localStorage.getItem('geo-theme');
    return savedTheme === 'dark' ? 'esri-dark' : 'osm-standard';
  });

  // Active View Controller (Executive Command, Map, AI, Routing, Analytics, SITREP, etc.)
  const [activeView, setActiveView] = useState<MainAppView>('executive');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);

  // Selected features for inspection & camera tracking
  const [selectedFacility, setSelectedFacility] = useState<CriticalFacility | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<RouteAnalysis | null>(null);
  const [inspectFeature, setInspectFeature] = useState<InspectableFeature | null>(null);

  // Map drawers and modals state
  const [leftPanelOpen, setLeftPanelOpen] = useState<boolean>(true);
  const [rightPanelOpen, setRightPanelOpen] = useState<boolean>(true);
  const [sitRepModalOpen, setSitRepModalOpen] = useState<boolean>(false);
  const [sosModalOpen, setSosModalOpen] = useState<boolean>(false);
  const [resetViewTrigger, setResetViewTrigger] = useState<number>(0);

  // Responsive & Sensor Hooks
  const device = useDeviceType();
  const location = useUserLocation(activeScenario.center);
  const network = useOfflineStatus();

  // Apply data-theme and class to document element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
  }, [theme]);

  // Dynamic route synchronization with backend if available
  useEffect(() => {
    const fetchLiveRoutes = async () => {
      try {
        const scenarioKey = activeScenario.id === 'kajang-flood-demo' ? 'kajang_river_surge' : 'valencia_flash_flood';
        const res = await fetch(`http://127.0.0.1:8000/api/routes/${scenarioKey}`);
        if (res.ok) {
          const liveRoutes: RouteAnalysis[] = await res.json();
          if (Array.isArray(liveRoutes) && liveRoutes.length > 0) {
            setActiveScenario((prev) => ({
              ...prev,
              candidateRoutes: liveRoutes,
            }));
          }
        }
      } catch {
        // Fallback to scenario embedded high-density geometry
      }
    };
    fetchLiveRoutes();
  }, [activeScenario.id]);

  const handleToggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('geo-theme', nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    setActiveBasemap(nextTheme === 'light' ? 'osm-standard' : 'esri-dark');
  };

  const handleToggleLayer = (id: string) => {
    setLayers((prev) =>
      prev.map((l) => (l.id === id ? { ...l, visible: !l.visible } : l))
    );
  };

  const handleChangeOpacity = (id: string, opacity: number) => {
    setLayers((prev) =>
      prev.map((l) => (l.id === id ? { ...l, opacity } : l))
    );
  };

  const handleSelectScenario = (scenario: DisasterScenario) => {
    setActiveScenario(scenario);
    setSelectedFacility(null);
    setSelectedRoute(null);
    setInspectFeature(null);
    setResetViewTrigger((prev) => prev + 1);

    setLayers((prev) =>
      prev.map((l) => {
        if (l.id === 'damage_buildings') return { ...l, featureCount: scenario.stats.damagedStructuresCount };
        if (l.id === 'road_network') return { ...l, featureCount: scenario.stats.impassableRoadsCount };
        if (l.id === 'candidate_routes') return { ...l, featureCount: scenario.candidateRoutes.length };
        if (l.id === 'critical_facilities') return { ...l, featureCount: scenario.criticalFacilities.length };
        return l;
      })
    );
  };

  const handleResetView = () => {
    setSelectedFacility(null);
    setSelectedRoute(null);
    setInspectFeature(null);
    setResetViewTrigger((prev) => prev + 1);
  };

  const handleSelectFacility = (fac: CriticalFacility) => {
    setSelectedFacility(fac);
    setSelectedRoute(null);
    setInspectFeature({ type: 'facility', data: fac });
  };

  const handleSelectRoute = (route: RouteAnalysis) => {
    setSelectedRoute(route);
    setSelectedFacility(null);
    setInspectFeature({ type: 'route', data: route });
  };

  const handleSelectInspectFeature = (feature: InspectableFeature) => {
    setInspectFeature(feature);
    if (feature.type === 'facility') {
      setSelectedFacility(feature.data);
      setSelectedRoute(null);
    } else if (feature.type === 'route') {
      setSelectedRoute(feature.data);
      setSelectedFacility(null);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-geo-canvas text-geo-text-primary font-sans antialiased">
      {/* Offline Alert Strip */}
      {network.isOffline && (
        <div className="fixed top-0 left-0 right-0 h-6 bg-amber-600 text-white text-[11px] font-semibold flex items-center justify-center gap-1.5 z-50 shadow-md">
          <WifiOff className="w-3.5 h-3.5" />
          <span>Offline Mode Active • Displaying locally cached scenario telemetry and safe routes</span>
        </div>
      )}

      {/* Desktop / Tablet Sidebar (Hidden on mobile <768px) */}
      {!device.isMobile && (
        <DashboardSidebar
          activeView={activeView}
          onSelectView={setActiveView}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          scenario={activeScenario}
          theme={theme}
          onToggleTheme={handleToggleTheme}
        />
      )}

      {/* Main Workspace Column */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative">
        {/* Mobile Header (Rendered on mobile <768px) */}
        {device.isMobile ? (
          <MobileHeader
            scenarios={scenarios}
            activeScenario={activeScenario}
            onSelectScenario={handleSelectScenario}
            onLocateMe={() => {
              location.refetch();
              setActiveView('map');
            }}
            isLocating={location.status === 'locating'}
            theme={theme}
            onToggleTheme={handleToggleTheme}
          />
        ) : (
          /* Desktop Global Header */
          <Header
            scenarios={scenarios}
            activeScenario={activeScenario}
            onSelectScenario={handleSelectScenario}
            onResetView={handleResetView}
            onOpenSitRepModal={() => setSitRepModalOpen(true)}
            theme={theme}
            onToggleTheme={handleToggleTheme}
            onSelectSearchResult={handleSelectInspectFeature}
            activeView={activeView}
            onToggleLeftPanel={() => setLeftPanelOpen(!leftPanelOpen)}
            onToggleRightPanel={() => setRightPanelOpen(!rightPanelOpen)}
            leftPanelOpen={leftPanelOpen}
            rightPanelOpen={rightPanelOpen}
          />
        )}

        {/* Dynamic View Workspace */}
        <main className="flex-1 relative overflow-hidden flex flex-col">
          {/* View 1: Executive Command */}
          {activeView === 'executive' && (
            <ExecutiveCommandView
              scenario={activeScenario}
              onNavigateView={setActiveView}
              onOpenSitRepModal={() => setSitRepModalOpen(true)}
            />
          )}

          {/* View 2: Tactical Disaster Map (100% GIS Leaflet Canvas) */}
          {activeView === 'map' && (
            <>
              <MapView
                scenario={activeScenario}
                layers={layers}
                activeBasemap={activeBasemap}
                selectedFacility={selectedFacility}
                selectedRoute={selectedRoute}
                resetViewTrigger={resetViewTrigger}
                onSelectFeature={handleSelectInspectFeature}
                userCoords={location.coords}
              />

              {/* Desktop Floating Overlays */}
              {!device.isMobile && (
                <>
                  <LeftLayerPanel
                    layers={layers}
                    onToggleLayer={handleToggleLayer}
                    onChangeOpacity={handleChangeOpacity}
                    activeBasemap={activeBasemap}
                    onSelectBasemap={setActiveBasemap}
                    isOpen={leftPanelOpen}
                    onClose={() => setLeftPanelOpen(false)}
                  />

                  <RightAnalysisPanel
                    scenario={activeScenario}
                    onSelectFacility={handleSelectFacility}
                    onSelectRoute={handleSelectRoute}
                    selectedRouteId={selectedRoute?.id ?? null}
                    selectedFacilityId={selectedFacility?.id ?? null}
                    isOpen={rightPanelOpen}
                    onClose={() => setRightPanelOpen(false)}
                  />

                  <FeatureDetailDrawer
                    feature={inspectFeature}
                    onClose={() => setInspectFeature(null)}
                    onCenterMap={(coords) => {
                      setSelectedFacility({
                        id: 'temp-center',
                        name: 'Selected Coordinate Focus',
                        type: 'staging_base',
                        coordinates: coords,
                        status: 'operational',
                        details: 'Map camera centered on coordinate',
                      });
                    }}
                  />
                </>
              )}

              {/* Mobile Bottom Sheet for Map Inspection */}
              {device.isMobile && inspectFeature && (() => {
                const featData = inspectFeature.type === 'location' ? null : (inspectFeature.data as any);
                const title = inspectFeature.type === 'location' ? inspectFeature.name : featData?.name || featData?.title || 'Selected Feature';
                const badge = featData?.status || 'Active';
                const details = inspectFeature.type === 'location' ? inspectFeature.details : featData?.details || featData?.reason || featData?.notes || 'No extra remarks available.';
                
                return (
                  <BottomSheetDrawer
                    isOpen={Boolean(inspectFeature)}
                    onClose={() => setInspectFeature(null)}
                    title={title}
                    subtitle={inspectFeature.type.toUpperCase()}
                    badge={badge}
                  >
                    <div className="space-y-2 text-xs">
                      <p className="text-geo-text-secondary leading-relaxed">
                        {details}
                      </p>
                    <div className="pt-2 flex gap-2">
                      <button
                        onClick={() => setInspectFeature(null)}
                        className="flex-1 py-2 rounded bg-geo-surface-1 border border-geo-border text-geo-text-primary text-xs font-medium"
                      >
                        Dismiss
                      </button>
                      <button
                        onClick={() => {
                          setActiveView('navigator');
                          setInspectFeature(null);
                        }}
                        className="flex-1 py-2 rounded bg-geo-accent text-white text-xs font-semibold"
                      >
                        Navigate Here
                      </button>
                    </div>
                  </div>
                </BottomSheetDrawer>
              );
            })()}
            </>
          )}

          {/* View 3: Satellite AI Damage */}
          {activeView === 'satellite-ai' && (
            <SatelliteDamageView
              scenario={activeScenario}
              onNavigateToRouting={() => setActiveView('routing')}
              onReturnToCommandMap={() => setActiveView('map')}
            />
          )}

          {/* View 4: Emergency Route Planner */}
          {activeView === 'routing' && (
            <RoutePlannerView
              scenario={activeScenario}
              onSelectRouteOnMap={(r) => {
                handleSelectRoute(r);
                setActiveView('map');
              }}
              onReturnToCommandMap={() => setActiveView('map')}
            />
          )}

          {/* View 5: Government Analytics */}
          {activeView === 'analytics' && (
            <GovernmentAnalyticsView
              scenario={activeScenario}
              onReturnToCommandMap={() => setActiveView('map')}
            />
          )}

          {/* View 6: Incidents & SITREP */}
          {activeView === 'sitrep' && (
            <IncidentSitRepView
              scenario={activeScenario}
              onOpenSitRepModal={() => setSitRepModalOpen(true)}
              onReturnToCommandMap={() => setActiveView('map')}
            />
          )}

          {/* View 7: Field Evacuation GPS (Mobile Waze / Google Maps Style) */}
          {activeView === 'navigator' && (
            <EvacuationNavigatorView
              scenario={activeScenario}
              onReturnToCommandMap={() => setActiveView('map')}
            />
          )}

          {/* View 8: Damage Registry */}
          {activeView === 'registry' && (
            <DamageRegistryView
              scenario={activeScenario}
              onSelectInspectFeature={(f) => {
                handleSelectInspectFeature(f);
                setActiveView('map');
              }}
              onReturnToCommandMap={() => setActiveView('map')}
            />
          )}

          {/* View 9: Alert & Dispatch Coordination */}
          {activeView === 'alerts' && (
            <AlertDispatchView
              scenario={activeScenario}
              onReturnToCommandMap={() => setActiveView('map')}
            />
          )}
        </main>

        {/* Desktop Bottom Event KPI Strip (Hidden on mobile <768px) */}
        {!device.isMobile && activeView === 'map' && (
          <BottomEventSummary scenario={activeScenario} />
        )}

        {/* Mobile Fixed Bottom Navigation Bar (Visible on mobile <768px) */}
        {device.isMobile && (
          <MobileNavBar
            activeView={activeView}
            onSelectView={setActiveView}
            onTriggerSosModal={() => setSosModalOpen(true)}
          />
        )}
      </div>

      {/* Emergency SOS Modal Beacon */}
      <QuickSosModal
        isOpen={sosModalOpen}
        onClose={() => setSosModalOpen(false)}
        scenario={activeScenario}
        userCoords={location.coords}
      />

      {/* Formal Situation Report Modal */}
      <SitRepModal
        scenario={activeScenario}
        isOpen={sitRepModalOpen}
        onClose={() => setSitRepModalOpen(false)}
      />
    </div>
  );
};

export default App;
