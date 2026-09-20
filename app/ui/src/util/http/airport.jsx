import { handleFetch } from './http';
import { API_URL } from '../../constants/constants';
import { getAuthToken } from '../auth';

export const fetchAirport = async ({ signal, id }) => {
  const url = `${API_URL}/airport/${id}`;
  const options = {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${getAuthToken()}` },
    signal: signal,
  };
  return await handleFetch(url, options, 'Cannot fetch airport');
}

export const fetchAirports = async ({ signal }) => {
  const url = `${API_URL}/airport/list`;
  const options = {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${getAuthToken()}` },
    signal: signal,
  };
  return await handleFetch(url, options, 'Cannot fetch airports');
}

export const fetchAirportsByCodes = async ({ signal, codes }) => {
  const url = `${API_URL}/airport/resolve`;
  const options = {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getAuthToken()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ codes }),
    signal,
  };
  return await handleFetch(url, options, 'Cannot resolve airports');
};
