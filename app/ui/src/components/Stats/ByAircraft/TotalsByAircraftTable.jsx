import useSettings from '../../../hooks/useSettings';
import { Loading, PageHead } from '../../AppleExact/Primitives';
import StatsBookTable from '../StatsBookTable';

export const TotalsByAircraftTable = ({ data = [], isLoading, type, customFields = [] }) => {
  const { fieldName } = useSettings();
  const isType = type === 'type';
  const title = isType ? 'Stats by type' : 'Stats by category';
  const subtitle = isType
    ? 'Flight-time totals grouped by aircraft type in the Apple logbook format.'
    : 'Flight-time totals grouped by aircraft category in the Apple logbook format.';

  return <section className="exact-react-page exact-stats-page">
    <PageHead title={title} subtitle={subtitle} />
    <Loading show={isLoading} />
    <StatsBookTable
      rows={Array.isArray(data) ? data : []}
      groupLabel={isType ? 'Type' : 'Category'}
      groupValue={(row) => row?.model || ''}
      customFields={customFields}
      fieldName={fieldName}
      exportFilename={`stats-by-${isType ? 'type' : 'category'}.csv`}
      showTotals={isType}
      loading={isLoading}
      stickyGroup={false}
    />
  </section>;
};

export default TotalsByAircraftTable;
