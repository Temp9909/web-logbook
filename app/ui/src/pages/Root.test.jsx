import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Root from './Root';

vi.mock('../components/UIElements/Dashboard/DashboardToolbar', () => ({
  default: ({ onMenu, menuOpen }) => <button type="button" onClick={onMenu}>{menuOpen ? 'Hide sidebar' : 'Show sidebar'}</button>,
}));
vi.mock('../components/UIElements/Dashboard/DashboardNavbar', () => ({
  default: ({ open }) => <aside data-testid="sidebar" data-open={String(open)} />,
}));
vi.mock('../components/UIElements/Dashboard/DashboardPageContent', () => ({
  default: () => <main />,
}));

describe('desktop sidebar', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn((query) => ({
        matches: query === '(min-width: 801px)',
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    });
  });

  it('opens by default on Mac/desktop and can be retracted from the toolbar', () => {
    render(<Root />);
    expect(screen.getByTestId('sidebar')).toHaveAttribute('data-open', 'true');

    fireEvent.click(screen.getByRole('button', { name: 'Hide sidebar' }));
    expect(screen.getByTestId('sidebar')).toHaveAttribute('data-open', 'false');
    expect(screen.getByRole('button', { name: 'Show sidebar' })).toBeInTheDocument();
  });
});
