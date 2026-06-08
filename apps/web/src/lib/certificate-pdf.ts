import { jsPDF } from 'jspdf';

export interface CertificateData {
  studentName: string;
  courseTitle: string;
  issuedAt: string | Date;
  uniqueCode: string;
  schoolName?: string;
}

/**
 * Generates and downloads a course-completion certificate as a PDF,
 * entirely in the browser. No server round-trip required.
 */
export function downloadCertificatePdf(cert: CertificateData) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });

  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const cx = pageW / 2;

  const brand = '#0090B8';
  const dark = '#1F2937';
  const muted = '#6B7280';

  // Outer + inner decorative borders
  doc.setDrawColor(brand);
  doc.setLineWidth(4);
  doc.rect(24, 24, pageW - 48, pageH - 48);
  doc.setLineWidth(1);
  doc.rect(36, 36, pageW - 72, pageH - 72);

  // Brand badge
  doc.setFillColor(brand);
  doc.roundedRect(cx - 26, 70, 52, 52, 10, 10, 'F');
  doc.setTextColor('#FFFFFF');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('AC', cx, 103, { align: 'center' });

  // Heading
  doc.setTextColor(dark);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(30);
  doc.text('Certificate of Completion', cx, 165, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(muted);
  doc.text('IADL Center EMIS — ' + (cert.schoolName || 'Angaza Center'), cx, 188, { align: 'center' });

  // Body
  doc.setFontSize(13);
  doc.setTextColor(muted);
  doc.text('This is to certify that', cx, 235, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(26);
  doc.setTextColor(brand);
  doc.text(cert.studentName, cx, 272, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(13);
  doc.setTextColor(muted);
  doc.text('has successfully completed the course', cx, 305, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(dark);
  doc.text(cert.courseTitle, cx, 338, { align: 'center', maxWidth: pageW - 160 });

  // Footer: date (left) and verification code (right)
  const issued = new Date(cert.issuedAt);
  const issuedStr = isNaN(issued.getTime())
    ? String(cert.issuedAt)
    : issued.toLocaleDateString('en-KE', { year: 'numeric', month: 'long', day: 'numeric' });

  const footY = pageH - 90;
  doc.setDrawColor(muted);
  doc.setLineWidth(0.5);
  doc.line(90, footY, 250, footY);
  doc.line(pageW - 250, footY, pageW - 90, footY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(muted);
  doc.text('Date Issued', 170, footY + 16, { align: 'center' });
  doc.text(issuedStr, 170, footY + 32, { align: 'center' });

  doc.text('Verification Code', pageW - 170, footY + 16, { align: 'center' });
  doc.setFont('courier', 'normal');
  doc.text(cert.uniqueCode, pageW - 170, footY + 32, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(muted);
  doc.text(
    'Verify this certificate at /certificates/verify/' + cert.uniqueCode,
    cx,
    pageH - 48,
    { align: 'center' },
  );

  const safeCourse = cert.courseTitle.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
  doc.save(`certificate-${safeCourse}-${cert.uniqueCode}.pdf`);
}
