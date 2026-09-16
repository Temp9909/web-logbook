import { useQuery } from "@tanstack/react-query";
import StandardAirportsTable from "./StandardAirportsTable";
import AirportsDB from "./AirportsDB";
import CustomAirportsTable from "./CustomAirportsTable";
import { useErrorNotification } from "../../hooks/useAppNotifications";
import { fetchCustomAirports, fetchStandardAirports } from "../../util/http/airport";
import AppleLegacyHeading from "../UIElements/AppleLegacyHeading";
import ApplePanel from "../UIElements/ApplePanel";
import UpdateAirportsDBButton from "./UpdateAirportsDBButton";

export const Airports = () => {
  const { data: standardAirportsData, isLoading: isStandardAirportsLoading, isError: isStandardAirportsError, error: standardAirportsError } = useQuery({
    queryKey: ['airports'],
    queryFn: ({ signal }) => fetchStandardAirports({ signal }),
    staleTime: 3600000,
    gcTime: 3600000,
  });
  useErrorNotification({ isStandardAirportsError, standardAirportsError, fallbackMessage: 'Failed to load airports' });

  const { data: customAirportsData, isLoading: isCustomAirportsLoading, isError: isCustomAirportsError, error: customAirportsError } = useQuery({
    queryKey: ['custom-airports'],
    queryFn: ({ signal }) => fetchCustomAirports({ signal }),
    staleTime: 3600000,
    gcTime: 3600000,
  });
  useErrorNotification({ isCustomAirportsError, customAirportsError, fallbackMessage: 'Failed to load airports' });

  return (
    <section className="apple-legacy-screen apple-airports-screen">
      <AppleLegacyHeading title="Airports" subtitle="Standard airports, database source and your custom airports." />
      <div className="apple-stack">
        <ApplePanel title="Standard airports" subtitle="Browse the airport database used by the logbook.">
          <StandardAirportsTable data={standardAirportsData} isLoading={isStandardAirportsLoading} embedded />
        </ApplePanel>

        <div className="apple-split-layout apple-airports-lower">
          <ApplePanel
            title="Airport DB source"
            subtitle="Choose the source and refresh the airports database."
            actions={<UpdateAirportsDBButton />}
          >
            <AirportsDB embedded />
          </ApplePanel>

          <ApplePanel title="Custom airports" subtitle="Create and manage your own airports.">
            <CustomAirportsTable data={customAirportsData} isLoading={isCustomAirportsLoading} embedded />
          </ApplePanel>
        </div>
      </div>
    </section>
  );
}

export default Airports;
