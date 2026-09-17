import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
// Custom
import Select from "./Select";
import { fetchAircraftModelsCategories, fetchAircraftsBuildList } from "../../util/http/aircraft";
import { DEFAULT_CATEGORIES, splitCategories } from "../Aircrafts/aircraftCategories";

const getUniqueCategoriesFromKey = (items, key) => {
  const set = new Set();
  (Array.isArray(items) ? items : []).forEach((item) => {
    splitCategories(item?.[key]).forEach((category) => set.add(category));
  });
  return Array.from(set).sort((a, b) => a.localeCompare(b));
};

const getAllAircraftCategories = (items) => {
  const values = [...DEFAULT_CATEGORIES];
  (Array.isArray(items) ? items : []).forEach((item) => {
    values.push(...splitCategories(item?.category));
    values.push(...splitCategories(item?.model_category));
    values.push(...splitCategories(item?.custom_category));
  });
  return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));
};

export const AircraftCategories = ({
  gsize,
  id = "category",
  label = "Category",
  tooltip = "Aircraft Category",
  options = "models",
  value,
  handleChange,
  ...props
}) => {

  const { data: modelCategoriesOptions = [] } = useQuery({
    queryFn: ({ signal }) => fetchAircraftModelsCategories({ signal }),
    queryKey: ['models-categories'],
    staleTime: 3600000,
    gcTime: 3600000,
    select: data => getUniqueCategoriesFromKey(data, "category"),
  })

  const { data: aircraftCategoriesOptions = [] } = useQuery({
    queryKey: ['aircrafts', 'build-list'],
    queryFn: ({ signal }) => fetchAircraftsBuildList({ signal }),
    staleTime: 3600000,
    gcTime: 3600000,
    select: data => getAllAircraftCategories(data),
  });

  const selectOptions = useMemo(() => {
    if (options === "models") return modelCategoriesOptions ?? [];
    if (options === "custom") return aircraftCategoriesOptions ?? [];
    if (options === "all")
      return Array.from(new Set([
        ...DEFAULT_CATEGORIES,
        ...(modelCategoriesOptions ?? []),
        ...(aircraftCategoriesOptions ?? [])
      ])).sort((a, b) => a.localeCompare(b));
    return [];
  }, [options, modelCategoriesOptions, aircraftCategoriesOptions]);

  return (
    <Select gsize={gsize}
      id={id}
      label={label}
      handleChange={handleChange}
      value={value}
      tooltip={tooltip}
      options={selectOptions}
      multiple
      freeSolo={true}
      {...props}
    />
  );
}

export default AircraftCategories;