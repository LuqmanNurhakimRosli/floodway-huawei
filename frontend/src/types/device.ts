export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface DeviceInfo {
  breakpoint: Breakpoint;
  isMobile: boolean; // < 768px
  isTablet: boolean; // 768px - 1023px
  isDesktop: boolean; // >= 1024px
  isTouch: boolean;
  orientation: 'portrait' | 'landscape';
}

export type UserOperationalRole = 'commander' | 'responder' | 'citizen' | 'analyst';
