import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TimeSelectField } from './Primitives';

describe('TimeSelectField', () => {
  it('uses the native system time control and stores clock time as HHMM', () => {
    const onChange = vi.fn();
    render(<TimeSelectField label="Departure time (UTC)" mode="clock" value="0910" onChange={onChange} />);
    const input = screen.getByLabelText('Departure time (UTC)');
    expect(input).toHaveAttribute('type', 'time');
    expect(input).toHaveValue('09:10');
    fireEvent.change(input, { target: { value: '11:25' } });
    expect(onChange).toHaveBeenCalledWith('1125', expect.anything());
  });

  it('shows quick fill only while a duration field is empty', () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <TimeSelectField label="PIC" value="" onChange={onChange} quickFillValue="0:56" quickFillLabel="+56" />,
    );
    fireEvent.click(screen.getByRole('button', { name: '+56' }));
    expect(onChange).toHaveBeenCalledWith('0:56');

    rerender(<TimeSelectField label="PIC" value="0:56" onChange={onChange} quickFillValue="0:56" quickFillLabel="+56" />);
    expect(screen.queryByRole('button', { name: '+56' })).not.toBeInTheDocument();
  });

  it('opens the native picker from the surrounding zone but preserves direct input clicks', () => {
    render(<TimeSelectField label="Arrival time (UTC)" mode="clock" value="1125" onChange={() => {}} />);
    const input = screen.getByLabelText('Arrival time (UTC)');
    const row = input.closest('.exact-native-time-row');
    input.showPicker = vi.fn();

    fireEvent.click(input);
    expect(input.showPicker).not.toHaveBeenCalled();

    fireEvent.click(row);
    expect(input.showPicker).toHaveBeenCalledTimes(1);
  });
});
