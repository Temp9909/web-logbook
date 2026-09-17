import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SwitchColorMenu } from './Settings';

describe('SwitchColorMenu', () => {
  it('opens above the page and applies the selected preset', async () => {
    const onChange = vi.fn();
    render(<SwitchColorMenu value="" onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: /Automatic/i }));
    const blue = await screen.findByRole('menuitemradio', { name: 'Blue' });
    fireEvent.click(blue);

    expect(onChange).toHaveBeenCalledWith('#007AFF');
  });
});
