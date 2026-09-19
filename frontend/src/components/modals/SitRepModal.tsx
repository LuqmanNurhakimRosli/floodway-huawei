import React, { useState } from 'react';
import { X, Copy, Check, Download, FileText } from 'lucide-react';
import { DisasterScenario } from '../../types';

interface SitRepModalProps {
  scenario: DisasterScenario;
  isOpen: boolean;
  onClose: () => void;
}

export const SitRepModal: React.FC<SitRepModalProps> = ({ scenario, isOpen, onClose }) => {
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const sitrepText = `===============================================================
GEO-RESQ AUTONOMOUS SITUATION REPORT (SITREP) - LEVEL 3
INCIDENT: ${scenario.name.toUpperCase()}
SUBTITLE: ${scenario.subtitle}
LOCATION: ${scenario.location}, ${scenario.country}
TIMESTAMP: ${new Date().toISOString()}
DATA LATENCY: ${scenario.stats.dataLatencyHours} hours
===============================================================

1. EXECUTIVE ASSESSMENT
-----------------------
- Monitored Area of Interest (AOI): ${scenario.stats.aoiAreaKm2} km²
- Inundated Hazard Footprint:       ${scenario.stats.floodAreaKm2} km²
- Damaged Structures Identified:    ${scenario.stats.damagedStructuresCount}
  * Destroyed / Collapsed:          ${scenario.stats.destroyedCount}
  * Major Structural Compromise:    ${scenario.stats.majorDamageCount}
  * Minor Inundation / Affected:    ${scenario.stats.minorDamageCount}
- Impassable Road Network Links:    ${scenario.stats.impassableRoadsCount}
- Monitored Critical Facilities:    ${scenario.criticalFacilities.length}

2. EARTH OBSERVATION & SENSOR PROVENANCE
----------------------------------------
- Satellite Sensor:     ${scenario.sensor}
- Last Acquisition Pass: ${scenario.lastSatellitePass}
- Inference Model:       ${scenario.processingModel}
- Overall AI Confidence: ${Math.round(scenario.stats.overallConfidence * 100)}%

3. CRITICAL FACILITIES STATUS
-----------------------------
${scenario.criticalFacilities.map(f => `* [${f.status.toUpperCase()}] ${f.name}
  - Details: ${f.details}
  ${f.capacity ? `- Capacity: ${f.capacity}` : ''}`).join('\n')}

4. CANDIDATE RESCUE CORRIDORS
-----------------------------
${scenario.candidateRoutes.map(r => `* ${r.title}
  - Status: ${r.status.toUpperCase()} | Risk: ${r.riskLevel} | Confidence: ${Math.round(r.confidence * 100)}%
  - Distance: ${r.distanceKm} km | ETA: ${r.estTimeMin > 0 ? `${r.estTimeMin} min` : 'BLOCKED'}
  - Operational Reason: ${r.reason}`).join('\n')}

5. SYSTEM NOTICE
----------------
GEO-RESQ is an autonomous decision-support system. All outputs are derived
from Earth observation and geospatial models and must be validated through
on-site reconnaissance prior to tactical life-safety operations.
[SIMULATION DEMO DATASET - PHASE 1]
===============================================================`;

  const handleCopy = () => {
    navigator.clipboard.writeText(sitrepText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([sitrepText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `GEO-RESQ_SITREP_${scenario.id}_${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-[6px] select-none">
      <div className="bg-geo-panel border border-geo-border-strong w-full max-w-2xl rounded-xl shadow-modal overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-3.5 px-4 border-b border-geo-divider flex items-center justify-between bg-geo-surface-1">
          <div className="flex items-center gap-2 text-geo-text-primary font-semibold text-xs tracking-wider uppercase">
            <FileText className="w-4 h-4 text-geo-accent" />
            <span>Operational Situation Report (SITREP)</span>
          </div>
          <button
            onClick={onClose}
            className="text-geo-text-tertiary hover:text-geo-text-primary p-1 rounded-md hover:bg-geo-surface-2 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 overflow-y-auto flex-1 bg-geo-canvas/50 font-mono text-xs">
          <pre className="text-geo-text-secondary font-mono whitespace-pre-wrap select-text leading-relaxed bg-geo-surface-1 p-3.5 rounded-lg border border-geo-border">
            {sitrepText}
          </pre>
        </div>

        {/* Modal Footer */}
        <div className="p-3 px-4 border-t border-geo-divider flex items-center justify-between bg-geo-surface-1">
          <span className="text-[10px] text-geo-text-tertiary">
            Export formatted for tactical briefing & command handoff
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-geo-surface-1 hover:bg-geo-surface-2 text-geo-text-secondary hover:text-geo-text-primary border border-geo-border text-xs font-mono font-medium transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-geo-success" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Text'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-geo-accent hover:bg-geo-accent-hover text-geo-canvas text-xs font-mono font-semibold transition-colors active:scale-[0.98]"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Report</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
