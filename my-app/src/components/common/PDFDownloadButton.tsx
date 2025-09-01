import React from 'react';
import { FileText, Download } from 'lucide-react';
import { usePDFGeneration } from './usePDFGeneration';
import type { FormSubmission } from '../formManagement/models/FormModels';

interface PDFDownloadButtonProps {
  submission: FormSubmission;
  variant?: 'primary' | 'secondary' | 'icon';
  size?: 'small' | 'medium' | 'large';
  className?: string;
  disabled?: boolean;
  fileName?: string;
  includeMetadata?: boolean;
  children?: React.ReactNode;
}

const PDFDownloadButton: React.FC<PDFDownloadButtonProps> = ({
  submission,
  variant = 'primary',
  size = 'medium',
  className = '',
  disabled = false,
  fileName,
  includeMetadata = true,
  children
}) => {
  const { generateFormPDF, isGenerating } = usePDFGeneration();

  const handleDownload = async () => {
    try {
      await generateFormPDF(submission, {
        fileName: fileName || `form_submission_${submission._id}`,
        includeMetadata
      });
    } catch (err) {
      console.error('PDF generation failed:', err);
    }
  };

  const getButtonStyles = () => {
    const baseStyles = {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      border: 'none',
      borderRadius: '6px',
      cursor: disabled ? 'not-allowed' : 'pointer',
      fontWeight: '500',
      transition: 'all 0.2s',
      opacity: disabled ? 0.6 : 1
    };

    const sizeStyles = {
      small: { padding: '6px 12px', fontSize: '12px' },
      medium: { padding: '8px 16px', fontSize: '14px' },
      large: { padding: '12px 24px', fontSize: '16px' }
    };

    const variantStyles = {
      primary: {
        backgroundColor: '#2563eb',
        color: 'white',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
      },
      secondary: {
        backgroundColor: 'white',
        color: '#374151',
        border: '1px solid #d1d5db'
      },
      icon: {
        backgroundColor: 'transparent',
        color: '#6b7280',
        padding: '8px'
      }
    };

    return {
      ...baseStyles,
      ...sizeStyles[size],
      ...variantStyles[variant]
    };
  };

  const getIcon = () => {
    const iconSize = size === 'small' ? 14 : size === 'large' ? 18 : 16;
    return variant === 'icon' ? 
      <Download style={{ width: iconSize, height: iconSize }} /> :
      <FileText style={{ width: iconSize, height: iconSize }} />;
  };

  const getButtonText = () => {
    if (children) return children;
    if (variant === 'icon') return null;
    if (isGenerating) return 'Generating...';
    return size === 'small' ? 'PDF' : 'Download PDF';
  };

  return (
    <button
      onClick={handleDownload}
      disabled={disabled || isGenerating}
      className={className}
      style={getButtonStyles()}
      title={`Download PDF for ${submission.studentName}`}
    >
      {getIcon()}
      {getButtonText()}
    </button>
  );
};

export default PDFDownloadButton;
