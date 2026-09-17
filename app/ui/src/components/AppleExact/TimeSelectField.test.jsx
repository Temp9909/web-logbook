import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TimeSelectField } from './Primitives';

describe('TimeSelectField', () => {
  it('keeps clock time manually editable while preserving HHMM storage', () => {
    const onChange = vi.fn();
    render(<TimeSelectField label="Departure time (UTC)" mode="clock" value="0910" onChange={onChange} />);

    const manual = screen.getByLabelText('Departure time (UTC) manual entry');
    const picker = screen.getByLabelText('Departure time (UTC) picker');

    expect(manual).toHaveAttribute('type', 'text');
    expect(manual).toHaveValue('09:10');
    expect(picker).toHaveAttribute('type', 'time');
    expect(picker).toHaveValue('09:10');

    fireEvent.change(manual, { target: { value: '11:25' } });
    expect(onChange).toHaveBeenCalledWith('1125', expect.anything());
  });

  it('accepts compact manual clock entry such as 0930', () => {
    const onChange = vi.fn();
    render(<TimeSelectField label="Departure time (UTC)" mode="clock" value="" onChange={onChange} />);
    const manual = screen.getByLabelText('Departure time (UTC) manual entry');

    fireEvent.change(manual, { target: { value: '0930' } });
    expect(onChange).toHaveBeenCalledWith('0930', expect.anything());
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

  it('opens the native picker from the surrounding zone but preserves direct manual input clicks', () => {
    render(<TimeSelectField label="Arrival time (UTC)" mode="clock" value="1125" onChange={() => {}} />);
    const manual = screen.getByLabelText('Arrival time (UTC) manual entry');
    const picker = screen.getByLabelText('Arrival time (UTC) picker');
    const row = manual.closest('.exact-native-time-row');
    picker.showPicker = vi.fn();

    fireEvent.click(manual);
    expect(picker.showPicker).not.toHaveBeenCalled();

    fireEvent.click(row);
    expect(picker.showPicker).toHaveBeenCalledTimes(1);
  });

  it('uses the native picker value when the surrounding zone opens it', () => {
    const onChange = vi.fn();
    render(<TimeSelectField label="Arrival time (UTC)" mode="clock" value="" onChange={onChange} />);
    const picker = screen.getByLabelText('Arrival time (UTC) picker');

    fireEvent.change(picker, { target: { value: '14:42' } });
    expect(onChange).toHaveBeenCalledWith('1442', expect.anything());
  });
});
