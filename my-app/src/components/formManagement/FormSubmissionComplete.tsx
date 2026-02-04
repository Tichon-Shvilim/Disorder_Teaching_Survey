import React from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle, BarChart3, Edit, ArrowLeft } from 'lucide-react';

const FormSubmissionComplete: React.FC = () => {
  const { submissionId } = useParams<{ submissionId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get data from navigation state
  const studentName = location.state?.studentName || 'Student';
  const questionnaireTitle = location.state?.questionnaireTitle || 'Form';
  const canEdit = location.state?.canEdit || false;

  const handleViewAnalytics = () => {
    navigate(`/layout/form-results/${submissionId}`);
  };

  const handleEditSubmission = () => {
    // Navigate back to form with edit mode
    navigate(-1);
  };

  const handleGoBack = () => {
    navigate('/layout/students');
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f9fafb', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      padding: '24px'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '48px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
        textAlign: 'center',
        maxWidth: '500px',
        width: '100%'
      }}>
        {/* Success Icon */}
        <div style={{
          width: '80px',
          height: '80px',
          backgroundColor: '#dcfce7',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px'
        }}>
          <CheckCircle style={{ 
            width: '48px', 
            height: '48px', 
            color: '#16a34a' 
          }} />
        </div>

        {/* Success Message */}
        <h1 style={{
          fontSize: '28px',
          fontWeight: '700',
          color: '#1f2937',
          margin: '0 0 12px 0'
        }}>
          Form Submission Complete!
        </h1>

        <p style={{
          fontSize: '16px',
          color: '#6b7280',
          margin: '0 0 32px 0',
          lineHeight: '1.6'
        }}>
          The form "{questionnaireTitle}" for {studentName} has been successfully submitted.
        </p>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          marginBottom: '24px'
        }}>
          <button
            onClick={handleViewAnalytics}
            style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              color: 'white',
              padding: '16px 24px',
              borderRadius: '12px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(59, 130, 246, 0.4)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
            }}
          >
            <BarChart3 style={{ width: '20px', height: '20px' }} />
            View Result Analytics
          </button>

          {canEdit && (
            <button
              onClick={handleEditSubmission}
              style={{
                backgroundColor: '#f59e0b',
                color: 'white',
                padding: '14px 24px',
                borderRadius: '12px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#d97706';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = '#f59e0b';
              }}
            >
              <Edit style={{ width: '16px', height: '16px' }} />
              Make Changes to Form
            </button>
          )}
        </div>

        {/* Back Button */}
        <button
          onClick={handleGoBack}
          style={{
            backgroundColor: 'transparent',
            color: '#6b7280',
            padding: '12px 20px',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            cursor: 'pointer',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            margin: '0 auto',
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = '#f9fafb';
            e.currentTarget.style.borderColor = '#d1d5db';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.borderColor = '#e5e7eb';
          }}
        >
          <ArrowLeft style={{ width: '16px', height: '16px' }} />
          Back to Students
        </button>
      </div>
    </div>
  );
};

export default FormSubmissionComplete;