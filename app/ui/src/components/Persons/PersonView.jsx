
import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
// MUI
import LinearProgress from "@mui/material/LinearProgress";
// Custom
import { useErrorNotification } from "../../hooks/useAppNotifications";
import { fetchLogsForPerson, fetchPersonByUuid } from "../../util/http/person";
import { printPerson } from "../../util/helpers";
import PersonsViewFlightsTable from "./PersonViewFlightsTable";
import { PersonDataCard } from "./PersonDataCard";
import SavePersonButton from "./SavePersonButton";
import AppleLegacyHeading from "../UIElements/AppleLegacyHeading";
import ApplePanel from "../UIElements/ApplePanel";

export const PersonView = () => {
  const { uuid } = useParams();
  const [person, setPerson] = useState({});

  const handleChange = useCallback((key, value) => {
    setPerson((prev) => ({ ...prev, [key]: value }));
  }, []);

  const { data: personData, isLoading: personIsLoading, isError: personIsError, error: personError } = useQuery({
    queryKey: ["persons", "person", uuid],
    queryFn: ({ signal }) => fetchPersonByUuid({ signal, uuid }),
    staleTime: 3600000,
    gcTime: 3600000,
  });
  useErrorNotification({ isError: personIsError, error: personError, fallbackMessage: "Failed to load person" });

  const { data: personFlightsData, isLoading: personFlightsIsLoading, isError: personFlightsIsError, error: personFlightsError } = useQuery({
    queryKey: ["persons", "flights", uuid],
    queryFn: ({ signal }) => fetchLogsForPerson({ signal, personUuid: uuid }),
    staleTime: 3600000,
    gcTime: 3600000,
    refetchOnWindowFocus: false,
  });
  useErrorNotification({ isError: personFlightsIsError, error: personFlightsError, fallbackMessage: "Failed to load flights" });

  const flightsTitle = useMemo(() => `${printPerson(personData)} Flights`, [personData]);

  useEffect(() => {
    if (personData) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPerson(personData);
    }
  }, [personData]);

  return (
    <section className="apple-legacy-screen apple-person-view-screen">
      <AppleLegacyHeading title={printPerson(personData) || "Person"} subtitle="Person details and associated flights." />
      <div className="apple-split-layout apple-person-view-layout">
        <ApplePanel title={flightsTitle} subtitle="Flights associated with this person.">
          <PersonsViewFlightsTable title="" data={personFlightsData} isLoading={personFlightsIsLoading} embedded />
        </ApplePanel>
        <ApplePanel
          title="Person data"
          subtitle="Contact and logbook information."
          actions={<SavePersonButton person={person} isNew={false} onClose={() => null} />}
        >
          {personIsLoading && <LinearProgress />}
          {personData && <PersonDataCard person={person} handleChange={handleChange} />}
        </ApplePanel>
      </div>
    </section>
  );
};

export default PersonView;
