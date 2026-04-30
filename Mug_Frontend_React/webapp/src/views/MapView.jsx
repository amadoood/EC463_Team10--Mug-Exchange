import { useEffect, useRef, useState } from "react";
import { Icons } from "../components/Icons";
import { cafes as ALL_CAFES } from "../constants/data";

function LeafletMap({ selectedCafeId, onCafeSelect }) {
  const mapRef = useRef(null);
  const leafletMapRef = useRef(null);
  const markersRef = useRef({});
  const [leafletReady, setLeafletReady] = useState(!!window.L);

  useEffect(() => {
    if (window.L) { setLeafletReady(true); return; }
    if (!document.querySelector('link[href*="leaflet"]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }
    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => setLeafletReady(true);
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (!leafletReady || !mapRef.current || leafletMapRef.current) return;
    const L = window.L;
    const map = L.map(mapRef.current, { center: [42.3497, -71.1048], zoom: 15, zoomControl: true });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>', maxZoom: 19,
    }).addTo(map);
    leafletMapRef.current = map;

    ALL_CAFES.forEach((cafe) => {
      const color = cafe.mugs > 0 ? "#3d5c28" : "#a84030";
      const icon = L.divIcon({
        className: "",
        html: `<div style="width:28px;height:28px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:${color};border:3px solid #fff;box-shadow:0 3px 10px rgba(0,0,0,0.3)"><div style="position:absolute;inset:4px;border-radius:50%;background:rgba(255,255,255,0.55);transform:rotate(45deg)"></div></div>`,
        iconSize: [28, 28], iconAnchor: [14, 28], popupAnchor: [0, -30],
      });
      const marker = L.marker([cafe.lat, cafe.lng], { icon }).addTo(map)
        .bindPopup(`<div style="font-family:'Jost',sans-serif;min-width:160px"><div style="font-weight:600;color:#2d4a1e;margin-bottom:3px">${cafe.name}</div><div style="font-size:0.78rem;color:#7a7a60;margin-bottom:6px">${cafe.address}</div><div style="font-size:0.76rem;color:${cafe.mugs > 0 ? "#2a6a28" : "#a84030"}">${cafe.mugs > 0 ? `● ${cafe.mugs} mugs available` : "● No mugs available"}</div></div>`, { maxWidth: 200 });
      marker.on("click", () => onCafeSelect(cafe.id));
      markersRef.current[cafe.id] = marker;
    });

    return () => { map.remove(); leafletMapRef.current = null; markersRef.current = {}; };
  }, [leafletReady, onCafeSelect]);

  useEffect(() => {
    if (!leafletMapRef.current || !selectedCafeId) return;
    const marker = markersRef.current[selectedCafeId];
    if (marker) {
      marker.openPopup();
      const cafe = ALL_CAFES.find(c => c.id === selectedCafeId);
      if (cafe) leafletMapRef.current.panTo([cafe.lat, cafe.lng], { animate: true });
    }
  }, [selectedCafeId]);

  return (
    <div style={{ position: "relative" }}>
      <div ref={mapRef} className="leaflet-map-container" />
      {!leafletReady && (
        <div style={{ position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",background:"#d4e4c8",borderRadius:16,fontSize:"0.82rem",color:"#7a7a60" }}>
          Loading map...
        </div>
      )}
    </div>
  );
}

export default function MapView({ visible, mapQuery, filteredCafes, onMapQueryChange, onPinClick, onOrderAtCafe }) {
  const [selectedId, setSelectedId] = useState(null);

  if (!visible) return null;

  const handleSelect = (id) => {
    setSelectedId(id);
    const cafe = ALL_CAFES.find(c => c.id === id);
    if (cafe) onPinClick(id, cafe.name);
  };

  return (
    <main className="view">
      <div className="page-header">
        <div className="page-title">Find a Cafe</div>
        <div className="page-sub">Tap a pin to see mug availability</div>
      </div>

      <div style={{ padding: "12px 20px 0" }}>
        <LeafletMap selectedCafeId={selectedId} onCafeSelect={handleSelect} />
      </div>

      <div style={{ display:"flex", gap:16, padding:"8px 20px 0", fontSize:"0.72rem", color:"var(--text-muted)" }}>
        <span><span style={{color:"var(--olive)"}}>●</span> Mugs available</span>
        <span><span style={{color:"var(--red)"}}>●</span> None available</span>
      </div>

      <div className="search-wrap">
        <span className="search-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </span>
        <input className="input input-search" placeholder="Search cafes..."
          value={mapQuery} onChange={(e) => { onMapQueryChange(e.target.value); setSelectedId(null); }} />
      </div>

      <div className="list" style={{ marginTop: 12 }}>
        {filteredCafes.length === 0 ? (
          <div className="empty-state"><div className="empty-icon">🗺️</div><div className="empty-text">No cafes match your search</div></div>
        ) : (
          filteredCafes.map((cafe) => (
            <div key={cafe.id} className="card"
              style={selectedId === cafe.id ? { borderColor:"var(--olive)", boxShadow:"0 2px 12px rgba(61,92,40,0.15)" } : {}}
              onClick={() => handleSelect(cafe.id)}
            >
              <div className="card-row">
                <div className="thumb"><Icons.Store /></div>
                <div className="card-body">
                  <div className="card-title">{cafe.name}</div>
                  <div className="card-meta">{cafe.area} · {cafe.dist}</div>
                  <div className={cafe.mugs > 0 ? "mugs-avail" : "mugs-empty"}>
                    {cafe.mugs > 0 ? `● ${cafe.mugs} mugs available` : "● No mugs available"}
                  </div>
                </div>
                {cafe.mugs > 0 && <span className="pill pill-green">Open</span>}
              </div>
              {/* Order button right on the card */}
              {cafe.mugs > 0 && (
                <button
                  className="order-btn"
                  onClick={(e) => { e.stopPropagation(); onOrderAtCafe(cafe); }}
                >
                  Order here →
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </main>
  );
}
