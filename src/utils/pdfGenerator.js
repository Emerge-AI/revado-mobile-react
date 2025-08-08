import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Generate a professional PDF summary of health records
 */
export async function generateHealthRecordsPDF({
  patientName,
  patientEmail,
  records,
  recipientName = 'Healthcare Provider',
  includeAISummary = true
}) {
  try {
    // Create new PDF document
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Set document properties
    pdf.setProperties({
      title: `Health Records - ${patientName}`,
      subject: 'Medical Records Summary',
      author: 'Revado Health App',
      keywords: 'health, medical, records',
      creator: 'Revado Health'
    });

    // Define colors
    const primaryColor = [10, 132, 255]; // iOS blue
    const textColor = [51, 51, 51];
    const lightGray = [200, 200, 200];

    // Add header
    pdf.setFillColor(...primaryColor);
    pdf.rect(0, 0, 210, 30, 'F');
    
    // Add title
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Health Records Summary', 105, 15, { align: 'center' });
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Generated: ${new Date().toLocaleDateString()}`, 105, 23, { align: 'center' });

    // Reset text color
    pdf.setTextColor(...textColor);

    // Patient Information Section
    let yPosition = 45;
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Patient Information', 20, yPosition);
    
    yPosition += 10;
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Name: ${patientName}`, 20, yPosition);
    yPosition += 7;
    pdf.text(`Email: ${patientEmail}`, 20, yPosition);
    yPosition += 7;
    pdf.text(`Records Shared: ${records.length}`, 20, yPosition);
    
    // Add separator line
    yPosition += 10;
    pdf.setDrawColor(...lightGray);
    pdf.line(20, yPosition, 190, yPosition);
    yPosition += 10;

    // AI Summary Section (if enabled)
    if (includeAISummary) {
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Medical Summary', 20, yPosition);
      
      yPosition += 10;
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      
      // Generate AI-style summary
      const summary = generateAISummary(records);
      const lines = pdf.splitTextToSize(summary, 170);
      
      lines.forEach((line) => {
        if (yPosition > 270) {
          pdf.addPage();
          yPosition = 30;
        }
        pdf.text(line, 20, yPosition);
        yPosition += 6;
      });
      
      // Add separator
      yPosition += 5;
      pdf.line(20, yPosition, 190, yPosition);
      yPosition += 10;
    }

    // Records List Section
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Records Included', 20, yPosition);
    yPosition += 10;

    // Add note about attachments
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'italic');
    pdf.setTextColor(100, 100, 100);
    const attachmentCount = records.filter(r => r.url).length;
    if (attachmentCount > 0) {
      pdf.text(`Note: ${attachmentCount} original file(s) are attached to this email`, 20, yPosition);
      yPosition += 7;
    }
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...textColor);
    pdf.setFontSize(10);

    // Add records table
    records.forEach((record, index) => {
      if (yPosition > 270) {
        pdf.addPage();
        yPosition = 30;
      }
      
      // Record number
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${index + 1}.`, 20, yPosition);
      
      // Record details
      pdf.setFont('helvetica', 'normal');
      const recordName = record.name || record.filename || 'Unnamed Record';
      const recordDate = record.uploadedAt ? new Date(record.uploadedAt).toLocaleDateString() : 'N/A';
      const recordType = record.type || record.mimeType || 'Unknown';
      
      pdf.text(`${recordName}`, 30, yPosition);
      pdf.text(`Date: ${recordDate}`, 120, yPosition);
      
      // Show if file is attached
      if (record.url && record.size && record.size < 500 * 1024) {
        pdf.setTextColor(10, 132, 255); // iOS blue
        pdf.text(`[Attached]`, 160, yPosition);
        pdf.setTextColor(...textColor);
      } else if (record.url) {
        pdf.text(`Type: ${recordType}`, 160, yPosition);
      } else {
        pdf.text(`Type: ${recordType}`, 160, yPosition);
      }
      
      yPosition += 7;
      
      // Add extracted data if available
      if (record.extractedData) {
        pdf.setFontSize(9);
        pdf.setTextColor(100, 100, 100);
        const summary = record.extractedData.summary || 'No summary available';
        const summaryLines = pdf.splitTextToSize(summary, 160);
        summaryLines.slice(0, 2).forEach((line) => {
          pdf.text(line, 30, yPosition);
          yPosition += 5;
        });
        pdf.setTextColor(...textColor);
        pdf.setFontSize(10);
      }
      
      yPosition += 3;
    });

    // Add footer on last page
    const pageCount = pdf.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      
      // Add page number
      pdf.setFontSize(9);
      pdf.setTextColor(150, 150, 150);
      pdf.text(`Page ${i} of ${pageCount}`, 105, 285, { align: 'center' });
      
      // Add security notice
      pdf.setFontSize(8);
      pdf.text('This document contains protected health information', 105, 290, { align: 'center' });
    }

    // Generate blob for attachment
    const pdfBlob = pdf.output('blob');
    const pdfBase64 = await blobToBase64(pdfBlob);
    
    return {
      blob: pdfBlob,
      base64: pdfBase64,
      fileName: `health_records_${patientName.replace(/\s+/g, '_')}_${Date.now()}.pdf`,
      pageCount,
      size: pdfBlob.size
    };
  } catch (error) {
    console.error('[PDFGenerator] Error generating PDF:', error);
    throw new Error('Failed to generate PDF summary');
  }
}

/**
 * Generate an AI-style summary of health records
 */
function generateAISummary(records) {
  // This is a mock AI summary generator
  // In production, you would use an actual AI service
  
  const recordTypes = {};
  let earliestDate = null;
  let latestDate = null;
  
  records.forEach(record => {
    // Count record types
    const type = record.type || 'document';
    recordTypes[type] = (recordTypes[type] || 0) + 1;
    
    // Track date range
    if (record.uploadedAt) {
      const date = new Date(record.uploadedAt);
      if (!earliestDate || date < earliestDate) earliestDate = date;
      if (!latestDate || date > latestDate) latestDate = date;
    }
  });
  
  // Build summary
  let summary = `This health records package contains ${records.length} document${records.length !== 1 ? 's' : ''} `;
  
  if (earliestDate && latestDate) {
    summary += `spanning from ${earliestDate.toLocaleDateString()} to ${latestDate.toLocaleDateString()}. `;
  }
  
  // Add record type breakdown
  const typeDescriptions = Object.entries(recordTypes)
    .map(([type, count]) => `${count} ${type}${count !== 1 ? 's' : ''}`)
    .join(', ');
  
  summary += `The records include: ${typeDescriptions}. `;
  
  // Add health insights (mock)
  const hasLabResults = records.some(r => 
    r.extractedData?.type?.toLowerCase().includes('lab') ||
    r.name?.toLowerCase().includes('lab')
  );
  
  const hasImagingResults = records.some(r => 
    r.type === 'image' ||
    r.extractedData?.type?.toLowerCase().includes('imaging') ||
    r.name?.toLowerCase().includes('xray') ||
    r.name?.toLowerCase().includes('scan')
  );
  
  if (hasLabResults) {
    summary += 'Laboratory results are included for comprehensive health assessment. ';
  }
  
  if (hasImagingResults) {
    summary += 'Imaging studies are included for visual diagnostic information. ';
  }
  
  // Add recommendation
  summary += '\n\nRecommendation: Please review all attached records for a complete understanding of the patient\'s health history. ';
  summary += 'Pay special attention to recent test results and any noted abnormalities. ';
  summary += 'Contact the patient if additional information or clarification is needed.';
  
  return summary;
}

/**
 * Convert Blob to Base64 string
 */
async function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result.split(',')[1];
      resolve(base64String);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Generate a simple text summary for fallback
 */
export function generateTextSummary({ patientName, patientEmail, records }) {
  let summary = `HEALTH RECORDS SUMMARY\n`;
  summary += `${'='.repeat(50)}\n\n`;
  summary += `Patient: ${patientName}\n`;
  summary += `Email: ${patientEmail}\n`;
  summary += `Date: ${new Date().toLocaleDateString()}\n`;
  summary += `Total Records: ${records.length}\n\n`;
  
  summary += `RECORDS LIST:\n`;
  summary += `${'-'.repeat(50)}\n`;
  
  records.forEach((record, index) => {
    summary += `\n${index + 1}. ${record.name || 'Unnamed Record'}\n`;
    summary += `   Date: ${record.uploadedAt ? new Date(record.uploadedAt).toLocaleDateString() : 'N/A'}\n`;
    summary += `   Type: ${record.type || 'Unknown'}\n`;
    
    if (record.extractedData?.summary) {
      summary += `   Summary: ${record.extractedData.summary}\n`;
    }
  });
  
  summary += `\n${'='.repeat(50)}\n`;
  summary += `Generated by Revado Health App\n`;
  
  return summary;
}

export default {
  generateHealthRecordsPDF,
  generateTextSummary
};