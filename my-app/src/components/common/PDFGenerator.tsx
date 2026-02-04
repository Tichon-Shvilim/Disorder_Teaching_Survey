import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import type { FormSubmission } from '../formManagement/models/FormModels';

// Register Hebrew-supporting font - Frank Ruhl Libre
Font.register({
  family: 'FrankRuhlLibre',
  fonts: [
    {
      src: 'https://unpkg.com/@fontsource/frank-ruhl-libre@5.0.18/files/frank-ruhl-libre-hebrew-400-normal.woff',
      fontWeight: 400
    },
    {
      src: 'https://unpkg.com/@fontsource/frank-ruhl-libre@5.0.18/files/frank-ruhl-libre-hebrew-700-normal.woff',
      fontWeight: 700
    }
  ]
});

// Simple PDF styles with Hebrew font support
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 30,
    fontSize: 12,
    fontFamily: 'FrankRuhlLibre'
  },
  title: {
    fontSize: 20,
    marginBottom: 20,
    textAlign: 'center',
    fontWeight: 'bold'
  },
  section: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#f9f9f9'
  },
  label: {
    fontSize: 10,
    color: '#666666',
    marginBottom: 5
  },
  text: {
    fontSize: 12,
    marginBottom: 8
  },
  question: {
    fontWeight: 'bold',
    marginBottom: 5
  },
  answer: {
    marginBottom: 10,
    paddingLeft: 10
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 10,
    color: '#666'
  }
});

interface PDFDocumentProps {
  submission: FormSubmission;
  includeMetadata?: boolean;
}

export const PDFDocument: React.FC<PDFDocumentProps> = ({ 
  submission, 
  includeMetadata = true 
}) => {
  const formatDate = (date: Date | string | undefined) => {
    if (!date) return 'Not specified';
    try {
      return new Date(date).toLocaleDateString();
    } catch {
      return 'Invalid date';
    }
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{submission.questionnaireTitle}</Text>
        
        {includeMetadata && (
          <View style={styles.section}>
            <Text style={styles.label}>STUDENT INFORMATION</Text>
            <Text style={styles.text}>Name: {submission.studentName}</Text>
            <Text style={styles.text}>Submitted: {formatDate(submission.submittedAt)}</Text>
            {submission.completedBy && (
              <Text style={styles.text}>Completed by: {submission.completedBy}</Text>
            )}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.label}>RESPONSES</Text>
          {submission.answers && submission.answers.length > 0 ? (
            submission.answers.map((answer, index) => (
              <View key={index} style={{ marginBottom: 15 }}>
                <Text style={styles.question}>
                  {index + 1}. {answer.questionTitle || 'Question not available'}
                </Text>
                <Text style={styles.answer}>
                  {typeof answer.answer === 'string' 
                    ? answer.answer 
                    : Array.isArray(answer.answer)
                    ? answer.answer.join(', ')
                    : JSON.stringify(answer.answer) || 'No answer provided'}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.text}>No responses available</Text>
          )}
        </View>

        {submission.notes && (
          <View style={styles.section}>
            <Text style={styles.label}>ADDITIONAL NOTES</Text>
            <Text style={styles.text}>{submission.notes}</Text>
          </View>
        )}
        
        <Text style={styles.footer}>
          Generated on {new Date().toLocaleDateString()} | Tichon Shvilim
        </Text>
      </Page>
    </Document>
  );
};
