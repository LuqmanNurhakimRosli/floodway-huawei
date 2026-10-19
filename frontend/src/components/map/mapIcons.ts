import L from 'leaflet';

// Animated Leaflet DivIcons for the map (styles for the classes live in index.css).
// Custom Animated Leaflet DivIcons
export const userIcon = new L.DivIcon({
  className: 'user-icon',
  html: `
    <div class="user-marker-container">
      <div class="user-marker-pulse"></div>
      <div class="user-marker-dot"></div>
    </div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

export const gpsNavIcon = new L.DivIcon({
  className: 'gps-nav-icon',
  html: `
    <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">
      <div style="position: absolute; inset: -4px; border-radius: 50%; background: #1677FF; opacity: 0.4; animation: ping 1.2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
      <div style="width: 28px; height: 28px; border-radius: 50%; background: #1677FF; border: 3px solid white; box-shadow: 0 4px 14px rgba(22,119,255,0.7); display: flex; align-items: center; justify-content: center; color: white;">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/>
        </svg>
      </div>
    </div>
  `,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

export const createShelterIcon = (isSelected: boolean, status: string) => {
  const isFull = status === 'FULL';
  const isClosed = status === 'CLOSED';

  let bgColor = '#10B981'; // Green for open
  let symbol = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  `;

  if (isClosed) {
    bgColor = '#EF4444'; // Red
    symbol = `<span style="font-size: 15px; font-weight: 900; line-height: 1;">✕</span>`;
  } else if (isFull) {
    bgColor = '#F59E0B'; // Amber
    symbol = `<span style="font-size: 16px; font-weight: 900; line-height: 1;">!</span>`;
  } else if (isSelected) {
    bgColor = '#1677FF'; // Blue
  }

  return new L.DivIcon({
    className: 'shelter-icon',
    html: `
      <div style="width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;"><!-- 44px tap area -->
      <div class="shelter-marker ${isSelected ? 'selected' : ''}">
        <div style="width: ${isSelected ? '38px' : '32px'}; height: ${isSelected ? '38px' : '32px'}; background: ${bgColor}; color: white; display: flex; align-items: center; justify-content: center; border-radius: 12px; border: 2px solid white; box-shadow: 0 4px 14px rgba(0,0,0,0.35);">
          ${symbol}
        </div>
        ${isSelected ? '<div class="shelter-marker-ring"></div>' : ''}
      </div>
      </div>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
  });
};
