import { useState, useEffect, useRef } from 'react';
// MUI UI elements
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Typography from '@mui/material/Typography';
// Custom helpers
import { API_URL } from '../../constants/constants';
import { getAuthToken } from '../../util/auth';
import AppleDialogPanel from '../UIElements/AppleDialogPanel';

const ImportProgressDialog = ({ open, onClose, payload }) => {
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [status, setStatus] = useState('idle'); // 'idle' | 'running' | 'success' | 'error'
  const [errorMessage, setErrorMessage] = useState('');
  const [resultMessage, setResultMessage] = useState('');

  const abortControllerRef = useRef(null);

  useEffect(() => {
    if (open) {
      startImport();
    }
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);


  const startImport = async () => {
    setStatus('running');
    setProgress({ current: 0, total: payload?.data?.length || 0 });
    setErrorMessage('');
    setResultMessage('');

    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(`${API_URL}/import/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify(payload),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`Failed to import: ${response.statusText}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop(); // keep last incomplete line in buffer

        for (const line of lines) {
          if (line.trim()) {
            try {
              const chunk = JSON.parse(line);
              handleProgressChunk(chunk);
            } catch (e) {
              console.error('Error parsing line:', line, e);
            }
          }
        }
      }

      // Parse remaining buffer
      if (buffer.trim()) {
        try {
          const chunk = JSON.parse(buffer);
          handleProgressChunk(chunk);
        } catch (e) {
          console.error('Error parsing final buffer line:', buffer, e);
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        setStatus('error');
        setErrorMessage(err.message || 'An error occurred during import');
      }
    }
  };

  const handleProgressChunk = (chunk) => {
    switch (chunk.type) {
      case "progress":
        setProgress({
          current: chunk.current,
          total: chunk.total,
        });
        break;

      case "log":
        break;

      case "result":
        setProgress({
          current: chunk.current,
          total: chunk.total,
        });
        setStatus(chunk.ok ? "success" : "error");
        setResultMessage(chunk.message);
        break;

      default:
        console.warn("Unknown progress chunk:", chunk);
    }
  };


  return (
    <Dialog fullWidth maxWidth="md" open={open} onClose={() => status !== 'running' && onClose(status === 'success')}>
      <AppleDialogPanel
        title="Importing flight records"
        subtitle="Import progress."
        actions={(
          <Button
            className={status === 'running' ? undefined : 'exact-done-button'}
            onClick={() => onClose(status === 'success')}
            disabled={status === 'running'}
            variant="contained"
            color="primary"
          >
            {status === 'running' ? 'Importing…' : 'Done'}
          </Button>
        )}
      >
        {status === 'running' && (
          <Box sx={{ width: '100%', mt: 1, mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Processing {progress.current} of {progress.total}
            </Typography>
          </Box>
        )}

        {status === 'success' && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {resultMessage || `Successfully imported all flight records!`}
          </Alert>
        )}

        {status === 'error' && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {resultMessage || errorMessage || `Import completed with warnings or failed.`}
          </Alert>
        )}
      </AppleDialogPanel>
    </Dialog>
  );
};

export default ImportProgressDialog;
