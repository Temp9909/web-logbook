import { useLocation, useParams } from "react-router-dom";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
// MUI UI elements
import LinearProgress from '@mui/material/LinearProgress';
// Custom
import FlightRecordDetails from "./FlightRecordDetails";
import { fetchFlightData } from "../../util/http/logbook";
import { useErrorNotification } from "../../hooks/useAppNotifications";
import { FLIGHT_INITIAL_STATE } from "../../constants/constants";
import FlightMap from "../FlightMap/FlightMap";
import Attachments from "../FlightRecordAttachment/Attachments";
import FlightRecordPersons from "../Persons/FlightRecordPersons";
import AppleLegacyHeading from "../UIElements/AppleLegacyHeading";

export const FlightRecord = () => {
  const { id } = useParams();
  const [flight, setFlight] = useState({ ...FLIGHT_INITIAL_STATE, uuid: id });
  const location = useLocation();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['flight', id],
    queryFn: ({ signal }) => fetchFlightData({ signal, id }),
    enabled: id !== "new",
    refetchOnWindowFocus: false,
    staleTime: 3600000,
    gcTime: 3600000,
  });
  useErrorNotification({ isError, error, fallbackMessage: 'Failed to load flight record' });

  useEffect(() => {
    if (id === "new") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFlight({
        ...FLIGHT_INITIAL_STATE,
        uuid: "new",
        ...location.state
      });
      return;
    }

    if (data) {
      setFlight({ ...data, redraw: Math.random() });
    }
  }, [data, id, location.state]);

  const mapData = useMemo(() => {
    if (flight) return [flight];
    return [];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flight.redraw, flight.distance]);

  const handleChange = useCallback((key, value) => {
    setFlight((flight) => {
      const keys = key.split('.'); // Split key by dots to handle nesting
      let updatedFlight = { ...flight }; // Create a shallow copy of the flight object
      let current = updatedFlight;

      // Traverse and create nested objects as needed
      keys.forEach((k, index) => {
        if (index === keys.length - 1) {
          // Update the final key with the new value
          current[k] = value;
        } else {
          // Ensure the next level exists
          current[k] = current[k] ? { ...current[k] } : {};
          current = current[k];
        }
      });

      return updatedFlight;
    });
  }, []);

  const options = useMemo(() =>
    flight?.track
      ? { routes: false, tracks: true, airport_ids: true, icon: 'ico' }
      : { routes: true, tracks: false, airport_ids: true, icon: 'ico' }
    , [flight.track]);

  return (
    <section className="apple-legacy-screen apple-flight-record-screen">
      <AppleLegacyHeading
        title={id === "new" ? "New flight" : "Flight record"}
        subtitle={id === "new" ? "Add a flight to your logbook." : "Review and edit the selected flight."}
      />
      {isLoading && <LinearProgress />}
      <div className="apple-split-layout apple-flight-layout">
        <div className="apple-stack">
          <FlightRecordDetails flight={flight} handleChange={handleChange} setFlight={setFlight} />
          <Attachments id={id} />
          <FlightRecordPersons id={id} />
        </div>
        <div className="apple-stack apple-sticky-column">
          <FlightMap data={mapData} options={options} />
        </div>
      </div>
    </section>
  );
}

export default FlightRecord;