import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import StudentYearlyAnalytics from './StudentYearlyAnalytics';
import DomainAnalytics from './DomainAnalytics';
import { FormAPIService } from '../formManagement/Api-Requests/FormAPIService';
import type { FormSubmission } from '../formManagement/models/FormModels';

const StudentAnalyticsPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { studentId } = useParams<{ studentId: string }>();

  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubmissions = async () => {
      if (!studentId) {
        setError(t('analytics.missingStudentId', 'Missing student ID for analytics.'));
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const studentSubmissions = await FormAPIService.getStudentSubmissions(studentId);
        setSubmissions(Array.isArray(studentSubmissions) ? studentSubmissions : []);
      } catch (err) {
        console.error('Error fetching student submissions for analytics:', err);
        setError(t('analytics.failedToLoadStudentSubmissions', 'Failed to load student submissions for analytics.'));
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, [studentId, t]);

  if (loading) {
    return (
      <div style={{ minHeight: '70vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <p>{t('analytics.loadingStudentAnalytics', 'Loading student analytics...')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '70vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', padding: '24px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
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
          {t('analytics.back', 'Back')}
        </button>

        <div style={{
          padding: '24px',
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
          marginBottom: '24px'
        }}>
          <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#1f2937', margin: 0 }}>
            {t('analytics.studentAnalytics', 'Student Analytics')}
          </h1>
          <p style={{ fontSize: '16px', color: '#6b7280', marginTop: '8px' }}>
            {t('analytics.studentAnalyticsDescription', 'Combined analytics for all submissions of the selected student.')}
          </p>
        </div>

        <div style={{ display: 'grid', gap: '32px' }}>
          <StudentYearlyAnalytics submissions={submissions} />
          <DomainAnalytics submissions={submissions} />
        </div>
      </div>
    </div>
  );
};

export default StudentAnalyticsPage;
