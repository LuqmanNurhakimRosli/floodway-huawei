// Hardware Telemetry Service (USB Serial & Web Bluetooth for JSN-SR04T Sensor Nodes)

export interface SerialTelemetryReading {
  distanceCm: number;
  waterLevelM: number;
  rawSignal: number;
  timestamp: number;
}

export async function connectUsbSerial(): Promise<boolean> {
  if (!('serial' in navigator)) {
    alert('Web Serial API not supported in this browser. Please use Chrome/Edge on Desktop.');
    return false;
  }
  try {
    // @ts-ignore
    const port = await navigator.serial.requestPort();
    await port.open({ baudRate: 115200 });
    return true;
  } catch (err) {
    console.warn('USB connection cancelled or failed', err);
    return false;
  }
}
