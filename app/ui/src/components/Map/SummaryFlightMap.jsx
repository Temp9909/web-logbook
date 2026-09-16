import { useCallback, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
// MUI
import LinearProgress from "@mui/material/LinearProgress";
// Custom
import Filters from "../UIElements/Filters";
import FlightMap from "../FlightMap/FlightMap";
import { useErrorNotification } from "../../hooks/useAppNotifications";
import { fetchLogbookMapData } from "../../util/http/logbook";
import SummaryStats from "./SummaryStats";
import { fetchAirports } from "../../util/http/airport";
import AppleLegacyHeading from "../UIElements/AppleLegacyHeading";
import ApplePanel from "../UIElements/ApplePanel";

export const SummaryFlightMap = () => {
  const [mapData, setMapData] = useState([]);
  const [airportsMap, setAirportsMap] = useState(new Map());

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['logbook', 'map'],
    queryFn: ({ signal }) => fetchLogbookMapData({ signal }),
    staleTime: 3600000,
    gcTime: 3600000,
  });
  useErrorNotification({ isError, error, fallbackMessage: 'Failed to load logbook' });

  const { data: airports } = useQuery({
    queryKey: ['airports'],
    queryFn: ({ signal }) => fetchAirports({ signal }),
    staleTime: 3600000,
    gcTime: 3600000,
  });

  useEffect(() => {
    if (airports) {
      const map = new Map();
      airports.forEach(a => {
        map.set(a.icao, a);
        if (a.iata) {
          map.set(a.iata, a);
        }
      });
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAirportsMap(map);
    }
  }, [airports]);

  const callbackFunction = useCallback((filteredData) => { setMapData(filteredData) }, [setMapData]);

  return (
    <section className="apple-legacy-screen apple-map-screen">
      <AppleLegacyHeading title="Map" subtitle="Explore your flights, routes and airports." />
      {isLoading && <LinearProgress />}
      <div className="apple-map-layout">
        <aside className="apple-stack apple-map-sidebar">
          <ApplePanel title="Filters" subtitle="Choose which flights are shown on the map.">
            <Filters data={data} callbackFunction={callbackFunction} />
          </ApplePanel>
          <ApplePanel title="Stats" subtitle="Summary for the currently visible flights.">
            <SummaryStats data={mapData} airportsMap={airportsMap} />
          </ApplePanel>
        </aside>
        <div className="apple-map-main">
          <FlightMap data={mapData} airportsMap={airportsMap} />
        </div>
      </div>
    </section>
  );
}

export default SummaryFlightMap;