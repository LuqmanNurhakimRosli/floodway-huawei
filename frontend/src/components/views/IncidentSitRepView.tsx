import React, { useState } from 'react';
import { 
  FileText, 
  Clock, 
  Radio, 
  CheckCircle2, 
  Send
} from 'lucide-react';
import { DisasterScenario } from '../../types';

interface IncidentSitRepViewProps {
  scenario: DisasterScenario;
  onOpenSitRepModal: () => void;
  onReturnToCommandMap?: () => void;
}

export const IncidentSitRepView: React.FC<IncidentSitRepViewProps> = ({
  scenario,
  onOpenSitRepModal,
  onReturnToCommandMap,
}) => {
  const [capSent, setCapSent] = useState<boolean>(false);

  const handleBroadcastCap = () => {
    setCapSent(true);
    setTimeout(() => setCapSent(false), 5000);
  };

  const auditLogs = [
    { time: '18 Sep 22:35 UTC', level: 'ALERT', message: 'Station #RB-042 water rise rate exceeds +0.48 m/hr. Critical flash flood threshold breached.' },
    { time: '18 Sep 22:30 UTC', level: 'SUCCESS', message: 'NetworkX graph recalculated. Corridor Alpha (Jalan Semenyih) flagged as preferred lower-exposure route.' },
    { time: '18 Sep 22:20 UTC', level: 'ALERT', message: 'Sentinel-1 SAR coherency anomaly confirms Jambatan Reko bridge overtopped by ~1.4m. Status set to IMPASSABLE.' },
    { time: '18 Sep 22:15 UTC', level: 'INFO', message: 'Sentinel-1 C-SAR pass ingested via Huawei OBS. Siamese U-Net inference initiated on Ascend 910 cluster.' },
    { time: '18 Sep 21:45 UTC', level: 'SUCCESS', message: 'Forward Command Post deployed at Stadium Kajang. 15 amphibious units standing by on VHF Ch 04.' },
    { time: '18 Sep 20:00 UTC', level: 'INFO', message: 'Monsoon surge alert issued for Hulu Langat riparian basin. 4 relief shelters placed on standby.' },
  ];

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-geo-canvas text-geo-text-primary p-3 sm:p-6 space-y-6 select-none pb-28 md:pb-6">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-geo-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-geo-surface-2 text-geo-text-tertiary border border-geo-border uppercase">
              Module 6 • Incident Command & Compliance
            </span>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 uppercase">
              Simulation Log
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-geo-text-primary mt-1.5">
            Incident Command Center & Automated SITREP
          </h1>
          <p className="text-xs text-geo-text-secondary mt-0.5">
            Mission audit trail, Common Alerting Protocol (CAP v1.2) broadcasts, and automated national situation report generation.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {onReturnToCommandMap && (
            <button
              onClick={onReturnToCommandMap}
              className="h-8 px-3 text-xs font-semibold rounded-md bg-geo-surface-1 hover:bg-geo-surface-2 border border-geo-border text-geo-text-primary transition-colors"
            >
              View on Map
            </button>
          )}
          <button
            onClick={onOpenSitRepModal}
            className="h-8 px-3.5 rounded-lg bg-geo-accent hover:bg-geo-accent-hover text-white text-xs font-semibold flex items-center gap-2 shadow-sm transition-colors"
          >
            <FileText className="w-4 h-4" />
            Compile National SITREP
          </button>
        </div>
      </div>

      {/* 2. Grid: Audit Log & CAP Alert Composer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Live Chronological Mission Audit Log (7 cols) */}
        <div className="lg:col-span-7 p-5 rounded-xl border border-geo-border bg-geo-panel shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-geo-border">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-geo-accent" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-geo-text-primary">
                Live Incident Timeline & Mission Audit Trail
              </h2>
            </div>
            <span className="text-[10px] font-mono text-geo-text-tertiary">
              {auditLogs.length} Events Logged
            </span>
          </div>

          <div className="space-y-3 divide-y divide-geo-border overflow-y-auto max-h-[480px]">
            {auditLogs.map((log, idx) => {
              let badgeColor = 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30';
              if (log.level === 'ALERT') badgeColor = 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30';
              else if (log.level === 'SUCCESS') badgeColor = 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30';

              return (
                <div key={idx} className="pt-3 first:pt-0 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] text-geo-text-tertiary">{log.time}</span>
                    <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold border ${badgeColor}`}>
                      {log.level}
                    </span>
                  </div>
                  <p className="text-geo-text-secondary leading-relaxed">
                    {log.message}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: CAP v1.2 Broadcast & SITREP Card (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* CAP Broadcast Card */}
          <div className="p-5 rounded-xl border border-rose-500/30 bg-geo-panel shadow-sm space-y-3 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-geo-border">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-rose-600" />
                <h3 className="font-bold text-xs uppercase tracking-wider text-geo-text-primary">
                  Common Alerting Protocol (CAP)
                </h3>
              </div>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-rose-600 text-white font-bold uppercase">
                National EOC
              </span>
            </div>

            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 space-y-1.5">
              <strong className="text-rose-700 dark:text-rose-300 font-bold block">
                CRITICAL FLASH FLOOD WARNING (LEVEL 3)
              </strong>
              <p className="text-geo-text-secondary leading-relaxed text-[11px]">
                Riverside Basin: Immediate evacuation required. Water rise exceeding 0.48 m/hr. Proceed along designated North Ridge Bypass (Jalan Semenyih corridor).
              </p>
              <div className="text-[10px] text-geo-text-tertiary pt-1">
                Recipients: District Authorities (NADMA), Civil Defence Command (Bomba/APM), Public Mobile Broadcast.
              </div>
            </div>

            {capSent ? (
              <div className="p-2.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-2 text-xs">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                CAP broadcast transmitted to simulated distribution channels.
              </div>
            ) : (
              <button
                onClick={handleBroadcastCap}
                className="w-full py-2.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-2 active:scale-98 transition-transform"
              >
                <Send className="w-3.5 h-3.5" />
                Broadcast to All 3 Channels
              </button>
            )}
          </div>

          {/* Automated SITREP Card */}
          <div className="p-5 rounded-xl border border-geo-border bg-geo-panel shadow-sm space-y-3 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-geo-border">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-geo-accent" />
                <h3 className="font-bold text-xs uppercase tracking-wider text-geo-text-primary">
                  Automated Situation Report
                </h3>
              </div>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-bold uppercase border border-emerald-500/30">
                Auto-Compiled
              </span>
            </div>

            <p className="text-geo-text-secondary leading-relaxed text-[11px]">
              National Tactical SITREP for <strong>{scenario.name}</strong> compiled directly from Sentinel-1 SAR change detections, OSM road status, and active rescue convoy telemetry.
            </p>

            <button
              onClick={onOpenSitRepModal}
              className="w-full py-2.5 rounded-lg bg-geo-surface-1 hover:bg-geo-surface-2 border border-geo-border text-geo-text-primary font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
            >
              <FileText className="w-4 h-4 text-geo-accent" />
              Preview & Export SITREP (PDF)
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
