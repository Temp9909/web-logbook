import { useQuery } from "@tanstack/react-query";
import ApplePanel from "../UIElements/ApplePanel";
import { useErrorNotification } from "../../hooks/useAppNotifications";
import AddFlightrecordPersonButton from "./AddFlightrecordPersonButton";
import { fetchPersonsForLog } from "../../util/http/person";
import PersonForLog from "./PersonForLog";

export const FlightRecordPersons = ({ id }) => {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["persons", "log", id],
    queryFn: ({ signal }) => fetchPersonsForLog({ signal, logUuid: id }),
    enabled: id !== "new",
    staleTime: 3600000,
    gcTime: 3600000,
  });
  useErrorNotification({ isError, error, fallbackMessage: 'Failed to load persons' });

  if (id === "new") return null;

  return (
    <ApplePanel title="Persons" subtitle="People linked to this flight." actions={<AddFlightrecordPersonButton id={id} />}>
      <div className="apple-list-stack">
        {(Array.isArray(data) ? data : []).map((person) => (
          <PersonForLog key={person.uuid} person={person} logUuid={id} />
        ))}
        {!isLoading && (!Array.isArray(data) || data.length === 0) ? <div className="apple-empty-state">No persons linked</div> : null}
      </div>
    </ApplePanel>
  );
};

export default FlightRecordPersons;
