import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useErrorNotification } from '../../../hooks/useAppNotifications';
import { fetchLogbookData } from '../../../util/http/logbook';
import { getTotalsByMonthAndYear } from '../../../util/helpers';
import useCustomFields from '../../../hooks/useCustomFields';
import useSettings from '../../../hooks/useSettings';
import { Loading, PageHead } from '../../AppleExact/Primitives';
import StatsBookTable from '../StatsBookTable';

const EMPTY = {};
const monthLabel = (value) => new Date(2000, Math.max(0, Number(value || 1) - 1), 1).toLocaleString(undefined, { month: 'long' });

const useTotalsData = (data) => {
  const dataByYear = useMemo(() => {
    if (!Array.isArray(data) || data.length === 0) return EMPTY;
    return data.reduce((grouped, item) => {
      const year = String(item.year || '');
      if (!grouped[year]) grouped[year] = [];
      grouped[year].push(item);
      return grouped;
    }, {});
  }, [data]);
  const sortedYears = useMemo(() => Object.keys(dataByYear).sort((a, b) => Number(b) - Number(a)), [dataByYear]);
  return { dataByYear, sortedYears };
};

export const TotalsByYear = () => {
  const [activeYear, setActiveYear] = useState('');
  const { fieldName } = useSettings();
  const { customFields = [] } = useCustomFields();
  const { data = [], isLoading, isError, error } = useQuery({
    queryKey: ['logbook'],
    queryFn: ({ signal }) => fetchLogbookData({ signal }),
    staleTime: 3600000,
    gcTime: 3600000,
  });
  useErrorNotification({ isError, error, fallbackMessage: 'Failed to load logbook' });

  const totals = useMemo(() => getTotalsByMonthAndYear(Array.isArray(data) ? data : [], customFields || []), [data, customFields]);
  const { dataByYear, sortedYears } = useTotalsData(totals);
  const selectedYear = sortedYears.includes(activeYear) ? activeYear : (sortedYears[0] || '');
  const rows = dataByYear[selectedYear] || [];

  return <section className="exact-react-page exact-stats-page">
    <PageHead title="Stats by year" subtitle="Monthly flight-time totals in the same Apple logbook format." />
    <Loading show={isLoading} />
    <div className="segmented exact-scroll-segmented exact-year-selector" role="tablist" aria-label="Year">
      {sortedYears.map((year) => <button key={year} type="button" className={selectedYear === year ? 'on' : ''} onClick={() => setActiveYear(year)}>{year}</button>)}
    </div>
    <StatsBookTable
      rows={rows}
      groupLabel="Month"
      groupValue={(row) => monthLabel(row?.month)}
      customFields={customFields}
      fieldName={fieldName}
      exportFilename={`stats-by-year-${selectedYear || 'all'}.csv`}
      showTotals
      loading={isLoading}
    />
  </section>;
};

export default TotalsByYear;
