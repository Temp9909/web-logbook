import { handleFetch } from './http';
import { API_URL } from '../../constants/constants';
import { getAuthToken } from '../auth';

export const fetchExport = async (format) => {
  const url = `${API_URL}/export/${format}`;
  const options = {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${getAuthToken()}` },
  };
  const blob = await handleFetch(url, options, 'Cannot export logbook data', false);
  return blob;
}

export const fetchExportPreview = async ({ format, settings }) => {
  const url = `${API_URL}/export/preview/${format}`;
  const options = {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getAuthToken()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(settings),
  };
  return await handleFetch(url, options, 'Cannot generate PDF preview', false);
}

export const uploadCustomTitle = async ({ payload }) => {
  const url = `${API_URL}/export/custom-title`;
  const options = {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${getAuthToken()}` },
    body: payload,
  };
  return await handleFetch(url, options, 'Cannot upload custom title', false);
}