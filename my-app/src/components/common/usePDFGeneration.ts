import { useState, useCallback } from 'react';
import React from 'react';
import { pdf } from '@react-pdf/renderer';
import { saveAs } from 'file-saver';
import type { FormSubmission } from '../formManagement/models/FormModels';

interface PDFGenerationOptions {
  includeMetadata?: boolean;
  fileName?: string;
}

interface PDFGenerationState {
  isGenerating: boolean;
  error: string | null;
}

export const usePDFGeneration = () => {
  const [state, setState] = useState<PDFGenerationState>({
    isGenerating: false,
    error: null
  });

  const generateFormPDF = useCallback(async (
    submission: FormSubmission,
    options: PDFGenerationOptions = {}
  ) => {
    try {
      setState({ isGenerating: true, error: null });
      
      const fileName = options.fileName || 
        `${submission.studentName}_${submission.questionnaireTitle}_${new Date().toISOString().split('T')[0]}.pdf`;
      
      // Ensure filename always ends with .pdf
      const finalFileName = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
      
      // Import the simple PDF document component to avoid issues
      const { PDFDocument } = await import('./PDFGenerator');
      
      // Create React element properly
      const documentElement = React.createElement(PDFDocument, { 
        submission, 
        includeMetadata: options.includeMetadata 
      });
      
      // Generate PDF blob 
      // @ts-expect-error - FormPDFDocument is valid but has type inference issues
      const pdfBlob = await pdf(documentElement).toBlob();
      
      // Debug: Log blob information
      console.log('PDF Blob generated:', {
        size: pdfBlob.size,
        type: pdfBlob.type,
        fileName: finalFileName
      });
      
      // Use file-saver properly - it handles MIME types correctly
      saveAs(pdfBlob, finalFileName);
      
      setState({ isGenerating: false, error: null });
    } catch (error) {
      console.error('PDF generation error:', error);
      setState({ 
        isGenerating: false, 
        error: error instanceof Error ? error.message : 'Failed to generate PDF' 
      });
    }
  }, []);

  const generateBatchPDFs = useCallback(async (
    submissions: FormSubmission[],
    options: PDFGenerationOptions = {}
  ) => {
    setState({ isGenerating: true, error: null });
    
    try {
      for (const submission of submissions) {
        await generateFormPDF(submission, options);
        // Add small delay between downloads to prevent browser issues
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      setState({ isGenerating: false, error: null });
    } catch (error) {
      console.error('Batch PDF generation error:', error);
      setState({ 
        isGenerating: false, 
        error: error instanceof Error ? error.message : 'Failed to generate batch PDFs' 
      });
    }
  }, [generateFormPDF]);

  return {
    ...state,
    generateFormPDF,
    generateBatchPDFs
  };
};

export default usePDFGeneration;
