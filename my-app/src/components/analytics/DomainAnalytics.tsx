import React, { useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import type { FormSubmission } from '../formManagement/models/FormModels';
import { AnalyticsAPIService } from './Api-Requests/AnalyticsAPIService';

interface DomainScore {
  domain: string;
  score: number;
  maxScore: number;
  submissionCount: number;
}

interface DomainAnalyticsProps {
  submissions: FormSubmission[];
  studentId?: string;
}

const DomainAnalytics: React.FC<DomainAnalyticsProps> = ({ submissions, studentId }) => {
  const { t } = useTranslation('analyticsSettings');

  const domainScores: DomainScore[] = useMemo(() => {
    const aggregates: Record<string, { totalScore: number; totalMaxScore: number; count: number }> = {};

    submissions.forEach((submission) => {
      submission.domainScores?.forEach((domainScore) => {
        if (!domainScore?.title) return;

        const key = domainScore.title;
        const entry = aggregates[key] ?? { totalScore: 0, totalMaxScore: 0, count: 0 };
        entry.totalScore += domainScore.score;
        entry.totalMaxScore += domainScore.maxScore;
        entry.count += 1;
        aggregates[key] = entry;
      });
    });

    return Object.entries(aggregates).map(([domain, aggregate]) => ({
      domain,
      score: aggregate.count > 0 ? Math.round((aggregate.totalScore / aggregate.count) * 100) / 100 : 0,
      maxScore: aggregate.count > 0 ? Math.round((aggregate.totalMaxScore / aggregate.count) * 100) / 100 : 0,
      submissionCount: aggregate.count,
    }));
  }, [submissions]);

  const [selectedDomains, setSelectedDomains] = useState<string[]>([]); // empty = all

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

  const getScoreColor = (score: number) => {
    const range = scoreColorRanges.find((rangeItem) => score >= rangeItem.min && score <= rangeItem.max);
    return range?.color ?? '#3b82f6';
  };

  const [fetchedDomains, setFetchedDomains] = useState<any[]>([]);
  const [loadingDomains, setLoadingDomains] = useState(false);

  useEffect(() => {
    // If there are no computed domain scores from submissions, try fetching aggregated domains
    if (domainScores.length === 0 && submissions.length > 0) {
      // nothing to do here (no domain scores available on submissions)
      return;
    }

    if (domainScores.length === 0) {
      return;
    }
  }, [domainScores, submissions]);

  // Fetch domains from analytics service when submissions don't include domainScores
  useEffect(() => {
    const fetchStudentDomains = async () => {
      if (domainScores.length > 0) return; // already have domains from submissions
      if (!studentId) return;

      try {
        setLoadingDomains(true);
        const data = await AnalyticsAPIService.getStudentDomains(studentId);
        // API returns { studentId, domains: [...] }
        setFetchedDomains(Array.isArray(data?.domains) ? data.domains : []);
      } catch (err) {
        console.error('Failed to fetch student domains:', err);
        setFetchedDomains([]);
      } finally {
        setLoadingDomains(false);
      }
    };

    fetchStudentDomains();
  }, [domainScores.length, studentId]);

  const computedScores = domainScores.length > 0
    ? domainScores
    : fetchedDomains.map((d) => ({
      domain: d.title || d.nodeId || d.domain || String(d.nodeId),
      score: Math.round(((d.averageScore ?? d.latestScore ?? 0)) * 100) / 100,
      maxScore: 100,
      submissionCount: d.submissions ?? 0,
    }));
  const hasDomainData = computedScores.length > 0;
  const domains = computedScores.map((ds) => ds.domain);
  const filteredScores = selectedDomains.length === 0
    ? computedScores
    : (() => {
      const selected = computedScores.filter(ds => selectedDomains.includes(ds.domain));
      const avgScore = selected.length > 0 ? Math.round((selected.reduce((sum, ds) => sum + ds.score, 0) / selected.length) * 100) / 100 : 0;
      return [{
        domain: t('selectedDomainAverage', { count: selected.length }),
        score: avgScore,
        maxScore: 100,
        submissionCount: selected.reduce((sum, ds) => sum + ds.submissionCount, 0),
      }];
    })();

  // --- Submission / Questionnaire selection & averages ---
  const [selectedQuestionnaires, setSelectedQuestionnaires] = useState<string[]>([]);

  const questionnaireOptions = useMemo(() => {
    const titles = Array.from(new Set(submissions.map(s => s.questionnaireTitle).filter(Boolean)));
    return titles;
  }, [submissions]);

  const filteredSubmissionScores = useMemo(() => {
    let filtered = submissions.filter(s => typeof s.totalScore === 'number');
    if (selectedQuestionnaires && selectedQuestionnaires.length > 0) {
      filtered = filtered.filter(s => selectedQuestionnaires.includes(s.questionnaireTitle || ''));
    }
    return filtered;
  }, [submissions, selectedQuestionnaires]);

  const averageScoreData = useMemo(() => {
    if (filteredSubmissionScores.length === 0) return [];

    // Group by questionnaire title
    const groups: Record<string, { total: number; count: number }> = {};
    filteredSubmissionScores.forEach(s => {
      const key = s.questionnaireTitle || 'Unnamed';
      groups[key] = groups[key] ?? { total: 0, count: 0 };
      groups[key].total += (typeof s.totalScore === 'number' ? s.totalScore : 0);
      groups[key].count += 1;
    });

    return Object.entries(groups).map(([label, ag]) => ({
      label,
      score: ag.count > 0 ? Math.round((ag.total / ag.count) * 100) / 100 : 0,
      submissionCount: ag.count
    }));
  }, [filteredSubmissionScores]);

  const hasDisplayData = filteredScores.length > 0;
  const noDataTitle = t('domainScoresByField', 'Domain Scores by Field');
  const noDataMessage = loadingDomains
    ? t('loadingDomains', 'Loading domains...')
    : hasDomainData
      ? t('noDomainScoresAvailable', 'No domain scores available for the selected submissions.')
      : t('noDomainScoresAvailable', 'No domain scores available for the selected submissions.');

  if (!hasDisplayData) {
    return (
      <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', maxWidth: '600px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '22px', fontWeight: '600', color: '#1f2937', marginBottom: '16px' }}>{noDataTitle}</h2>
        <p>{noDataMessage}</p>
      </div>
    );
  }

  if (hasDomainData) {
    return (
      <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', maxWidth: '600px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '22px', fontWeight: '600', color: '#1f2937', marginBottom: '16px' }}>{t('domainScoresByField', 'Domain Scores by Field')}</h2>
        <div style={{ marginBottom: '16px' }}>
          <label htmlFor="domain-select" style={{ fontSize: '16px', fontWeight: '500', color: '#374151', marginRight: '8px' }}>{t('selectDomain', 'Select Domain(s)')}:</label>
          <select
            id="domain-select"
            multiple
            size={Math.min(8, domains.length)}
            value={selectedDomains}
            onChange={e => {
              const values = Array.from(e.target.selectedOptions, (option) => option.value);
              setSelectedDomains(values);
            }}
            style={{ padding: '8px 12px', borderRadius: '6px', fontSize: '14px', border: '1px solid #d1d5db' }}
          >
            {domains.map(domain => (
              <option key={domain} value={domain}>{domain}</option>
            ))}
          </select>
          <p style={{ marginTop: '8px', fontSize: '12px', color: '#6b7280' }}>{t('selectDomainHint', 'Hold Ctrl/Cmd to select multiple domains. Leave empty to show all.')}</p>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={filteredScores} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="domain" />
            <YAxis domain={[0, 100]} />
            <Tooltip formatter={(value: number) => `${value}%`} />
            <Legend />
            <Bar dataKey="score" name={t('score', 'Score')} radius={[4, 4, 0, 0]}>
            {filteredScores.map((entry, index) => (
              <Cell key={`domain-cell-${entry.domain}-${index}`} fill={getScoreColor(entry.score)} />
            ))}
          </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', maxWidth: '600px', margin: '0 auto' }}>
      <h2 style={{ fontSize: '22px', fontWeight: '600', color: '#1f2937', marginBottom: '16px' }}>{t('submissionScores', 'Submission Scores')}</h2>
      <div style={{ marginBottom: '16px' }}>
        <label htmlFor="questionnaire-select" style={{ display: 'block', fontSize: '16px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
          {t('selectQuestionnaires', 'Select tests to display')}:
        </label>
        <select
          id="questionnaire-select"
          multiple
          value={selectedQuestionnaires}
          onChange={(e) => {
            const values = Array.from(e.target.selectedOptions, (option) => option.value);
            setSelectedQuestionnaires(values);
          }}
          style={{ width: '100%', minHeight: '120px', padding: '8px 12px', borderRadius: '6px', fontSize: '14px', border: '1px solid #d1d5db' }}
        >
          {questionnaireOptions.map((questionnaire) => (
            <option key={questionnaire} value={questionnaire}>
              {questionnaire}
            </option>
          ))}
        </select>
        <p style={{ marginTop: '8px', fontSize: '12px', color: '#6b7280' }}>
          {t('selectQuestionnaireHint', 'Hold Ctrl/Cmd to select multiple tests. Leave empty to average all selected submissions.')}
        </p>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={averageScoreData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="label" />
          <YAxis domain={[0, 100]} />
          <Tooltip formatter={(value: number) => `${value}%`} />
          <Legend />
          <Bar dataKey="score" name={t('averageScore', 'Average Score')} radius={[4, 4, 0, 0]}>
            {averageScoreData.map((entry, index) => (
              <Cell key={`average-cell-${index}`} fill={getScoreColor(entry.score)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <p style={{ marginTop: '12px', fontSize: '14px', color: '#4b5563' }}>
        {t('averageScoreInfo', 'Averaging {{count}} selected submission(s).', { count: filteredSubmissionScores.length })}
      </p>
    </div>
  );
};

export default DomainAnalytics;