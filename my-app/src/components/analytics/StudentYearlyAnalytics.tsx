/// <reference path="../date-fns-locale.d.ts" />
/// <reference path="../date-fns-locale.d.ts" />
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import YearlyBarChart from './YearlyBarChart';
import { Box, Checkbox, FormControlLabel, FormGroup, Typography, TextField } from '@mui/material';
//port { DateRangePicker } from '@mui/x-date-pickers-pro';
// הסרנו DateRangePicker וכל התלויות

interface YearlyScore {
  year: string;
  averageScore: number;
  submissions: number;
}

interface StudentYearlyAnalyticsProps {
  submissions: Array<{ submittedAt?: string; totalScore?: number }>; // Minimal shape
}


const StudentYearlyAnalytics: React.FC<StudentYearlyAnalyticsProps> = ({ submissions }) => {
  const { t } = useTranslation('analyticsSettings');
  const [selectedYears, setSelectedYears] = useState<string[]>([]);
  // Debug log: show all submissions and which are used for yearly graph
  console.log('All submissions:', submissions);
  const yearlyMap: { [year: string]: { scores: number[]; submissions: number } } = {};
  const usedSubmissions: Array<{ submittedAt?: string; totalScore?: number }> = [];
  submissions.forEach(sub => {
    if (!sub.submittedAt) return;
    // Treat null/undefined totalScore as 0 for completed submissions
    const score = typeof sub.totalScore === 'number' ? sub.totalScore : 0;
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
      <Typography variant="h6" gutterBottom>{t('yearlyScoresChart', 'Yearly Scores Chart')}</Typography>
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
        <YearlyBarChart data={filteredData} />
      </Box>
    </Box>
  );
};

export default StudentYearlyAnalytics;
