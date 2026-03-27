import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ScoringAPIService, type NodeScore, type SubmissionScore } from '../formManagement/Api-Requests/ScoringAPIService';
import { toast } from 'react-toastify';

interface SubmissionAnalyticsProps {
  submissionId: string;
  onClose?: () => void;
}

const SubmissionAnalytics: React.FC<SubmissionAnalyticsProps> = ({ submissionId, onClose }) => {
  const { t } = useTranslation('analyticsSettings');
  const [scores, setScores] = useState<SubmissionScore | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDepth, setSelectedDepth] = useState<number>(1); // Show root level by default

  useEffect(() => {
    const fetchScores = async () => {
      try {
        setLoading(true);
        const scoreData = await ScoringAPIService.getSubmissionScores(submissionId);
        setScores(scoreData);
      } catch (error) {
        console.error('Error fetching scores:', error);
        toast.error('Failed to load scoring data');
      } finally {
        setLoading(false);
      }
    };

    if (submissionId) {
      fetchScores();
    }
  }, [submissionId]);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: '48px',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '4px solid #e5e7eb',
          borderTop: '4px solid #3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <p>Loading analytics...</p>
      </div>
    );
  }

  if (!scores) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <p>No scoring data available</p>
      </div>
    );
  }

  // Filter node scores by selected depth
  const filteredNodeScores = scores.nodeScores.filter((node: NodeScore) => node.nodePath.length === selectedDepth);

  // Prepare chart data
  const chartData = filteredNodeScores.map((node: NodeScore) => ({
    name: node.title,
    score: node.score,
    maxScore: node.maxScore,
    answeredQuestions: node.answeredQuestions,
    totalQuestions: node.totalQuestions
  }));

  // Get unique depths available
  const availableDepths = Array.from(new Set(scores.nodeScores.map((node: NodeScore) => node.nodePath.length)))
    .sort((a: number, b: number) => a - b);

  const getScoreColor = (score: number) => {
    if (scores.graphSettings?.colorRanges) {
      for (const range of scores.graphSettings.colorRanges) {
        if (score >= range.min && score <= range.max) {
          return range.color;
        }
      }
    }
    
    // Default color scheme if no settings
    if (score >= 70) return '#10b981'; // green
    if (score >= 50) return '#f59e0b'; // yellow
    return '#ef4444'; // red
  };

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '24px',
      maxWidth: '1200px',
      margin: '0 auto'
    }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '24px' 
      }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#1f2937', margin: '0 0 8px 0' }}>
            {t('submissionAnalyticsTitle', 'Submission Analytics')}
          </h2>
          <p style={{ fontSize: '16px', color: '#6b7280', margin: 0 }}>
            {t('student', 'Student')}: {scores.studentName} | {t('questionnaire', 'Questionnaire')}: {scores.questionnaireTitle}
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            style={{
              padding: '8px',
              backgroundColor: '#f3f4f6',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            ✕
          </button>
        )}
      </div>

      {/* Overall Score Card */}
      <div style={{
        backgroundColor: '#f0f9ff',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '24px',
        textAlign: 'center',
        border: `2px solid ${getScoreColor(scores.overallScore)}`
      }}>
        <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', margin: '0 0 8px 0' }}>
          {t('overallScore', 'Overall Score')}
        </h3>
        <div style={{ 
          fontSize: '36px', 
          fontWeight: '700', 
          color: getScoreColor(scores.overallScore),
          margin: '8px 0'
        }}>
          {scores.overallScore.toFixed(1)}%
        </div>
        <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
          {t('submitted', 'Submitted')}: {new Date(scores.submittedAt).toLocaleDateString()}
        </p>
      </div>

      {/* Depth Filter */}
      {availableDepths.length > 1 && (
        <div style={{ marginBottom: '24px' }}>
          <label style={{ 
            fontSize: '14px', 
            fontWeight: '500', 
            color: '#374151', 
            marginBottom: '8px', 
            display: 'block' 
          }}>
            {t('viewLevel', 'View Level:')}
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            {availableDepths.map((depth: number) => (
              <button
                key={depth}
                onClick={() => setSelectedDepth(depth)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: selectedDepth === depth ? '#3b82f6' : '#f3f4f6',
                  color: selectedDepth === depth ? 'white' : '#374151',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                {t('level', 'Level')} {depth} {depth === 1 ? '(' + t('domains', 'Domains') + ')' : ''}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Bar Chart */}
      {chartData.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', marginBottom: '16px' }}>
            {t('scoresByDomain', 'Scores by Domain')} ({t('level', 'Level')} {selectedDepth})
          </h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                height={80}
                interval={0}
              />
              <YAxis domain={[0, 100]} />
              <Tooltip 
                formatter={(value: number, name: string) => [
                  `${value.toFixed(1)}%`, 
                  name === 'score' ? 'Score' : 'Max Score'
                ]}
                labelFormatter={(label: string) => `Domain: ${label}`}
              />
              <Legend />
              <Bar 
                dataKey="score" 
                fill="#3b82f6" 
                name="Actual Score"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Score Details Table */}
      <div>
        <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', marginBottom: '16px' }}>
          {t('detailedScores', 'Detailed Scores')} ({t('level', 'Level')} {selectedDepth})
        </h3>
        <div style={{
          backgroundColor: '#f9fafb',
          borderRadius: '8px',
          overflow: 'hidden',
          border: '1px solid #e5e7eb'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f3f4f6' }}>
                <th style={{ 
                  padding: '12px 16px', 
                  textAlign: 'left', 
                  fontSize: '14px', 
                  fontWeight: '600',
                  color: '#374151'
                }}>
                  {t('domain', 'Domain')}
                </th>
                <th style={{ 
                  padding: '12px 16px', 
                  textAlign: 'center', 
                  fontSize: '14px', 
                  fontWeight: '600',
                  color: '#374151'
                }}>
                  {t('score', 'Score')}
                </th>
                <th style={{ 
                  padding: '12px 16px', 
                  textAlign: 'center', 
                  fontSize: '14px', 
                  fontWeight: '600',
                  color: '#374151'
                }}>
                  {t('questions', 'Questions')}
                </th>
                <th style={{ 
                  padding: '12px 16px', 
                  textAlign: 'center', 
                  fontSize: '14px', 
                  fontWeight: '600',
                  color: '#374151'
                }}>
                  {t('weight', 'Weight')}
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredNodeScores.map((node: NodeScore, index: number) => (
                <tr key={node.nodeId} style={{
                  backgroundColor: index % 2 === 0 ? 'white' : '#f9fafb'
                }}>
                  <td style={{ 
                    padding: '12px 16px', 
                    fontSize: '14px', 
                    color: '#374151',
                    fontWeight: '500'
                  }}>
                    {node.title}
                  </td>
                  <td style={{ 
                    padding: '12px 16px', 
                    textAlign: 'center',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: getScoreColor(node.score)
                  }}>
                    {node.score.toFixed(1)}%
                  </td>
                  <td style={{ 
                    padding: '12px 16px', 
                    textAlign: 'center',
                    fontSize: '14px',
                    color: '#6b7280'
                  }}>
                    {node.answeredQuestions} / {node.totalQuestions}
                  </td>
                  <td style={{ 
                    padding: '12px 16px', 
                    textAlign: 'center',
                    fontSize: '14px',
                    color: '#6b7280'
                  }}>
                    {node.totalWeight}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SubmissionAnalytics;
