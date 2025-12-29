import React from 'react';

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  label?: string;
  className?: string;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  label = "Date Range",
  className = ""
}) => {
  const today = new Date().toISOString().split('T')[0];
  
  const setQuickRange = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    
    onEndDateChange(end.toISOString().split('T')[0]);
    onStartDateChange(start.toISOString().split('T')[0]);
  };
  
  const setCurrentMonth = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    onStartDateChange(start.toISOString().split('T')[0]);
    onEndDateChange(end.toISOString().split('T')[0]);
  };
  
  const setLastMonth = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 0);
    
    onStartDateChange(start.toISOString().split('T')[0]);
    onEndDateChange(end.toISOString().split('T')[0]);
  };
  
  return (
    <div className={`date-range-picker ${className}`}>
      <label className="filter-label">{label}:</label>
      
      <div className="quick-filters">
        <button type="button" onClick={() => setQuickRange(7)} className="quick-filter-btn">
          Last 7 Days
        </button>
        <button type="button" onClick={() => setQuickRange(30)} className="quick-filter-btn">
          Last 30 Days
        </button>
        <button type="button" onClick={setCurrentMonth} className="quick-filter-btn">
          This Month
        </button>
        <button type="button" onClick={setLastMonth} className="quick-filter-btn">
          Last Month
        </button>
      </div>
      
      <div className="date-inputs">
        <div className="date-input-group">
          <label htmlFor="start-date">From:</label>
          <input
            id="start-date"
            type="date"
            value={startDate}
            max={endDate || today}
            onChange={(e) => onStartDateChange(e.target.value)}
            className="date-input"
          />
        </div>
        <div className="date-input-group">
          <label htmlFor="end-date">To:</label>
          <input
            id="end-date"
            type="date"
            value={endDate}
            min={startDate}
            max={today}
            onChange={(e) => onEndDateChange(e.target.value)}
            className="date-input"
          />
        </div>
      </div>
    </div>
  );
};

export default DateRangePicker;
