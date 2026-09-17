import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
// Custom
import { useErrorNotification } from "../../../hooks/useAppNotifications";
import { fetchLogbookData } from "../../../util/http/logbook";
import { getTotalsByAircraft } from "../../../util/helpers";
import TotalsByAircraftTable from "./TotalsByAircraftTable";
import { fetchAircraftModelsCategories, fetchAircrafts } from "../../../util/http/aircraft";
import useCustomFields from "../../../hooks/useCustomFields";
import { DEFAULT_CATEGORIES, splitCategories } from "../../Aircrafts/aircraftCategories";

export const TotalsByAircraft = ({ type }) => {
  const { data: flights = [], isLoading, isError, error } = useQuery({
    queryKey: ['logbook'],
    queryFn: ({ signal }) => fetchLogbookData({ signal }),
    staleTime: 3600000,
    gcTime: 3600000,
  });
  useErrorNotification({ isError, error, fallbackMessage: 'Failed to load logbook' });

  const { data: models = [] } = useQuery({
    queryKey: ['models-categories'],
    queryFn: ({ signal }) => fetchAircraftModelsCategories({ signal }),
    staleTime: 3600000,
    gcTime: 3600000,
  });

  const { data: aircrafts = [] } = useQuery({
    queryKey: ['aircrafts'],
    queryFn: ({ signal }) => fetchAircrafts({ signal }),
    staleTime: 3600000,
    gcTime: 3600000,
  })

  const { customFields } = useCustomFields();

  const allCategories = useMemo(() => {
    if (type !== 'category') return [];
    const values = [...DEFAULT_CATEGORIES];
    models.forEach((row) => values.push(...splitCategories(row?.category)));
    aircrafts.forEach((row) => {
      values.push(...splitCategories(row?.category));
      values.push(...splitCategories(row?.model_category));
      values.push(...splitCategories(row?.custom_category));
    });
    return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));
  }, [type, models, aircrafts]);

  const totalsData = useMemo(() =>
    getTotalsByAircraft(flights, type, models, aircrafts, customFields, allCategories),
    [flights, type, models, aircrafts, customFields, allCategories]
  );

  return (
    <TotalsByAircraftTable
      type={type}
      data={totalsData}
      isLoading={isLoading}
      customFields={customFields ?? []}
    />
  );
}

export default TotalsByAircraft;