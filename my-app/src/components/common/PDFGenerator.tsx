import React from 'react';
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink, Font } from '@react-pdf/renderer';
import type { FormSubmission } from '../formManagement/models/FormModels';

// Register fonts for better typography
Font.register({
  family: 'Inter',
  src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2'
});

// PDF Styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 30,
    fontFamily: 'Inter',
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#2563eb',
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 10,
  },
  section: {
    marginBottom: 15,
    padding: 15,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 10,
  },
  questionText: {
    fontSize: 12,
    color: '#4b5563',
    marginBottom: 5,
    fontWeight: 'bold',
  },
  answerText: {
    fontSize: 11,
    color: '#1f2937',
    marginBottom: 10,
    paddingLeft: 10,
  },
  metaInfo: {
    fontSize: 10,
    color: '#9ca3af',
    marginTop: 20,
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: 8,
  }
});

interface FormPDFProps {
  submission: FormSubmission;
  includeMetadata?: boolean;
}

// Form PDF Document Component
export const FormPDFDocument: React.FC<FormPDFProps> = ({ submission, includeMetadata = true }) => {
  const formatDate = (date: Date | string | undefined) => {
    if (!date) return 'Not specified';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatAnswer = (answer: string | number | (string | number)[] | undefined): string => {
    if (Array.isArray(answer)) {
      return answer.join(', ');
    }
    return String(answer || 'No answer provided');
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Form Submission Report</Text>
          <Text style={styles.subtitle}>
            {typeof submission.questionnaireId === 'object' 
              ? submission.questionnaireId.title 
              : submission.questionnaireTitle}
          </Text>
          {includeMetadata && (
            <View>
              <Text style={styles.subtitle}>Student: {submission.studentName}</Text>
              <Text style={styles.subtitle}>Submitted: {formatDate(submission.submittedAt)}</Text>
              {submission.completedBy && (
                <Text style={styles.subtitle}>Completed by: {submission.completedBy}</Text>
              )}
            </View>
          )}
        </View>

        {/* Form Content */}
        <View>
          {submission.answers?.map((answer, index) => (
            <View key={index} style={styles.section}>
              <Text style={styles.questionText}>
                {index + 1}. {answer.questionTitle || 'Question not available'}
              </Text>
              
              {answer.inputType === 'single-choice' || answer.inputType === 'multiple-choice' ? (
                <View>
                  {answer.selectedOptions?.map((option, optIndex) => (
                    <Text key={optIndex} style={styles.answerText}>
                      • {option.label}
                    </Text>
                  ))}
                </View>
              ) : (
                <Text style={styles.answerText}>
                  {formatAnswer(answer.answer)}
                </Text>
              )}
            </View>
          ))}
        </View>

        {/* Notes */}
        {submission.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Additional Notes</Text>
            <Text style={styles.answerText}>{submission.notes}</Text>
          </View>
        )}

        {/* Footer */}
        <Text style={styles.footer}>
          Generated on {formatDate(new Date())} | Survey Management System
        </Text>
      </Page>
    </Document>
  );
};

// Main PDF Generator Component
interface PDFGeneratorProps {
  submission: FormSubmission;
  fileName?: string;
  includeMetadata?: boolean;
  children?: (props: { loading: boolean }) => React.ReactNode;
}

export const PDFGenerator: React.FC<PDFGeneratorProps> = ({
  submission,
  fileName,
  includeMetadata = true,
  children
}) => {
  const defaultFileName = `${submission.studentName}_${submission.questionnaireTitle}_${new Date().toISOString().split('T')[0]}.pdf`;
  
  return (
    <PDFDownloadLink
      document={
        <FormPDFDocument 
          submission={submission} 
          includeMetadata={includeMetadata} 
        />
      }
      fileName={fileName || defaultFileName}
    >
      {({ loading }: { loading: boolean }) => 
        children 
          ? children({ loading })
          : (
            <button
              disabled={loading}
              style={{
                backgroundColor: loading ? '#e5e7eb' : '#2563eb',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              {loading ? 'Generating PDF...' : 'Download PDF'}
            </button>
          )
      }
    </PDFDownloadLink>
  );
};

export default PDFGenerator;
