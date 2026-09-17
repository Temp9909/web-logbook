import Feature from 'ol/Feature';
import Stroke from 'ol/style/Stroke';
import Point from 'ol/geom/Point';
import LineString from 'ol/geom/LineString';
import { Style, Icon } from 'ol/style';
import { transform } from 'ol/proj';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import { XYZ } from 'ol/source';

export const MAP_OPTIONS_NAME = "map-advanced-options";

// Kept as a stable export for older callers/settings. The map now uses one
// consistent blue airport pin so ICAO labels never clutter the basemap.
export const MAP_ICONS = [];

export const DEFAULT_MAP_OPTIONS = {
  routes: {
    enabled: true,
    thickness: 1,
    color: '#1a5fb4',
  },
  tracks: {
    enabled: true,
    thickness: 1,
    color: '#1a5fb4',
  },
  airport: {
    ids: true,
    icon: 0,
  },
  map_base: 0,
}

const AIRPORT_PIN_SRC = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36">
    <path d="M14 1.5C7.1 1.5 1.5 7.1 1.5 14c0 9.6 12.5 20.5 12.5 20.5S26.5 23.6 26.5 14C26.5 7.1 20.9 1.5 14 1.5Z" fill="#FF3B30" stroke="white" stroke-width="2"/>
    <circle cx="14" cy="14" r="4.5" fill="white"/>
  </svg>
`)}`;

const createGreatCircleLine = (start, end, segments = 64) => {
  const lon1 = start.lon * Math.PI / 180
  const lat1 = start.lat * Math.PI / 180
  const lon2 = end.lon * Math.PI / 180
  const lat2 = end.lat * Math.PI / 180

  const coords = []

  const d = 2 * Math.asin(Math.sqrt(Math.sin((lat1 - lat2) / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin((lon1 - lon2) / 2) ** 2))

  for (let i = 0; i <= segments; i++) {
    const f = i / segments
    const A = Math.sin((1 - f) * d) / Math.sin(d)
    const B = Math.sin(f * d) / Math.sin(d)
    const x = A * Math.cos(lat1) * Math.cos(lon1) + B * Math.cos(lat2) * Math.cos(lon2)
    const y = A * Math.cos(lat1) * Math.sin(lon1) + B * Math.cos(lat2) * Math.sin(lon2)
    const z = A * Math.sin(lat1) + B * Math.sin(lat2)
    const lat = Math.atan2(z, Math.sqrt(x * x + y * y))
    const lon = Math.atan2(y, x)

    coords.push(transform([lon * 180 / Math.PI, lat * 180 / Math.PI], 'EPSG:4326', 'EPSG:3857'))
  }

  return new LineString(coords)
}

export const drawGreatCircleLine = (departure, arrival, vectorSource, color, width) => {
  const geometry = createGreatCircleLine(departure, arrival)
  const routeFeature = new Feature({ geometry, type: 'route' })
  routeFeature.setStyle(new Style({ stroke: new Stroke({ color, width }) }));
  vectorSource.addFeature(routeFeature)
}

export const drawTrackLog = (flightTrack, vectorSource, flightId, color, width) => {
  const track = JSON.parse(atob(flightTrack));
  const coordinates = track.map((geometry) => transform([geometry[1], geometry[0]], 'EPSG:4326', 'EPSG:3857'));
  const lineFeature = new LineString(coordinates);
  const feature = new Feature({ geometry: lineFeature, lineKey: `track-${flightId}` });
  feature.setStyle(new Style({ stroke: new Stroke({ color, width }) }));
  vectorSource.addFeature(feature);
}

export const addMarker = (features, airport, options) => {
  const code = airport.icao || airport.iata;
  if (!code) return;

  // Check if marker already exists.
  const exists = features.find(f => f.get('code') === code);
  if (exists) return;

  const feature = new Feature({
    geometry: new Point([airport.lon, airport.lat]).transform('EPSG:4326', 'EPSG:3857'),
    code,
    icao: airport.icao || '',
    name: airport.name,
    country: airport.country,
    city: airport.city,
    elevation: airport.elevation,
    coordinates: `${airport.lat}, ${airport.lon}`,
    type: 'airport',
  });

  if (options?.airport?.ids === false) {
    feature.setStyle(new Style({}));
  } else {
    feature.setStyle(new Style({
      image: new Icon({
        src: AIRPORT_PIN_SRC,
        anchor: [0.5, 1],
        anchorXUnits: 'fraction',
        anchorYUnits: 'fraction',
        scale: 0.82,
      }),
    }));
  }

  features.push(feature);
}

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || "";

const getMapboxStyleTiles = (styleId) => {
  if (!MAPBOX_TOKEN) return null;
  return `https://api.mapbox.com/styles/v1/mapbox/${styleId}/tiles/256/{z}/{x}/{y}?access_token=${MAPBOX_TOKEN}`;
};

const makeMapboxLayer = (styleId) => {
  const url = getMapboxStyleTiles(styleId);
  if (!url) return null;

  return new TileLayer({
    source: new XYZ({
      url,
      attributions: '© Mapbox © OpenStreetMap',
      maxZoom: 20,
      crossOrigin: 'anonymous',
    }),
  });
};

export const getMapBase = (index) => {
  if (MAPBOX_TOKEN) {
    switch (index) {
      case 1:
        return makeMapboxLayer('satellite-streets-v12');
      case 2:
        return makeMapboxLayer('outdoors-v12');
      case 0:
      default:
        return makeMapboxLayer('streets-v12');
    }
  }

  switch (index) {
    case 1:
      return new TileLayer({
        source: new XYZ({
          url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          attributions: '© Esri',
          maxZoom: 19,
          crossOrigin: 'anonymous',
        }),
      });
    case 2:
      return new TileLayer({
        source: new XYZ({
          url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Terrain_Base/MapServer/tile/{z}/{y}/{x}',
          attributions: '© Esri',
          maxZoom: 19,
          crossOrigin: 'anonymous',
        }),
      });
    case 0:
    default:
      return new TileLayer({ source: new OSM() });
  }
};
