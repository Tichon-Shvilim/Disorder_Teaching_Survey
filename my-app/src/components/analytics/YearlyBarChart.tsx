import React from 'react';
import { useTranslation } from 'react-i18next';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface YearlyBarChartProps {
  data: Array<{ year: string; averageScore: number; submissions: number }>;
}

const YearlyBarChart: React.FC<YearlyBarChartProps> = ({ data }) => {
  const { t } = useTranslation('analyticsSettings');
  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data} layout="vertical" margin={{ top: 20, right: 30, left: 40, bottom: 20 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" domain={[0, 100]} label={{ value: t('score', 'Score'), position: 'insideBottomRight', offset: 0 }} />
        <YAxis type="category" dataKey="year" label={{ value: t('year', 'Year'), angle: -90, position: 'insideLeft' }} />
        <Tooltip formatter={(value: number) => `${value}%`} />
        <Legend />
        <Bar dataKey="averageScore" fill="#3b82f6" name={t('averageScore', 'Average Score')} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default YearlyBarChart;
