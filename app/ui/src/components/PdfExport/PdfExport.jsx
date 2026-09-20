import { lazy, Suspense, useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { fetchSettings } from '../../util/http/settings';
import { fetchExport, fetchExportPreview } from '../../util/http/export';
import { fetchLogbookData } from '../../util/http/logbook';
import { exportRowsToCsv } from '../UIElements/CSVExportButton';
import { Card, PageHead } from '../AppleExact/Primitives';

const PDF_FORMAT = 'A4';
const EASA_ROWS_PER_PAGE = 12;
const PdfCanvasPreview = lazy(() => import('./PdfCanvasPreview'));

const usesDesktopSafariPdfViewer = () => {
  const ua = navigator.userAgent;
  const safari = /Safari/i.test(ua) && !/(Chrome|Chromium|CriOS|Edg|OPR|Vivaldi|FxiOS)/i.test(ua);
  const ios = /iPad|iPhone|iPod/i.test(ua) || (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1);
  return safari && !ios;
};

const downloadBlob = (blob, name) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

const normalizePdfSettings = (source) => ({
  ...(source || {}),
  logbook_rows: EASA_ROWS_PER_PAGE,
  is_extended: true,
});

export const PdfExport = () => {
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewError, setPreviewError] = useState('');
  const useNativePreview = usesDesktopSafariPdfViewer();
  const { data, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: ({ signal }) => fetchSettings({ signal }),
  });
  const { data: logbookData = [], isLoading: isLogbookLoading } = useQuery({
    queryKey: ['logbook'],
    queryFn: ({ signal }) => fetchLogbookData({ signal }),
    staleTime: 3600000,
    gcTime: 3600000,
  });

  const csvRows = Array.isArray(logbookData)
    ? logbookData.filter((row) => row?.uuid !== 'previous-experience-artificial-uuid')
    : [];

  const replacePreview = (blob) => {
    const next = URL.createObjectURL(blob);
    setPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return next;
    });
  };

  const preview = useMutation({
    mutationFn: (previewSettings) => fetchExportPreview({
      format: PDF_FORMAT,
      settings: normalizePdfSettings(previewSettings),
    }),
    onMutate: () => setPreviewError(''),
    onSuccess: (blob) => replacePreview(blob),
    onError: (error) => setPreviewError(
      error?.info?.message || error?.message || 'Could not generate the PDF preview.',
    ),
  });

  useEffect(() => {
    if (!data?.export_a4) return;
    preview.mutate(data.export_a4);
    // Generate once when the saved settings arrive.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const exp = useMutation({
    mutationFn: () => fetchExport(PDF_FORMAT),
    onSuccess: (blob) => downloadBlob(blob, 'logbook-a4.pdf'),
  });

  return (
    <section className="exact-react-page">
      <PageHead
        title="Export"
        subtitle="Preview your EASA logbook in A4 landscape format — the exact EASA 1–8 and 9–12 tables are joined on the same page."
        actions={(
          <>
            <button
              className="btn ghost exact-secondary-action"
              disabled={isLogbookLoading || csvRows.length === 0}
              onClick={() => exportRowsToCsv(csvRows, 'logbook')}
            >
              Export CSV
            </button>
            <button className="btn primary" disabled={exp.isPending} onClick={() => exp.mutate()}>
              {exp.isPending ? 'Preparing…' : 'Export PDF'}
            </button>
          </>
        )}
      />

      <Card title="Preview" subtitle="A4 landscape · EASA AMC1 FCL.050 · 12 entries · exact page-94/page-95 geometry joined on one page · columns 1–8 + 9–12.">
        {previewError ? <div className="note exact-preview-error">{previewError}</div> : null}
        {!previewError && previewUrl ? (
          useNativePreview
            ? <iframe className="exact-pdf-preview-frame" src={`${previewUrl}#page=2&zoom=page-fit`} title="A4 PDF preview" />
            : <Suspense fallback={<div className="exact-preview-loading">Preparing PDF viewer…</div>}><PdfCanvasPreview key={previewUrl} src={previewUrl} /></Suspense>
        ) : null}
        {!previewError && !previewUrl && !isLoading ? (
          <div className="exact-preview-loading">Generating PDF preview…</div>
        ) : null}
      </Card>
    </section>
  );
};

export default PdfExport;
