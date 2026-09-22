import React, { useState } from 'react';
import { Radio, Battery, Activity, Usb, CheckCircle2, ChevronDown } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { connectUsbSerial } from '../../services/telemetryService';

export function IoTHeaderPopover() {
  const [isOpen, setIsOpen] = useState(false);
  const { telemetry } = useApp();
  const [usbConnected, setUsbConnected] = useState(false);

  const handleUsbConnect = async () => {
    const success = await connectUsbSerial();
    if (success) setUsbConnected(true);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200/80 transition-colors"
      >
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span>IoT 12/14 Online</span>
        <ChevronDown className="w-3 h-3 text-slate-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100">
            <span className="font-heading font-bold text-sm text-slate-900">Station Telemetry</span>
            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold">
              #FW-KL-04
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Location:</span>
              <span className="font-semibold text-slate-800">Kampung Baru Sluice</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Ultrasonic Distance:</span>
              <span className="font-semibold text-slate-800">{telemetry.distanceCm} cm</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Water Depth:</span>
              <span className="font-bold text-red-600">{telemetry.waterLevelM.toFixed(2)} m (Rising)</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Battery & Signal:</span>
              <span className="font-semibold text-emerald-600 flex items-center gap-1">
                <Battery className="w-3.5 h-3.5" /> 94% · -68 dBm
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100">
            <button
              onClick={handleUsbConnect}
              className={`w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
                usbConnected
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-slate-900 text-white hover:bg-slate-800'
              }`}
            >
              <Usb className="w-3.5 h-3.5" />
              <span>{usbConnected ? 'USB Sensor Connected (115200)' : 'Connect Local Sensor via USB'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
