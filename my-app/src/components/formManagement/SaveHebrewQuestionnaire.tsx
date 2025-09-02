import React, { useState } from 'react';
import { questionnaireApiService } from './Api-Requests/questionnaireApi';
import { toast } from 'react-toastify';
import { hebrewQuestionnaireData, convertToFormNode, countQuestions, createHebrewQuestionnaireRequest } from './hebrewQuestionnaireData';

/**
 * Component to save the Hebrew questionnaire to MongoDB
 * This converts the JSON data to the proper FormNode structure and saves it via API
 */

const SaveHebrewQuestionnaire: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [savedQuestionnaireId, setSavedQuestionnaireId] = useState<string | null>(null);

  // Function to validate the questionnaire structure
  const handleValidate = async () => {
    try {
      setValidating(true);
      console.log('🔍 Validating Hebrew questionnaire structure...');
      
      const questionnaireRequest = createHebrewQuestionnaireRequest();
      const response = await questionnaireApiService.validateStructure(questionnaireRequest.structure);
      
      if (response.success && response.data) {
        console.log('✅ Questionnaire structure is valid!', response.data);
        toast.success('🎉 השאלון תקין ומוכן לשמירה!');
        return true;
      } else {
        console.error('❌ Questionnaire structure validation failed:', response.errors);
        toast.error('❌ השאלון אינו תקין: ' + (response.errors?.join(', ') || response.message));
        return false;
      }
    } catch (error) {
      console.error('💥 Error validating questionnaire:', error);
      toast.error('❌ שגיאה בבדיקת השאלון');
      return false;
    } finally {
      setValidating(false);
    }
  };

  // Function to save the questionnaire
  const handleSave = async () => {
    try {
      setLoading(true);
      console.log('🚀 Starting to save Hebrew questionnaire...');
      
      const questionnaireRequest = createHebrewQuestionnaireRequest();
      
      console.log('📋 Questionnaire data prepared:', {
        title: questionnaireRequest.title,
        description: questionnaireRequest.description,
        structureCount: questionnaireRequest.structure.length,
        totalQuestions: countQuestions(questionnaireRequest.structure)
      });

      // Save via API
      const response = await questionnaireApiService.createQuestionnaire(questionnaireRequest);
      
      if (response.success && response.data) {
        console.log('✅ Hebrew questionnaire saved successfully!');
        console.log('📊 Questionnaire ID:', response.data._id);
        console.log('📈 Total questions:', response.data.metadata?.totalQuestions || 'Unknown');
        console.log('🎯 Graphable questions:', response.data.metadata?.graphableQuestions || 'Unknown');
        
        setSavedQuestionnaireId(response.data._id);
        toast.success('🎉 השאלון נשמר בהצלחה במסד הנתונים!');
      } else {
        console.error('❌ Failed to save questionnaire:', response.errors || response.message);
        toast.error('❌ שגיאה בשמירת השאלון: ' + (response.errors?.join(', ') || response.message));
      }
    } catch (error) {
      console.error('💥 Error saving Hebrew questionnaire:', error);
      toast.error('❌ שגיאה בשמירת השאלון במסד הנתונים');
    } finally {
      setLoading(false);
    }
  };

  const totalQuestions = countQuestions(hebrewQuestionnaireData.structure.map(convertToFormNode));

  return (
    <div style={{
      padding: '24px',
      backgroundColor: 'white',
      borderRadius: '12px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
      maxWidth: '600px',
      margin: '0 auto'
    }}>
      <h2 style={{ 
        fontSize: '24px', 
        fontWeight: '600', 
        color: '#1f2937', 
        margin: '0 0 16px 0',
        textAlign: 'center',
        direction: 'rtl'
      }}>
        שמירת השאלון העברי למסד הנתונים
      </h2>
      
      <div style={{ marginBottom: '24px', direction: 'rtl' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '500', color: '#374151', margin: '0 0 8px 0' }}>
          {hebrewQuestionnaireData.title}
        </h3>
        <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 16px 0' }}>
          {hebrewQuestionnaireData.description}
        </p>
        
        <div style={{ 
          backgroundColor: '#f9fafb', 
          padding: '16px', 
          borderRadius: '8px',
          fontSize: '14px',
          color: '#374151'
        }}>
          <div style={{ marginBottom: '8px' }}>
            <strong>קבוצות:</strong> {hebrewQuestionnaireData.structure.length}
          </div>
          <div style={{ marginBottom: '8px' }}>
            <strong>סה"כ שאלות:</strong> {totalQuestions}
          </div>
          <div>
            <strong>שאלות ניתנות לגרף:</strong> {hebrewQuestionnaireData.structure.map(convertToFormNode).filter(node => 
              node.children.some(child => child.type === 'question' && child.graphable)
            ).length}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexDirection: 'column' }}>
        <button
          onClick={handleValidate}
          disabled={validating || loading}
          style={{
            padding: '12px 24px',
            backgroundColor: validating ? '#d1d5db' : '#f59e0b',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: validating || loading ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          {validating ? (
            <>
              <div style={{
                width: '16px',
                height: '16px',
                border: '2px solid #ffffff',
                borderTop: '2px solid transparent',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}></div>
              בודק שאלון...
            </>
          ) : (
            'בדוק תקינות השאלון'
          )}
        </button>

        <button
          onClick={handleSave}
          disabled={loading || validating}
          style={{
            padding: '12px 24px',
            backgroundColor: loading ? '#d1d5db' : savedQuestionnaireId ? '#10b981' : '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: loading || validating ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          {loading ? (
            <>
              <div style={{
                width: '16px',
                height: '16px',
                border: '2px solid #ffffff',
                borderTop: '2px solid transparent',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}></div>
              שומר שאלון...
            </>
          ) : savedQuestionnaireId ? (
            '✅ נשמר בהצלחה!'
          ) : (
            'שמור שאלון למסד הנתונים'
          )}
        </button>

        {savedQuestionnaireId && (
          <div style={{
            padding: '12px',
            backgroundColor: '#f0fdf4',
            borderRadius: '8px',
            fontSize: '14px',
            color: '#166534',
            textAlign: 'center',
            direction: 'rtl'
          }}>
            <strong>מזהה השאלון:</strong> {savedQuestionnaireId}
          </div>
        )}
      </div>

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

export default SaveHebrewQuestionnaire;
