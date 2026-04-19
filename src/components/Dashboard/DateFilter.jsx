import CustomDatePicker from './CustomDatePicker';

export default function DateFilter({ dateRange, onDateChange, dateColumn }) {
  if (!dateColumn) return null;

  return (
    <div className="date-filter">
      <label>Filter by date:</label>
      <CustomDatePicker
        selected={dateRange.start}
        onChange={(val) => onDateChange({ ...dateRange, start: val })}
        placeholderText="Start date"
        selectsStart
        startDate={dateRange.start}
        endDate={dateRange.end}
      />
      <span style={{ color: 'var(--text-tertiary)', fontSize: '13px' }}>to</span>
      <CustomDatePicker
        selected={dateRange.end}
        onChange={(val) => onDateChange({ ...dateRange, end: val })}
        placeholderText="End date"
        selectsEnd
        startDate={dateRange.start}
        endDate={dateRange.end}
      />
      {(dateRange.start || dateRange.end) && (
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => onDateChange({ start: '', end: '' })}
        >
          Clear
        </button>
      )}
    </div>
  );
}
