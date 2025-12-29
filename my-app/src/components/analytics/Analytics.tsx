import React, { useState, useEffect } from 'react';
import httpService from './Api-Requests/httpService';
import DomainBarChart from './DomainBarChart';
import './Analytics.css';

interface DomainScore {
  nodeId: string;
  title: string;
  averageScore: number;
  latestScore?: number;
  totalQuestions: number;
  submissions: number;
  trend?: number;
}

interface StudentAnalytics {
  studentId: string;
  domains: DomainScore[];
  totalSubmissions: number;
  dateRange: {
    earliest: string;
    latest: string;
  } | null;
}

interface ClassAnalytics {
  classId: string;
  domains: Array<{
    nodeId: string;
    title: string;
    averageScore: number;
    minScore: number;
    maxScore: number;
    totalQuestions: number;
    studentCount: number;
    standardDeviation: number;
  }>;
  studentCount: number;
  submissionCount: number;
}

interface AnalyticsProps {
  type: 'student' | 'class';
  id: string; // studentId or classId
  questionnaireId?: string;
  startDate?: string;
  endDate?: string;
}

const Analytics: React.FC<AnalyticsProps> = ({ type, id, questionnaireId, startDate, endDate }) => {
  const [analytics, setAnalytics] = useState<StudentAnalytics | ClassAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!questionnaireId) {
          setError('Please select a questionnaire to view analytics');
          return;
        }

        const endpoint = type === 'student' 
          ? `/analytics/student/${id}/questionnaire/${questionnaireId}`
          : `/analytics/class/${id}/questionnaire/${questionnaireId}`;
        
        const params: Record<string, string> = {};
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
        
        const response = await httpService.get(endpoint, { params });
        
        if (response.data.success) {
          setAnalytics(response.data.data);
        } else {
          setError(response.data.message || 'Failed to fetch analytics');
        }
      } catch (err: unknown) {
        console.error('Error fetching analytics:', err);
        const errorMessage = err instanceof Error 
          ? err.message 
          : 'An error occurred while fetching analytics';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, [type, id, questionnaireId, startDate, endDate]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const endpoint = type === 'student' 
        ? `/analytics/domains/student/${id}`
        : `/analytics/domains/class/${id}`;
      
      const params = questionnaireId ? { questionnaireId } : {};
      
      const response = await httpService.get(endpoint, { params });
      
      if (response.data.success) {
        setAnalytics(response.data.data);
      } else {
        setError(response.data.message || 'Failed to fetch analytics');
      }
    } catch (err: unknown) {
      console.error('Error fetching analytics:', err);
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'An error occurred while fetching analytics';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const calculateOverallScore = () => {
    if (!analytics || !analytics.domains.length) return 0;
    
    const totalScore = analytics.domains.reduce((sum, domain) => sum + domain.averageScore, 0);
    return Math.round((totalScore / analytics.domains.length) * 100) / 100;
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return '#4CAF50'; // Green
    if (score >= 0.6) return '#FF9800'; // Orange
    if (score >= 0.4) return '#FFC107'; // Yellow
    return '#F44336'; // Red
  };

  const getScoreLabel = (score: number) => {
    if (score >= 0.8) return 'Excellent';
    if (score >= 0.6) return 'Good';
    if (score >= 0.4) return 'Needs Improvement';
    return 'Concerning';
  };

  if (loading) {
    return (
      <div className="analytics-container">
        <div className="loading">Loading analytics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="analytics-container">
        <div className="error">
          <p>Error: {error}</p>
          <button onClick={fetchAnalytics} className="retry-button">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!analytics || !analytics.domains.length) {
    return (
      <div className="analytics-container">
        <div className="no-data">
          <p>No analytics data available.</p>
          <p>Make sure there are form submissions to analyze.</p>
        </div>
      </div>
    );
  }

  const overallScore = calculateOverallScore();

  return (
    <div className="analytics-container">
      <div className="analytics-header">
        <h2>
          {type === 'student' ? 'Student Analytics' : 'Class Analytics'}
        </h2>
        
        <div className="overall-score">
          <div className="score-display">
            <span className="score-value" style={{ color: getScoreColor(overallScore) }}>
              {Math.round(overallScore * 100)}%
            </span>
            <span className="score-label">
              {getScoreLabel(overallScore)}
            </span>
          </div>
        </div>
      </div>

      <div className="analytics-summary">
        <div className="summary-stats">
          <div className="stat">
            <div className="stat-value">{analytics.domains.length}</div>
            <div className="stat-label">Domains</div>
          </div>
          
          {type === 'student' && 'totalSubmissions' in analytics && (
            <div className="stat">
              <div className="stat-value">{analytics.totalSubmissions}</div>
              <div className="stat-label">Submissions</div>
            </div>
          )}
          
          {type === 'class' && 'studentCount' in analytics && (
            <>
              <div className="stat">
                <div className="stat-value">{analytics.studentCount}</div>
                <div className="stat-label">Students</div>
              </div>
              <div className="stat">
                <div className="stat-value">{analytics.submissionCount}</div>
                <div className="stat-label">Submissions</div>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="analytics-chart">
        <h3>Domain Scores</h3>
        <DomainBarChart 
          data={analytics.domains} 
          type={type}
        />
      </div>

      <div className="domain-details">
        <h3>Domain Breakdown</h3>
        <div className="domains-grid">
          {analytics.domains.map((domain) => (
            <div key={domain.nodeId} className="domain-card">
              <div className="domain-header">
                <h4>{domain.title}</h4>
                <div 
                  className="domain-score"
                  style={{ color: getScoreColor(domain.averageScore) }}
                >
                  {Math.round(domain.averageScore * 100)}%
                </div>
              </div>
              
              <div className="domain-stats">
                <div className="domain-stat">
                  <span className="stat-label">Questions:</span>
                  <span className="stat-value">{domain.totalQuestions}</span>
                </div>
                
                {type === 'student' && 'submissions' in domain && (
                  <>
                    <div className="domain-stat">
                      <span className="stat-label">Submissions:</span>
                      <span className="stat-value">{domain.submissions}</span>
                    </div>
                    
                    {domain.trend !== undefined && (
                      <div className="domain-stat">
                        <span className="stat-label">Trend:</span>
                        <span 
                          className={`stat-value ${domain.trend > 0 ? 'positive' : domain.trend < 0 ? 'negative' : 'neutral'}`}
                        >
                          {domain.trend > 0 ? '+' : ''}{Math.round(domain.trend * 100)}%
                        </span>
                      </div>
                    )}
                  </>
                )}
                
                {type === 'class' && 'studentCount' in domain && (
                  <>
                    <div className="domain-stat">
                      <span className="stat-label">Students:</span>
                      <span className="stat-value">{domain.studentCount}</span>
                    </div>
                    
                    {'minScore' in domain && 'maxScore' in domain && (
                      <div className="domain-stat">
                        <span className="stat-label">Range:</span>
                        <span className="stat-value">
                          {Math.round(domain.minScore * 100)}% - {Math.round(domain.maxScore * 100)}%
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {type === 'student' && 'dateRange' in analytics && analytics.dateRange && (
        <div className="analytics-footer">
          <p className="date-range">
            Data from {new Date(analytics.dateRange.earliest).toLocaleDateString()} 
            {' to '} 
            {new Date(analytics.dateRange.latest).toLocaleDateString()}
          </p>
        </div>
      )}
    </div>
  );
};

export default Analytics;
