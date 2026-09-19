import { useState, useEffect } from 'react';
import { Breakpoint, DeviceInfo } from '../types/device';

export function useDeviceType(): DeviceInfo {
  const getDeviceInfo = (): DeviceInfo => {
    const width = typeof window !== 'undefined' ? window.innerWidth : 1280;
    const height = typeof window !== 'undefined' ? window.innerHeight : 800;

    let breakpoint: Breakpoint = 'xl';
    if (width < 640) breakpoint = 'xs';
    else if (width < 768) breakpoint = 'sm';
    else if (width < 1024) breakpoint = 'md';
    else if (width < 1280) breakpoint = 'lg';
    else breakpoint = 'xl';

    const isMobile = width < 768;
    const isTablet = width >= 768 && width < 1024;
    const isDesktop = width >= 1024;
    const isTouch = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);
    const orientation = width > height ? 'landscape' : 'portrait';

    return { breakpoint, isMobile, isTablet, isDesktop, isTouch, orientation };
  };

  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>(getDeviceInfo);

  useEffect(() => {
    const handleResize = () => {
      setDeviceInfo(getDeviceInfo());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return deviceInfo;
}
