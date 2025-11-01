import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, BarChart3, PieChart, Radar } from 'lucide-react';
import DomainBarChart from '../analytics/DomainBarChart';
import { AnalyticsAPIService } from '../analytics';
import { toast } from 'react-toastify';

interface DomainScore {
  nodeId: string;
  title: string;
  score: number;
  totalQuestions: number;
  answeredQuestions: number;
}

interface SubmissionAnalytics {
  submissionId: string;
  studentId: string;
  studentName: string;
  questionnaireTitle: string;
  overallScore: number;
  domainScores: DomainScore[];
  submittedAt: string;
}

const FormResults: React.FC = () => {
  const { submissionId } = useParams<{ submissionId: string }>();
  const navigate = useNavigate();
  
  const [analytics, setAnalytics] = useState<SubmissionAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [chartType, setChartType] = useState<'bar' | 'pie' | 'radar'>('bar');
  


  useEffect(() => {
    let isMounted = true;
    
    const fetchAnalytics = async () => {
      if (!submissionId || !isMounted) return;
      
      try {
        setLoading(true);
        const analytics = await AnalyticsAPIService.getSubmissionAnalytics(submissionId);
        setAnalytics(analytics);
        
        if (!isMounted) return;
      } catch (error) {
        if (!isMounted) return;
        
        console.error('Error fetching analytics:', error);
        // Analytics not ready yet, try to calculate them
        try {
          await AnalyticsAPIService.calculateAnalytics(submissionId);
          
          if (!isMounted) return;
          
          // Use a more reliable retry mechanism
          const retryFetch = async (attempts = 0) => {
            if (!isMounted || attempts >= 3) return;
            
            try {
              const retryAnalytics = await AnalyticsAPIService.getSubmissionAnalytics(submissionId);
              if (!isMounted) return;
              
              setAnalytics(retryAnalytics);
            } catch {
              if (isMounted && attempts < 2) {
                setTimeout(() => retryFetch(attempts + 1), 3000);
              } else if (isMounted) {
                toast.error('Analytics are being calculated. Please refresh in a moment.');
              }
            }
          };
          
          setTimeout(() => retryFetch(), 2000);
        } catch {
          if (isMounted) {
            toast.error('Failed to calculate analytics. Please try again later.');
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchAnalytics();
    
    return () => {
      isMounted = false;
    };
  }, [submissionId]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#22c55e'; // Green
    if (score >= 60) return '#f59e0b'; // Orange
    if (score >= 40) return '#eab308'; // Yellow
    return '#ef4444'; // Red
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Needs Improvement';
    return 'Concerning';
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '50vh', 
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
        <p style={{ fontSize: '16px', color: '#6b7280' }}>Loading results...</p>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '50vh', 
        flexDirection: 'column', 
        gap: '16px' 
      }}>
        <p style={{ fontSize: '16px', color: '#6b7280' }}>Analytics are being calculated...</p>
        <p style={{ fontSize: '14px', color: '#9ca3af' }}>This may take a few moments. Please refresh the page.</p>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '12px 24px',
              backgroundColor: '#22c55e',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            Refresh
          </button>
          <button
            onClick={() => navigate(-1)}
            style={{
              padding: '12px 24px',
              backgroundColor: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', padding: '24px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 16px',
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              color: '#374151',
              marginBottom: '24px'
            }}
          >
            <ArrowLeft style={{ height: '16px', width: '16px' }} />
            Back
          </button>

          <div style={{
            padding: '24px',
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
          }}>
            <h1 style={{ 
              fontSize: '28px', 
              fontWeight: '700', 
              color: '#1f2937', 
              margin: '0 0 8px 0' 
            }}>
              Form Results
            </h1>
            <p style={{ fontSize: '16px', color: '#6b7280', margin: '0 0 8px 0' }}>
              Student: <strong>{analytics.studentName}</strong>
            </p>
            <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
              Form: <strong>{analytics.questionnaireTitle}</strong>
            </p>
            <p style={{ fontSize: '14px', color: '#6b7280', margin: '4px 0 0 0' }}>
              Submitted: {new Date(analytics.submittedAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Overall Score */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '32px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
          marginBottom: '32px'
        }}>
          <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '24px', color: '#1f2937' }}>
            Overall Score
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <div style={{
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              background: `conic-gradient(${getScoreColor(analytics.overallScore)} ${analytics.overallScore * 3.6}deg, #e5e7eb 0deg)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative'
            }}>
              <div style={{
                width: '80px',
                height: '80px',
                backgroundColor: 'white',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                fontWeight: '700',
                color: getScoreColor(analytics.overallScore)
              }}>
                {Math.round(analytics.overallScore)}%
              </div>
            </div>
            <div>
              <h3 style={{ 
                fontSize: '20px', 
                fontWeight: '600', 
                color: getScoreColor(analytics.overallScore),
                margin: '0 0 8px 0'
              }}>
                {getScoreLabel(analytics.overallScore)}
              </h3>
              <p style={{ fontSize: '16px', color: '#6b7280', margin: 0 }}>
                Based on {analytics.domainScores.length} domain{analytics.domainScores.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Chart Type Selector */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
          marginBottom: '32px'
        }}>
          <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '16px', color: '#1f2937' }}>
            Domain Scores
          </h2>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
            <button
              onClick={() => setChartType('bar')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 16px',
                backgroundColor: chartType === 'bar' ? '#3b82f6' : 'white',
                color: chartType === 'bar' ? 'white' : '#374151',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              <BarChart3 style={{ height: '16px', width: '16px' }} />
              Bar Chart
            </button>
            <button
              onClick={() => setChartType('pie')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 16px',
                backgroundColor: chartType === 'pie' ? '#3b82f6' : 'white',
                color: chartType === 'pie' ? 'white' : '#374151',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              <PieChart style={{ height: '16px', width: '16px' }} />
              Pie Chart
            </button>
            <button
              onClick={() => setChartType('radar')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 16px',
                backgroundColor: chartType === 'radar' ? '#3b82f6' : 'white',
                color: chartType === 'radar' ? 'white' : '#374151',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              <Radar style={{ height: '16px', width: '16px' }} />
              Radar Chart
            </button>
          </div>

          {/* Chart Display */}
          {chartType === 'bar' && (
            <DomainBarChart 
              data={analytics.domainScores.map(domain => ({
                nodeId: domain.nodeId,
                title: domain.title,
                averageScore: domain.score / 100, // Convert to 0-1 scale for chart
                totalQuestions: domain.totalQuestions
              }))}
              type="student"
            />
          )}

          {chartType === 'pie' && (
            <div style={{ textAlign: 'center', padding: '48px' }}>
              <p style={{ color: '#6b7280', fontSize: '16px' }}>
                Pie chart visualization coming soon...
              </p>
            </div>
          )}

          {chartType === 'radar' && (
            <div style={{ textAlign: 'center', padding: '48px' }}>
              <p style={{ color: '#6b7280', fontSize: '16px' }}>
                Radar chart visualization coming soon...
              </p>
            </div>
          )}
        </div>

        {/* Domain Details */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '32px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
        }}>
          <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '24px', color: '#1f2937' }}>
            Detailed Breakdown
          </h2>
          <div style={{ display: 'grid', gap: '16px' }}>
            {analytics.domainScores.map((domain) => (
              <div
                key={domain.nodeId}
                style={{
                  padding: '20px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  backgroundColor: '#f9fafb'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: '600', margin: '0 0 4px 0', color: '#1f2937' }}>
                      {domain.title}
                    </h3>
                    <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
                      {domain.answeredQuestions} of {domain.totalQuestions} questions answered
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      fontSize: '24px',
                      fontWeight: '700',
                      color: getScoreColor(domain.score)
                    }}>
                      {Math.round(domain.score)}%
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: getScoreColor(domain.score),
                      fontWeight: '500'
                    }}>
                      {getScoreLabel(domain.score)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CSS Animation */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default FormResults;