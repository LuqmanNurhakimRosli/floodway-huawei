import React, { useState } from 'react';
import { 
  AlertCircle, 
  MapPin, 
  PhoneCall, 
  CheckCircle2, 
  X, 
  Radio
} from 'lucide-react';
import { DisasterScenario } from '../../types';

interface QuickSosButtonProps {
  isOpen: boolean;
  onClose: () => void;
  scenario: DisasterScenario;
  userCoords?: [number, number] | null;
}

export const QuickSosModal: React.FC<QuickSosButtonProps> = ({
  isOpen,
  onClose,
  scenario,
  userCoords,
}) => {
  const [peopleCount, setPeopleCount] = useState<number>(2);
  const [medicalUrgent, setMedicalUrgent] = useState<boolean>(false);
  const [transmitting, setTransmitting] = useState<boolean>(false);
  const [sentSuccess, setSentSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleTransmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTransmitting(true);
    setTimeout(() => {
      setTransmitting(false);
      setSentSuccess(true);
      setTimeout(() => {
        setSentSuccess(false);
        onClose();
      }, 4000);
    }, 1000);
  };

  const displayLat = userCoords ? userCoords[0].toFixed(5) : scenario.center[0].toFixed(5);
  const displayLng = userCoords ? userCoords[1].toFixed(5) : scenario.center[1].toFixed(5);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 z-50 select-none animate-in fade-in duration-150">
      <div className="w-full sm:max-w-md bg-geo-panel border border-geo-border rounded-t-2xl sm:rounded-xl shadow-tactical overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-rose-600 p-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-white">Emergency SOS Assistance</h2>
              <div className="text-[10px] text-rose-100 font-mono">SIMULATION • EOC DISPATCH QUEUE</div>
            </div>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleTransmit} className="p-4 space-y-3.5 text-xs">
          {sentSuccess ? (
            <div className="py-6 text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-emerald-500/15 text-emerald-600 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-sm font-bold text-geo-text-primary">SOS Beacon Transmitted</h3>
              <p className="text-xs text-geo-text-secondary leading-relaxed">
                Your coordinates have been dispatched to the <strong>Kajang Forward Command Staging Base</strong> simulation queue.
              </p>
              <div className="p-2.5 rounded bg-geo-surface-1 border border-geo-border text-[11px] font-mono text-geo-text-primary">
                Coordinates: {displayLat}, {displayLng}
              </div>
            </div>
          ) : (
            <>
              {/* Location Badge */}
              <div className="p-2.5 rounded-lg bg-geo-surface-1 border border-geo-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-rose-600 shrink-0" />
                  <div>
                    <span className="text-[10px] text-geo-text-tertiary block">Current GPS Waypoint</span>
                    <span className="font-mono font-semibold text-geo-text-primary">{displayLat}, {displayLng}</span>
                  </div>
                </div>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-geo-surface-2 text-geo-text-tertiary border border-geo-border uppercase">
                  Locked
                </span>
              </div>

              {/* Trapped Persons Count */}
              <div>
                <label className="block text-[11px] font-semibold text-geo-text-secondary uppercase tracking-wider mb-1">
                  Number of Persons Sheltering / Trapped
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 4, '5+'].map((cnt) => (
                    <button
                      type="button"
                      key={String(cnt)}
                      onClick={() => setPeopleCount(typeof cnt === 'number' ? cnt : 6)}
                      className={`flex-1 py-1.5 rounded border text-xs font-semibold transition-colors ${
                        (typeof cnt === 'number' && peopleCount === cnt) || (cnt === '5+' && peopleCount >= 5)
                          ? 'bg-geo-accent text-white border-geo-accent'
                          : 'bg-geo-surface-1 border-geo-border text-geo-text-secondary'
                      }`}
                    >
                      {cnt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Medical Urgency Checkbox */}
              <label className="flex items-center gap-2.5 p-2.5 rounded-lg border border-geo-border hover:bg-geo-surface-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={medicalUrgent}
                  onChange={(e) => setMedicalUrgent(e.target.checked)}
                  className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4"
                />
                <div>
                  <span className="font-semibold text-geo-text-primary block text-xs">Urgent Medical Triage Required</span>
                  <span className="text-[10px] text-geo-text-tertiary">Elderly, infants, or injured persons needing transport</span>
                </div>
              </label>

              {/* Data Provenance Disclaimer */}
              <div className="p-2.5 rounded bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed flex items-start gap-2">
                <Radio className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                <span>
                  <strong>Simulation Disclaimer:</strong> This transmits to the local simulated EOC rescue dispatch queue. In real operations, dial 999 or official Civil Defence hotlines.
                </span>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-md border border-geo-border text-geo-text-secondary font-medium text-xs hover:bg-geo-surface-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={transmitting}
                  className="flex-2 py-2.5 rounded-md bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 active:scale-98 transition-transform"
                >
                  <PhoneCall className="w-4 h-4" />
                  {transmitting ? 'Transmitting...' : 'Transmit Rescue Request'}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
};
