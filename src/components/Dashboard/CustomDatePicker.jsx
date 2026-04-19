import React, { forwardRef } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Calendar } from 'lucide-react';

const CustomInput = forwardRef(({ value, onClick, placeholder }, ref) => (
  <button
    className="custom-datepicker-input"
    onClick={onClick}
    ref={ref}
    type="button"
  >
    <span className={value ? "value-text" : "placeholder-text"}>
      {value || placeholder || 'Select date'}
    </span>
    <Calendar size={14} className="calendar-icon" />
  </button>
));
CustomInput.displayName = 'CustomInput';

export default function CustomDatePicker({ selected, onChange, placeholderText, selectsStart, selectsEnd, startDate, endDate }) {
  return (
    <div className="custom-datepicker-wrapper">
      <DatePicker
        selected={selected ? new Date(selected + 'T12:00:00') : null}
        onChange={(date) => {
          if (!date) {
            onChange('');
            return;
          }
          // Format as YYYY-MM-DD
          const  year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          onChange(`${year}-${month}-${day}`);
        }}
        selectsStart={selectsStart}
        selectsEnd={selectsEnd}
        startDate={startDate ? new Date(startDate + 'T12:00:00') : null}
        endDate={endDate ? new Date(endDate + 'T12:00:00') : null}
        customInput={<CustomInput placeholder={placeholderText} />}
        showPopperArrow={false}
        dateFormat="MMM d, yyyy"
        isClearable={false}
        showMonthDropdown
        showYearDropdown
        dropdownMode="select"
      />
    </div>
  );
}
