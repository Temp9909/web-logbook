import { useContext } from 'react';
import { useLocation } from 'react-router-dom';
import { ColorModeContext } from '../../../context/ColorModeContext';

const TITLES = { logbook:'Logbook', licensing:'Licensing', map:'Map', aircrafts:'Aircrafts', persons:'Persons', attachments:'Attachments', stats:'Stats', currency:'Currency', export:'Export', import:'Import', settings:'Settings' };

export default function DashboardToolbar({ onMenu, menuOpen }) {
  const { toggleColorMode } = useContext(ColorModeContext);
  const location = useLocation();
  const segment = location.pathname.split('/').filter(Boolean)[0] || 'logbook';
  return (
    <header className="topbar">
      <button className="icon-btn" title={menuOpen ? 'Hide sidebar' : 'Show sidebar'} aria-label={menuOpen ? 'Hide sidebar' : 'Show sidebar'} aria-expanded={menuOpen} onClick={onMenu}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
      </button>
      <span className="title">{TITLES[segment] || 'Logbook'}</span>
      <span className="spacer" />
      <button className="icon-btn" title="Light / dark mode" aria-label="Light / dark mode" onClick={toggleColorMode}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>
      </button>
    </header>
  );
}
