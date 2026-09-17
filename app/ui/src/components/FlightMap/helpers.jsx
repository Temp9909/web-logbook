import Feature from 'ol/Feature';
import Stroke from 'ol/style/Stroke';
import Point from 'ol/geom/Point';
import LineString from 'ol/geom/LineString';
import { Style, Icon, Text, Fill } from 'ol/style';
import { transform } from 'ol/proj';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';

import icon1 from "../../assets/favicon.ico";
import icon2 from "../../assets/map-pin.png";
import icon3 from "../../assets/map-pin2.png";
import { XYZ } from 'ol/source';

export const MAP_OPTIONS_NAME = "map-advanced-options";
export const MAP_ICONS = [
  { src: icon1, displacement: [0, 0], textOffsetY: -12, textOffsetX: 0 },
  { src: icon2, displacement: [0, 14], textOffsetY: -32, textOffsetX: 0 },
  { src: icon3, displacement: [0, 14], textOffsetY: -36, textOffsetX: 0 },
];

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
  /**
   * Code string for an airport based on its IATA and ICAO codes.
   * If the airport has both IATA and ICAO codes and they are different, 
   * the code will be in the format "ICAO/IATA". Otherwise, it will just be the ICAO code.
   */
  const code = airport.icao || airport.iata;

  const icon = options.airport.icon || 0;

  // Check if marker already exists
  const exists = features.find(f => f.get('code') === code);
  if (exists) return;

  const feature = new Feature({
    geometry: new Point([airport.lon, airport.lat]).transform('EPSG:4326', 'EPSG:3857'),
    code: code,
    name: airport.name,
    country: airport.country,
    city: airport.city,
    elevation: airport.elevation,
    coordinates: `${airport.lat}, ${airport.lon}`,
  });

  feature.setStyle(
    new Style({
      image: options.airport.ids ? undefined : new Icon({ ...MAP_ICONS[icon] }),
      text: options.airport.ids ? new Text({
        text: `📍 ${code}`,
        offsetY: -18,
        offsetX: 0,
        font: '700 13px -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif',
        fill: new Fill({ color: '#111111' }),
        backgroundFill: new Fill({ color: 'rgba(255,255,255,0.96)' }),
        backgroundStroke: new Stroke({ color: 'rgba(0,0,0,0.10)', width: 1 }),
        padding: [3, 7, 3, 7],
      }) : null,
    }),
  );

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
  // Use the real Mapbox basemap whenever a public Vite token is configured.
  // OpenLayers stays as the rendering engine, which avoids the previous
  // mapbox-gl dependency/build issue while still using Mapbox map tiles.
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

  // Safe fallback when no token is configured.
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

