import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SwitchColorMenu } from './Settings';

describe('SwitchColorMenu', () => {
  it('uses the standard application select and applies the selected preset', () => {
    const onChange = vi.fn();
    render(<SwitchColorMenu value="" onChange={onChange} />);

    const select = screen.getByRole('combobox');
    expect(select).toHaveClass('select');
    fireEvent.change(select, { target: { value: '#007AFF' } });

    expect(onChange).toHaveBeenCalledWith('#007AFF');
  });
});
