import React from 'react';
import { useTranslation } from 'react-i18next';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell } from 'recharts';

interface YearlyBarChartProps {
  data: Array<{ year: string; averageScore: number; submissions: number }>;
  colorRanges?: Array<{ label: string; min: number; max: number; color: string }>;
}

const YearlyBarChart: React.FC<YearlyBarChartProps> = ({ data, colorRanges }) => {
  const { t } = useTranslation('analyticsSettings');

  const getScoreColor = (score: number) => {
    if (colorRanges?.length) {
      const range = colorRanges.find((rangeItem) => score >= rangeItem.min && score <= rangeItem.max);
      if (range) {
        return range.color;
      }
    }

    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    if (score >= 40) return '#facc15';
    return '#ef4444';
  };

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data} layout="vertical" margin={{ top: 20, right: 30, left: 40, bottom: 20 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" domain={[0, 100]} label={{ value: t('score', 'Score'), position: 'insideBottomRight', offset: 0 }} />
        <YAxis type="category" dataKey="year" label={{ value: t('year', 'Year'), angle: -90, position: 'insideLeft' }} />
        <Tooltip formatter={(value: number) => `${value}%`} />
        <Legend />
        <Bar dataKey="averageScore" name={t('averageScore', 'Average Score')} radius={[4, 4, 0, 0]}>
          {data.map((entry, index) => (
            <Cell key={`year-cell-${entry.year}-${index}`} fill={getScoreColor(entry.averageScore)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

export default YearlyBarChart;
