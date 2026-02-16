/// <reference path="../date-fns-locale.d.ts" />
/// <reference path="../date-fns-locale.d.ts" />
import React, { useState, useEffect } from 'react';
import httpService from './Api-Requests/httpService';
import DomainBarChart from './DomainBarChart';
import { Box, Checkbox, FormControlLabel, FormGroup, Typography, TextField } from '@mui/material';
//port { DateRangePicker } from '@mui/x-date-pickers-pro';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateRangePicker } from '@mui/x-date-pickers-pro';
import { he as heLocale } from 'date-fns/locale';

interface YearlyScore {
  year: string;
  averageScore: number;
  submissions: number;
}

interface StudentYearlyAnalyticsProps {
  studentId: string;
}

const StudentYearlyAnalytics: React.FC<StudentYearlyAnalyticsProps> = ({ studentId }) => {
  const [data, setData] = useState<YearlyScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
  const [selectedYears, setSelectedYears] = useState<string[]>([]);

  // טוען נתונים מהשרת לפי טווח תאריכים
  useEffect(() => {
    const fetchYearlyAnalytics = async () => {
      try {
        setLoading(true);
        setError(null);
        const params: any = {};
        if (dateRange[0]) params.startDate = dateRange[0].toISOString();
        if (dateRange[1]) params.endDate = dateRange[1].toISOString();
        const response = await httpService.get(`/analytics/student/${studentId}/yearly`, { params });
        if (response.data.success) {
          setData(response.data.data);
        } else {
          setError(response.data.message || 'Failed to fetch yearly analytics');
        }
      } catch (err: unknown) {
        setError('שגיאה בטעינת נתוני גרף שנתי');
      } finally {
        setLoading(false);
      }
    };
    if (studentId) fetchYearlyAnalytics();
  }, [studentId, dateRange]);

  // הפקת רשימת שנים מתוך הנתונים
  const allYears = Array.from(new Set(data.map((item) => item.year)));

  // סינון לפי שנים שנבחרו
  const filteredData = selectedYears.length > 0
    ? data.filter((item) => selectedYears.includes(item.year))
    : data;

  if (loading) return <div>טוען גרף שנתי...</div>;
  if (error) return <div style={{color:'red'}}>{error}</div>;
  if (!data.length) return <div>אין נתונים להצגה.</div>;

  // התאמה ל-DomainBarChart: year כשם, averageScore כציון
  const chartData = filteredData.map((item) => ({
    nodeId: item.year,
    title: item.year,
    averageScore: item.averageScore,
    totalQuestions: item.submissions,
  }));

  // שינוי בחירת שנים
  const handleYearToggle = (year: string) => {
    setSelectedYears((prev) =>
      prev.includes(year) ? prev.filter((y) => y !== year) : [...prev, year]
    );
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>גרף ציונים לפי שנים</Typography>
      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={heLocale}>
        <DateRangePicker
          value={dateRange}
          onChange={(newValue: [Date | null, Date | null]) => setDateRange(newValue)}
          slots={{ field: TextField }}
          formatDensity="spacious"
          enableAccessibleFieldDOMStructure={false}
          selectedSections={undefined}
          onSelectedSectionsChange={() => {}}
        />
      </LocalizationProvider>
      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle2">בחר שנים להצגה (לא חובה):</Typography>
        <FormGroup row>
          {allYears.map((year) => (
            <FormControlLabel
              key={year}
              control={
                <Checkbox
                  checked={selectedYears.includes(year)}
                  onChange={() => handleYearToggle(year)}
                />
              }
              label={year}
            />
          ))}
        </FormGroup>
      </Box>
      <Box sx={{ mt: 3 }}>
        <DomainBarChart data={chartData} type="student" />
      </Box>
    </Box>
  );
};

export default StudentYearlyAnalytics;
