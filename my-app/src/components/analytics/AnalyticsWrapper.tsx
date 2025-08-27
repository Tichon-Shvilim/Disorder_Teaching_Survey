import React, { useState } from 'react';
import Analytics from './Analytics';

interface AnalyticsWrapperProps {
  studentId?: string;
  classId?: string;
  questionnaireId?: string;
  startDate?: string;
  endDate?: string;
}

const AnalyticsWrapper: React.FC<AnalyticsWrapperProps> = ({ 
  studentId, 
  classId, 
  questionnaireId,
  startDate,
  endDate
}) => {
  const [calculationError, setCalculationError] = useState<string | null>(null);

  // Determine which type of analytics to show
  const analyticsType = studentId ? 'student' : 'class';
  const analyticsId = studentId || classId;

  if (!analyticsId) {
    return (
      <div className="analytics-wrapper">
        <div className="error">
          <p>No student or class ID provided for analytics</p>
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-wrapper">
      {calculationError && (
        <div className="calculation-error">
          <p>Error calculating analytics: {calculationError}</p>
          <button 
            onClick={() => setCalculationError(null)}
            className="dismiss-error"
          >
            Dismiss
          </button>
        </div>
      )}

      <Analytics
        type={analyticsType}
        id={analyticsId}
        questionnaireId={questionnaireId}
        startDate={startDate}
        endDate={endDate}
      />
    </div>
  );
};

export default AnalyticsWrapper;
