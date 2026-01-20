import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import { Star, ShieldAlert, ShieldCheck } from 'lucide-react';
import L from 'leaflet';

// Enhanced marker with trust indicator
export const createSignalMarkerIcon = (signal, hostUser) => {
  const isSyndicate = signal.type === 'syndicate';
  const color = isSyndicate ? '#00F2FF' : '#FBBF24';
  const shadowColor = isSyndicate ? 'rgba(0, 242, 255, 0.4)' : 'rgba(251, 191, 36, 0.4)';
  
  // Determine trust indicator
  let trustIndicator = '';
  if (hostUser) {
    const stars = hostUser.trust_stars || 3;
    const cautionCount = hostUser.caution_count || 0;
    
    if (cautionCount > 0) {
      trustIndicator = `
        <div style="
          position: absolute;
          top: -4px;
          right: -4px;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #EAB308;
          border: 2px solid #000;
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="3">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
        </div>
      `;
    } else if (stars >= 4) {
      trustIndicator = `
        <div style="
          position: absolute;
          top: -4px;
          right: -4px;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #22C55E;
          border: 2px solid #000;
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="3">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
          </svg>
        </div>
      `;
    }
  }
  
  return L.divIcon({
    className: 'custom-signal-marker',
    html: `
      <div style="position: relative; width: 40px; height: 40px;">
        <div style="
          position: absolute;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: ${shadowColor};
          animation: pulse-ring 2s ease-out infinite;
        "></div>
        <div style="
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: ${color};
          box-shadow: 0 0 20px ${shadowColor};
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            ${isSyndicate 
              ? '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>'
              : '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>'
            }
          </svg>
        </div>
        ${trustIndicator}
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
};

export default function SignalMapMarker({ signal, hostUser, onClick }) {
  return (
    <Marker
      position={[signal.latitude, signal.longitude]}
      icon={createSignalMarkerIcon(signal, hostUser)}
      eventHandlers={{
        click: onClick
      }}
    >
      <Popup>
        <div className="text-black">
          <h3 className="font-bold">{signal.title}</h3>
          <p className="text-sm">Host: {signal.host_name}</p>
          {hostUser && (
            <div className="flex items-center gap-1 mt-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-3 h-3 ${
                    star <= (hostUser.trust_stars || 3)
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-gray-400'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </Popup>
    </Marker>
  );
}