import { useEffect, useMemo, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

const createRasterStyle = (baseIndex = 0) => {
  const variants = {
    0: {
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      attribution: "© OpenStreetMap contributors",
      tileSize: 256,
    },
    1: {
      tiles: ["https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"],
      attribution: "© Esri",
      tileSize: 256,
    },
    2: {
      tiles: ["https://server.arcgisonline.com/ArcGIS/rest/services/World_Terrain_Base/MapServer/tile/{z}/{y}/{x}"],
      attribution: "© Esri",
      tileSize: 256,
    },
  };
  const chosen = variants[baseIndex] || variants[0];
  return {
    version: 8,
    sources: {
      basemap: {
        type: "raster",
        tiles: chosen.tiles,
        tileSize: chosen.tileSize,
        attribution: chosen.attribution,
      },
    },
    layers: [{ id: "basemap", type: "raster", source: "basemap" }],
  };
};

const safeNumber = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

const parseTrack = (flightTrack) => {
  if (!flightTrack) return [];
  try {
    const track = JSON.parse(atob(flightTrack));
    return Array.isArray(track)
      ? track
          .map((geometry) => [safeNumber(geometry?.[1]), safeNumber(geometry?.[0])])
          .filter((point) => point[0] !== null && point[1] !== null)
      : [];
  } catch {
    return [];
  }
};

const buildMapData = (data, airportsMap, options) => {
  const geojson = { type: "FeatureCollection", features: [] };
  const airportList = [];
  const airportSeen = new Set();

  const addAirport = (airport) => {
    if (!airport) return;
    const lon = safeNumber(airport.lon);
    const lat = safeNumber(airport.lat);
    if (lon === null || lat === null) return;

    const code = airport.icao || airport.iata || airport.id;
    if (!code || airportSeen.has(code)) return;
    airportSeen.add(code);
    airportList.push({
      code,
      iata: airport.iata || "",
      name: airport.name || code,
      country: airport.country || "",
      city: airport.city || "",
      elevation: airport.elevation || "",
      lon,
      lat,
    });
  };

  (Array.isArray(data) ? data : []).forEach((flight, index) => {
    const departure = airportsMap?.get?.(flight?.departure?.place);
    const arrival = airportsMap?.get?.(flight?.arrival?.place);

    addAirport(departure);
    addAirport(arrival);

    if (options?.routes?.enabled !== false && departure && arrival) {
      const from = [safeNumber(departure.lon), safeNumber(departure.lat)];
      const to = [safeNumber(arrival.lon), safeNumber(arrival.lat)];
      if (from[0] !== null && from[1] !== null && to[0] !== null && to[1] !== null) {
        geojson.features.push({
          type: "Feature",
          properties: { kind: "route", id: `route-${flight?.uuid || flight?.id || index}` },
          geometry: { type: "LineString", coordinates: [from, to] },
        });
      }
    }

    if (options?.tracks?.enabled !== false && flight?.track) {
      const coords = parseTrack(flight.track);
      if (coords.length > 1) {
        geojson.features.push({
          type: "Feature",
          properties: { kind: "track", id: `track-${flight?.uuid || flight?.id || index}` },
          geometry: { type: "LineString", coordinates: coords },
        });
      }
    }
  });

  return { geojson, airportList };
};

const popupHtml = (airport) => {
  const code = airport.iata && airport.iata !== airport.code ? `${airport.code}/${airport.iata}` : airport.code;
  return `
    <div class="apple-map-popup-content">
      <div class="apple-map-popup-title">${code}</div>
      <div><strong>Name:</strong> ${airport.name || "—"}</div>
      <div><strong>Country:</strong> ${airport.country || "—"}</div>
      <div><strong>City:</strong> ${airport.city || "—"}</div>
      <div><strong>Elevation:</strong> ${airport.elevation || "—"}</div>
      <div><strong>Lat/Lon:</strong> ${airport.lat}, ${airport.lon}</div>
    </div>`;
};

export const MapboxFlightMap = ({ data, airportsMap, options }) => {
  const mapNodeRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);

  const mapData = useMemo(() => buildMapData(data, airportsMap, options || {}), [data, airportsMap, options]);

  useEffect(() => {
    if (!mapNodeRef.current) return undefined;

    const map = new mapboxgl.Map({
      container: mapNodeRef.current,
      style: createRasterStyle(options?.map_base ?? 0),
      center: [10, 45],
      zoom: 3.8,
      attributionControl: true,
    });

    map.addControl(new mapboxgl.NavigationControl({ showCompass: true, visualizePitch: false }), "top-right");
    map.addControl(new mapboxgl.FullscreenControl(), "top-right");

    map.on("load", () => {
      map.addSource("flight-lines", { type: "geojson", data: mapData.geojson });
      map.addLayer({
        id: "flight-routes",
        type: "line",
        source: "flight-lines",
        filter: ["==", ["get", "kind"], "route"],
        paint: {
          "line-color": options?.routes?.color || "#1a5fb4",
          "line-width": options?.routes?.thickness || 2,
          "line-opacity": 0.9,
        },
      });
      map.addLayer({
        id: "flight-tracks",
        type: "line",
        source: "flight-lines",
        filter: ["==", ["get", "kind"], "track"],
        paint: {
          "line-color": options?.tracks?.color || "#0A84FF",
          "line-width": Math.max(1.5, Number(options?.tracks?.thickness || 1) + 0.5),
          "line-opacity": 0.8,
        },
      });
    });

    mapRef.current = map;

    return () => {
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, [options?.map_base]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const syncMap = () => {
      const source = map.getSource("flight-lines");
      if (source) source.setData(mapData.geojson);

      if (map.getLayer("flight-routes")) {
        map.setPaintProperty("flight-routes", "line-color", options?.routes?.color || "#1a5fb4");
        map.setPaintProperty("flight-routes", "line-width", options?.routes?.thickness || 2);
        map.setLayoutProperty("flight-routes", "visibility", options?.routes?.enabled === false ? "none" : "visible");
      }
      if (map.getLayer("flight-tracks")) {
        map.setPaintProperty("flight-tracks", "line-color", options?.tracks?.color || "#0A84FF");
        map.setPaintProperty("flight-tracks", "line-width", Math.max(1.5, Number(options?.tracks?.thickness || 1) + 0.5));
        map.setLayoutProperty("flight-tracks", "visibility", options?.tracks?.enabled === false ? "none" : "visible");
      }

      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];

      if (options?.airport?.ids !== false) {
        mapData.airportList.forEach((airport) => {
          const markerEl = document.createElement("button");
          markerEl.type = "button";
          markerEl.className = "apple-mapbox-marker";
          markerEl.innerHTML = `<span class="apple-mapbox-marker-pin">📍</span><span class="apple-mapbox-marker-code">${airport.code}</span>`;

          const marker = new mapboxgl.Marker({ element: markerEl, anchor: "bottom" })
            .setLngLat([airport.lon, airport.lat])
            .setPopup(new mapboxgl.Popup({ offset: 20 }).setHTML(popupHtml(airport)))
            .addTo(map);
          markersRef.current.push(marker);
        });
      }

      const bounds = new mapboxgl.LngLatBounds();
      let hasBounds = false;
      mapData.airportList.forEach((airport) => {
        bounds.extend([airport.lon, airport.lat]);
        hasBounds = true;
      });
      mapData.geojson.features.forEach((feature) => {
        if (feature.geometry?.type === "LineString") {
          feature.geometry.coordinates.forEach((coord) => {
            bounds.extend(coord);
            hasBounds = true;
          });
        }
      });
      if (hasBounds) {
        map.fitBounds(bounds, { padding: 50, maxZoom: 8, duration: 0 });
      }
    };

    if (map.isStyleLoaded()) {
      syncMap();
    } else {
      map.once("load", syncMap);
      return () => map.off("load", syncMap);
    }
  }, [mapData, options]);

  return (
    <div className="apple-map-canvas-wrap apple-mapbox-wrap">
      <div ref={mapNodeRef} className="apple-map-canvas apple-mapbox-canvas" />
    </div>
  );
};

export default MapboxFlightMap;
