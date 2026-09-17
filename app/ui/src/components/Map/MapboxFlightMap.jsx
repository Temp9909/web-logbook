import FlightMap from "../FlightMap/FlightMap";

// Compatibility wrapper. The project uses its stable OpenLayers renderer here
// so the basemap works without requiring a Mapbox access token.
export const MapboxFlightMap = ({ data, airportsMap, options }) => (
  <FlightMap data={data} airportsMap={airportsMap} embedded optionsOverride={options} />
);

export default MapboxFlightMap;
