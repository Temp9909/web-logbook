import { useQuery } from "@tanstack/react-query";
import AircraftsTable from "./AircraftsTable";
import CategoriesTable from "./CategoriesTable";
import { useErrorNotification } from "../../hooks/useAppNotifications";
import { fetchAircraftModelsCategories, fetchAircraftsBuildList } from "../../util/http/aircraft";
import AppleLegacyHeading from "../UIElements/AppleLegacyHeading";
import ApplePanel from "../UIElements/ApplePanel";

export const Aircrafts = () => {
  const { data: aircrafts, isLoading: isLoadingAircrafts, isError: isErrorAircrafts, error: errorAircrafts, isSuccess: isSuccessAircrafts } = useQuery({
    queryKey: ['aircrafts', 'build-list'],
    queryFn: ({ signal }) => fetchAircraftsBuildList({ signal }),
    staleTime: 3600000,
    gcTime: 3600000,
  });
  useErrorNotification({ isError: isErrorAircrafts, error: errorAircrafts, fallbackMessage: 'Failed to load aircrafts' });

  const { data: categories, isLoading: isLoadingCategories, isError: isErrorCategories, error: errorCategories } = useQuery({
    queryKey: ['models-categories'],
    queryFn: ({ signal }) => fetchAircraftModelsCategories({ signal }),
    staleTime: 3600000,
    gcTime: 3600000,
    enabled: isSuccessAircrafts,
  });
  useErrorNotification({ isError: isErrorCategories, error: errorCategories, fallbackMessage: 'Failed to load categories' });

  return (
    <section className="apple-legacy-screen apple-aircrafts-screen">
      <AppleLegacyHeading title="Aircrafts" subtitle="Manage registrations, aircraft types and categories." />
      <div className="apple-split-layout">
        <ApplePanel title="Aircrafts" subtitle="Registrations and aircraft types used by your logbook.">
          <AircraftsTable data={aircrafts} isLoading={isLoadingAircrafts} embedded />
        </ApplePanel>
        <ApplePanel title="Types & categories" subtitle="Configure aircraft categories and automatic time rules.">
          <CategoriesTable data={categories} isLoading={isLoadingCategories} embedded />
        </ApplePanel>
      </div>
    </section>
  );
}

export default Aircrafts;
