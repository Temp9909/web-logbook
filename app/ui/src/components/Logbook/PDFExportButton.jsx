import AppleToolbarButton from '../UIElements/AppleToolbarButton';
import { useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import Tooltip from '@mui/material/Tooltip';
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined';
import { useErrorNotification, useSuccessNotification } from '../../hooks/useAppNotifications';
import { fetchExport } from '../../util/http/export';

export const PDFExportButton = () => {
  const {
    mutateAsync: runExport,
    isPending: isExporting,
    isError: isExportError,
    error: exportError,
    isSuccess: isExportSuccess,
  } = useMutation({
    mutationFn: async () => {
      const blob = await fetchExport('A4');
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'logbook-A4.pdf';
      link.click();
      window.URL.revokeObjectURL(url);
    },
  });

  useErrorNotification({ isError: isExportError, error: exportError, fallbackMessage: 'Failed to export PDF' });
  useSuccessNotification({ isSuccess: isExportSuccess, message: 'PDF exported successfully' });

  const handleExport = useCallback(async () => {
    if (!isExporting) await runExport();
  }, [isExporting, runExport]);

  return (
    <Tooltip title="Export PDF (A4 landscape)">
      <span>
        <AppleToolbarButton onClick={handleExport} color="default" label="PDF Export" disabled={isExporting}>
          <PictureAsPdfOutlinedIcon />
        </AppleToolbarButton>
      </span>
    </Tooltip>
  );
}

export default PDFExportButton;
