import { useEffect, useMemo, useRef, useState } from 'react';
import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import FullScreen from 'ol/control/FullScreen';
import Overlay from 'ol/Overlay';
import { transform } from 'ol/proj';
import ApplePanel from '../UIElements/ApplePanel';
import { queryClient } from '../../util/http/http';
import { fetchAirport } from '../../util/http/airport';
import { DownloadMapButton } from './DownloadMapButton';
import useCustomFields from '../../hooks/useCustomFields';
import { DEFAULT_MAP_OPTIONS, drawGreatCircleLine, drawTrackLog, addMarker, MAP_OPTIONS_NAME, getMapBase } from './helpers';
import MapOptionsButton from './MapOptionsButton';
import { CODEC_JSON, useLocalStorageState } from '../../hooks/useLocalStorageState';
import { formatDistanceNM, sumDistanceNM } from '../../util/helpers';

const getAirportData = async (id, airportsMap) => {
  const normalizedId = String(id || '').trim().toUpperCase();
  if (!normalizedId) return null;

  if (airportsMap) {
    const airport = airportsMap.get(normalizedId) || airportsMap.get(id);
    if (airport) return airport;
  }

  try {
    const cachedData = queryClient.getQueryData(["airports", normalizedId]);
    if (cachedData) return cachedData;

    return await queryClient.fetchQuery({
      queryKey: ["airports", normalizedId],
      queryFn: ({ signal }) => fetchAirport({ signal, id: normalizedId }),
      staleTime: 86400000,
      gcTime: 86400000,
    });
  } catch {
    return null;
  }
}

export const FlightMap = ({ data, title = "Flight Map", sx, airportsMap, embedded = false, optionsOverride = null }) => {
  const [storedOptions] = useLocalStorageState(MAP_OPTIONS_NAME, DEFAULT_MAP_OPTIONS, { codec: CODEC_JSON });
  const options = useMemo(() => {
    const rawOptions = optionsOverride || storedOptions || {};
    return {
      ...DEFAULT_MAP_OPTIONS,
      ...rawOptions,
      routes: { ...DEFAULT_MAP_OPTIONS.routes, ...(rawOptions.routes || {}) },
      tracks: { ...DEFAULT_MAP_OPTIONS.tracks, ...(rawOptions.tracks || {}) },
      airport: { ...DEFAULT_MAP_OPTIONS.airport, ...(rawOptions.airport || {}) },
    };
  }, [optionsOverride, storedOptions]);

  const mapRef = useRef(null);
  const hoverTooltipRef = useRef(null);
  const hoverOverlayRef = useRef(null);
  const vectorSourceRef = useRef(new VectorSource());

  const customFieldsHook = useCustomFields() || {};
  const [map, setMap] = useState(null);
  const [distance, setDistance] = useState(0);

  useEffect(() => {
    if (!mapRef.current || !hoverTooltipRef.current) return;

    hoverOverlayRef.current = new Overlay({
      element: hoverTooltipRef.current,
      offset: [0, -29],
      positioning: 'bottom-center',
      stopEvent: false,
    });

    const vectorLayer = new VectorLayer({ source: vectorSourceRef.current });
    const mapLayer = getMapBase(options.map_base);

    const mapInstance = new Map({
      target: mapRef.current,
      layers: [mapLayer, vectorLayer],
      view: new View({
        center: transform([10, 45], "EPSG:4326", "EPSG:3857"),
        zoom: 4,
      }),
      controls: [new FullScreen()],
      overlays: [hoverOverlayRef.current],
    });

    const hideAirportTooltip = () => {
      hoverOverlayRef.current?.setPosition(undefined);
      if (hoverTooltipRef.current) {
        hoverTooltipRef.current.textContent = '';
        hoverTooltipRef.current.classList.remove('is-open');
      }
      const target = mapInstance.getTargetElement();
      if (target) target.style.cursor = '';
    };

    mapInstance.on('pointermove', (evt) => {
      if (evt.dragging) {
        hideAirportTooltip();
        return;
      }

      const feature = mapInstance.forEachFeatureAtPixel(
        evt.pixel,
        (candidate) => candidate?.get('type') === 'airport' ? candidate : null,
        { hitTolerance: 5 },
      );

      if (!feature || options?.airport?.ids === false) {
        hideAirportTooltip();
        return;
      }

      const code = feature.get('icao') || feature.get('code');
      if (!code) {
        hideAirportTooltip();
        return;
      }

      if (hoverTooltipRef.current) {
        hoverTooltipRef.current.textContent = code;
        hoverTooltipRef.current.classList.add('is-open');
      }
      hoverOverlayRef.current?.setPosition(feature.getGeometry().getCoordinates());
      const target = mapInstance.getTargetElement();
      if (target) target.style.cursor = 'pointer';
    });

    const viewport = mapInstance.getViewport();
    viewport.addEventListener('mouseleave', hideAirportTooltip);

    setMap(mapInstance);

    return () => {
      viewport.removeEventListener('mouseleave', hideAirportTooltip);
      mapInstance.setTarget(null);
      hoverOverlayRef.current = null;
      setMap(null);
    };
  }, [options.map_base, options?.airport?.ids]);

  useEffect(() => {
    if (!map || !data) return;

    let cancelled = false;

    const updateMapData = async () => {
      setDistance(0);
      vectorSourceRef.current.clear();

      const features = [];
      // Distance shown on the map must describe ALL visible flights, not only
      // flights whose airport coordinates can be resolved for drawing.
      // Previously the total was incremented only after both airports loaded,
      // which made Map disagree with Stats/Summary when an airport was missing.
      const totalDistance = sumDistanceNM(data);
      const getEnroute = customFieldsHook.getEnroute || (() => []);

      const airportPromises = data.map(async (flight) => {
        if (!flight.departure.place || !flight.arrival.place) return null;

        const [departure, arrival] = await Promise.all([
          getAirportData(flight.departure.place, airportsMap),
          getAirportData(flight.arrival.place, airportsMap),
        ]);

        if (!departure || !arrival) return null;

        addMarker(features, departure, options);
        addMarker(features, arrival, options);

        const fullRoute = [departure];
        const enrouteCodes = getEnroute(flight.custom_fields);

        if (Array.isArray(enrouteCodes)) {
          for (const code of enrouteCodes) {
            if (code !== flight.departure.place && code !== flight.arrival.place) {
              const airport = await getAirportData(code, airportsMap);
              if (airport) {
                fullRoute.push(airport);
                addMarker(features, airport, options);
              }
            }
          }
        }

        fullRoute.push(arrival);

        if (options.routes.enabled) {
          for (let i = 0; i < fullRoute.length - 1; i++) {
            drawGreatCircleLine(fullRoute[i], fullRoute[i + 1], vectorSourceRef.current, options.routes.color, options.routes.thickness);
          }
        }

        if (options.tracks.enabled && flight.track) {
          drawTrackLog(flight.track, vectorSourceRef.current, flight.uuid || flight.id, options.tracks.color, options.tracks.thickness);
        }

        return { departure, arrival };
      });

      await Promise.all(airportPromises);
      if (cancelled) return;

      setDistance(totalDistance);

      if (features.length > 0) {
        vectorSourceRef.current.addFeatures(features);
        map.updateSize();
        map.getView().fit(vectorSourceRef.current.getExtent(), {
          maxZoom: 16,
          padding: [30, 30, 30, 30],
          duration: 100,
        });
      }
    };

    updateMapData();
    return () => { cancelled = true; };
  }, [map, data, options, airportsMap, customFieldsHook.getEnroute]);

  if (!data) return null;

  const mapCanvas = (
    <div className="apple-map-canvas-wrap" style={sx}>
      <div ref={mapRef} className="apple-map-canvas" />
      <div ref={hoverTooltipRef} className="apple-map-airport-tooltip" aria-hidden="true" />
      {distance > 0 && <div className="apple-map-distance">{`Distance: ${formatDistanceNM(distance)} NM`}</div>}
    </div>
  );

  return embedded ? mapCanvas : (
    <ApplePanel className="apple-map-panel" title={title} actions={<><DownloadMapButton map={map} /><MapOptionsButton /></>}>
      {mapCanvas}
    </ApplePanel>
  );
};

export default FlightMap;
