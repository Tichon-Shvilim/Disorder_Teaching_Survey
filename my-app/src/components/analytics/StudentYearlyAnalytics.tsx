import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import YearlyBarChart from './YearlyBarChart';
import { Box, Checkbox, FormControlLabel, FormGroup, Typography } from '@mui/material';
import type { FormSubmission } from '../formManagement/models/FormModels';

interface YearlyScore {
  year: string;
  averageScore: number;
  submissions: number;
}

interface StudentYearlyAnalyticsProps {
  submissions: FormSubmission[];
}


const StudentYearlyAnalytics: React.FC<StudentYearlyAnalyticsProps> = ({ submissions }) => {
  const { t } = useTranslation('analyticsSettings');
  const [selectedYears, setSelectedYears] = useState<string[]>([]);

  const scoreColorRanges: Array<{ label: string; min: number; max: number; color: string }> = useMemo(() => {
    const settings = submissions.find((submission) => submission.graphSettings?.colorRanges?.length)?.graphSettings;
    if (settings?.colorRanges?.length) {
      return settings.colorRanges;
    }

    return [
      { label: t('excellent', 'Excellent'), min: 80, max: 100, color: '#10b981' },
      { label: t('good', 'Good'), min: 60, max: 79, color: '#f59e0b' },
      { label: t('average', 'Average'), min: 40, max: 59, color: '#facc15' },
      { label: t('poor', 'Poor'), min: 0, max: 39, color: '#ef4444' }
    ];
  }, [submissions, t]);

  const yearlyMap: { [year: string]: { scores: number[]; submissions: number } } = {};
  const usedSubmissions: Array<{ submittedAt?: Date | string; totalScore: number }> = [];
  submissions.forEach(sub => {
    if (!sub.submittedAt) return;
    if (typeof sub.totalScore !== 'number') return;

    const score = sub.totalScore;
    usedSubmissions.push({ ...sub, totalScore: score });
    const year = new Date(sub.submittedAt).getFullYear().toString();
    if (!yearlyMap[year]) yearlyMap[year] = { scores: [], submissions: 0 };
    yearlyMap[year].scores.push(score);
    yearlyMap[year].submissions++;
  });
  console.log('Used submissions for yearly graph:', usedSubmissions);
  const data: YearlyScore[] = Object.entries(yearlyMap).map(([year, { scores, submissions }]) => ({
    year,
    averageScore: scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0,
    submissions
  }));
  console.log('Yearly graph data:', data);
  const allYears = data.map(item => item.year);
  const filteredData = selectedYears.length > 0 ? data.filter(item => selectedYears.includes(item.year)) : data;
  if (!data.length) return <div>{t('noData', 'No data to display.')}</div>;
  // שינוי בחירת שנים
  const handleYearToggle = (year: string) => {
    setSelectedYears((prev) =>
      prev.includes(year) ? prev.filter((y) => y !== year) : [...prev, year]
    );
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>גרף ציונים לפי שנים</Typography>

      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle2">{t('selectYearsToDisplay', 'Select years to display (optional):')}</Typography>
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
        <YearlyBarChart data={filteredData} colorRanges={scoreColorRanges} />
      </Box>
    </Box>
  );
};

export default StudentYearlyAnalytics;
