import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface DomainScore {
  domain: string;
  score: number;
  maxScore: number;
}

interface DomainAnalyticsProps {
  submissions: Array<{ domainScores?: Array<{ title: string; score: number; maxScore: number }> }>;
}

const mockDomainScores: DomainScore[] = [
  { domain: 'תקשורת', score: 80, maxScore: 100 },
  { domain: 'למידה', score: 70, maxScore: 100 },
  { domain: 'חברתי', score: 65, maxScore: 100 },
  { domain: 'רגשי', score: 90, maxScore: 100 },
];

const DomainAnalytics: React.FC<DomainAnalyticsProps> = ({ studentId, questionnaires }) => {
  const { t } = useTranslation('analyticsSettings');
  // Restore mock data for demo
  const domainScores: DomainScore[] = mockDomainScores;
  const [selectedDomain, setSelectedDomain] = useState<string>(domainScores.length > 0 ? domainScores[0].domain : '');
  const domains = domainScores.map(ds => ds.domain);
  const filteredScores = domainScores.filter(ds => ds.domain === selectedDomain);

  return (
    <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', maxWidth: '600px', margin: '0 auto' }}>
      <h2 style={{ fontSize: '22px', fontWeight: '600', color: '#1f2937', marginBottom: '16px' }}>{t('domainScoresByField', 'Domain Scores by Field')}</h2>
      <div style={{ marginBottom: '16px' }}>
        <label htmlFor="domain-select" style={{ fontSize: '16px', fontWeight: '500', color: '#374151', marginRight: '8px' }}>{t('selectDomain', 'Select Domain')}:</label>
        <select
          id="domain-select"
          value={selectedDomain}
          onChange={e => setSelectedDomain(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: '6px', fontSize: '16px', border: '1px solid #d1d5db' }}
        >
          {domains.map(domain => (
            <option key={domain} value={domain}>{domain}</option>
          ))}
        </select>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={filteredScores} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="domain" />
          <YAxis domain={[0, 100]} />
          <Tooltip formatter={(value: number) => `${value}%`} />
          <Legend />
          <Bar dataKey="score" fill="#10b981" name="ציון" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default DomainAnalytics;