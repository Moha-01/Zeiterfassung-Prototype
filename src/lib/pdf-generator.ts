
'use client';

import jsPDF from 'jspdf';
import type { Employee, TimeEntry, Location } from '@/types';
import { calculateDuration, formatDate, formatTime } from './utils';

type Translations = (key: string) => string;

const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const MARGIN = 15;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const HEADER_HEIGHT = 40;
const FOOTER_HEIGHT = 20;
const PAGE_CONTENT_HEIGHT = PAGE_HEIGHT - HEADER_HEIGHT - FOOTER_HEIGHT;

export const generatePdfReport = (
  employee: Employee,
  employeeEntries: TimeEntry[],
  locations: Location[],
  t: Translations,
  isRtl: boolean,
  language: string
) => {
  const doc = new jsPDF('p', 'mm', 'a4');

  if (isRtl) {
    // Using a standard font as a fallback. For full Arabic support, a font file would need to be correctly embedded.
    // To avoid crashes, we'll rely on system fonts or jsPDF's limited default support.
    doc.setFont('helvetica');
  } else {
    doc.setFont('helvetica');
  }
  
  const locale = language === 'ar' ? 'ar-EG' : (language === 'de' ? 'de-DE' : 'en-US');

  const totalHours = employeeEntries.reduce((acc, entry) => {
      const start = new Date(entry.startTime).getTime();
      const end = new Date(entry.endTime).getTime();
      const durationMs = end - start;
      return acc + (durationMs > 0 ? durationMs / (1000 * 60 * 60) : 0);
  }, 0).toFixed(2);

  const totalPaidAmount = employeeEntries
    .filter(entry => entry.paid && entry.amount)
    .reduce((acc, entry) => acc + (entry.amount || 0), 0);

  let cursorY = 0;
  
  const drawPageHeader = () => {
    cursorY = MARGIN;
    // App Title
    doc.setFontSize(22);
    doc.setTextColor(48, 84, 153); // primary color
    if (isRtl) {
      doc.text(t('appTitle'), PAGE_WIDTH - MARGIN, cursorY + 5, { align: 'right' });
    } else {
      doc.text(t('appTitle'), MARGIN, cursorY + 5);
    }
    
    // Report Title
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    const reportTitle = t('workReport');
    const reportDate = new Date().toLocaleDateString(locale);
    
    if (isRtl) {
        doc.text(reportTitle, MARGIN, cursorY, { align: 'left' });
        doc.setFontSize(10);
        doc.text(reportDate, MARGIN, cursorY + 5, { align: 'left' });

    } else {
        doc.text(reportTitle, PAGE_WIDTH - MARGIN, cursorY, { align: 'right' });
        doc.setFontSize(10);
        doc.text(reportDate, PAGE_WIDTH - MARGIN, cursorY + 5, { align: 'right' });
    }

    cursorY += 15;
    doc.setDrawColor(226, 232, 240); // gray-200
    doc.line(MARGIN, cursorY, PAGE_WIDTH - MARGIN, cursorY);
    cursorY += 10;
  };

  const drawPageFooter = (pageNumber: number, totalPages: number) => {
      const footerY = PAGE_HEIGHT - 15;
      doc.setFontSize(8);
      doc.setTextColor(156, 163, 175); // gray-400
      const footerText = `${t('reportGeneratedBy')} ${t('appTitle')}`;
      const pageText = `${t('page')} ${pageNumber} ${t('of')} ${totalPages}`;

      doc.text(footerText, PAGE_WIDTH / 2, footerY, { align: 'center'});
      doc.text(pageText, PAGE_WIDTH / 2, footerY + 5, { align: 'center'});
  }

  const drawEmployeeDetails = () => {
    doc.setFontSize(12);
    doc.setTextColor(0,0,0);
    if (isRtl) {
      doc.text(t('employeeDetails'), PAGE_WIDTH - MARGIN, cursorY, { align: 'right' });
    } else {
      doc.text(t('employeeDetails'), MARGIN, cursorY);
    }
    cursorY += 5;

    doc.setDrawColor(226, 232, 240); // border color
    doc.setFillColor(255, 255, 255); // white
    doc.roundedRect(MARGIN, cursorY, CONTENT_WIDTH, 12, 3, 3, 'FD');

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); // gray-500
    const employeeNameLabel = t('employeeName');
    const employeeNameLabelWidth = doc.getTextWidth(employeeNameLabel);
    
    if (isRtl) {
        doc.text(employeeNameLabel, PAGE_WIDTH - MARGIN - 5, cursorY + 7, { align: 'right' });
        doc.setFontSize(11);
        doc.setTextColor(0,0,0);
        doc.text(employee.name, PAGE_WIDTH - MARGIN - 10 - employeeNameLabelWidth, cursorY + 7, { align: 'right' });
    } else {
        doc.text(employeeNameLabel, MARGIN + 5, cursorY + 7);
        doc.setFontSize(11);
        doc.setTextColor(0,0,0);
        doc.text(employee.name, MARGIN + 10 + employeeNameLabelWidth, cursorY + 7);
    }
    
    cursorY += 20;
  };

  const drawSummary = () => {
    doc.setFontSize(12);
    doc.setTextColor(0,0,0);

    if (isRtl) {
        doc.text(t('summary'), PAGE_WIDTH - MARGIN, cursorY, { align: 'right' });
    } else {
        doc.text(t('summary'), MARGIN, cursorY);
    }
    cursorY += 5;

    const cardWidth = (CONTENT_WIDTH / 2) - 2;
    
    const firstCardX = isRtl ? MARGIN + cardWidth + 4 : MARGIN;
    const secondCardX = isRtl ? MARGIN : MARGIN + cardWidth + 4;
    
    // Total Hours Card
    doc.setFillColor(241, 245, 249); // gray-100
    doc.roundedRect(secondCardX, cursorY, cardWidth, 20, 3, 3, 'F');
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); // gray-500
    doc.text(t('totalHours'), secondCardX + cardWidth / 2, cursorY + 7, { align: 'center' });
    doc.setFontSize(14);
    doc.setTextColor(0,0,0);
    doc.text(`${totalHours}h`, secondCardX + cardWidth / 2, cursorY + 15, { align: 'center' });

    // Total Paid Card
    doc.setFillColor(220, 252, 231); // green-100
    doc.roundedRect(firstCardX, cursorY, cardWidth, 20, 3, 3, 'F');
    doc.setFontSize(10);
    doc.setTextColor(22, 101, 52); // green-700
    doc.text(t('totalPaid'), firstCardX + cardWidth / 2, cursorY + 7, { align: 'center' });
    doc.setFontSize(14);
    doc.setTextColor(21, 94, 53); // green-800
    doc.text(`${totalPaidAmount.toLocaleString(locale)} ${t('currency')}`, firstCardX + cardWidth / 2, cursorY + 15, { align: 'center' });

    cursorY += 30;
  };
  
  const drawTableHeader = () => {
    doc.setFontSize(12);
    doc.setTextColor(0,0,0);
    if(isRtl) {
        doc.text(t('timeEntries'), PAGE_WIDTH - MARGIN, cursorY, { align: 'right' });
    } else {
        doc.text(t('timeEntries'), MARGIN, cursorY);
    }
    cursorY += 8;

    const tableHeaderY = cursorY;
    doc.setFillColor(248, 250, 252); // gray-50
    doc.rect(MARGIN, tableHeaderY, CONTENT_WIDTH, 10, 'F');
    doc.setDrawColor(226, 232, 240); // gray-200
    doc.line(MARGIN, tableHeaderY, PAGE_WIDTH - MARGIN, tableHeaderY);
    doc.line(MARGIN, tableHeaderY + 10, PAGE_WIDTH - MARGIN, tableHeaderY + 10);

    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139); // gray-500
    
    const headers = [t('date'), t('location'), t('time'), t('duration'), t('status'), t('amount')];
    const colWidths = [25, 45, 30, 25, 30, 35];
    let currentX = MARGIN;

    if (isRtl) {
      currentX = PAGE_WIDTH - MARGIN;
      const rtlHeaders = [t('amount'), t('status'), t('duration'), t('time'), t('location'), t('date')];
      const rtlWidths = [35, 30, 25, 30, 45, 25];
      rtlHeaders.forEach((header, i) => {
        doc.text(header, currentX - 2, tableHeaderY + 7, { align: 'right', maxWidth: rtlWidths[i] - 4 });
        currentX -= rtlWidths[i];
      });
    } else {
      headers.forEach((header, i) => {
          doc.text(header, currentX + 2, tableHeaderY + 7, {align: 'left'});
          currentX += colWidths[i];
      });
    }

    cursorY += 10;
  };

  const drawTableRow = (entry: TimeEntry) => {
    const rowHeight = 12;

    if (cursorY + rowHeight > PAGE_CONTENT_HEIGHT) {
      doc.addPage();
      drawPageHeader();
      drawTableHeader();
    }


    doc.setFontSize(9);
    doc.setTextColor(0,0,0);

    const getLocationName = (locationId: string) => locations.find(l => l.id === locationId)?.name || t('unknown');
    const statusText = entry.paid ? t('paid') : t('unpaid');
    const amountText = entry.amount ? `${entry.amount.toLocaleString(locale)} ${t('currency')}` : '-';

    const values = [
        formatDate(entry.startTime, locale),
        getLocationName(entry.locationId),
        `${formatTime(entry.startTime, locale)} - ${formatTime(entry.endTime, locale)}`,
        calculateDuration(entry.startTime, entry.endTime),
        statusText,
        amountText
    ];

    const colWidths = [25, 45, 30, 25, 30, 35];
    let currentX = MARGIN;
    
    const rowY = cursorY + rowHeight / 2 + 1;

    if (isRtl) {
      currentX = PAGE_WIDTH - MARGIN;
      const rtlValues = [amountText, statusText, calculateDuration(entry.startTime, entry.endTime), `${formatTime(entry.startTime, locale)} - ${formatTime(entry.endTime, locale)}`, getLocationName(entry.locationId), formatDate(entry.startTime, locale)];
      const rtlWidths = [35, 30, 25, 30, 45, 25];

      rtlValues.forEach((cell, i) => {
        const textX = currentX - 2;
        if (i === 1) { // Status column
            const statusColor = entry.paid ? { bg: [220, 252, 231], text: [22, 101, 52] } : { bg: [254, 226, 226], text: [153, 27, 27] };
            const textWidth = doc.getTextWidth(cell) + 8;
            const cellX = currentX - rtlWidths[i] + (rtlWidths[i] - textWidth) / 2;
            doc.setFillColor(statusColor.bg[0], statusColor.bg[1], statusColor.bg[2]);
            doc.roundedRect(cellX, rowY - 4, textWidth, 6, 3, 3, 'F');
            doc.setTextColor(statusColor.text[0], statusColor.text[1], statusColor.text[2]);
            doc.text(cell, currentX - rtlWidths[i]/2, rowY, { align: 'center'});
            doc.setTextColor(0,0,0);
        } else {
             doc.text(cell, textX, rowY, { align: 'right', maxWidth: rtlWidths[i] - 4 });
        }
        currentX -= rtlWidths[i];
      });
    } else {
      values.forEach((cell, i) => {
          const textX = currentX + 2;
          if (i === 4) { // Status column
              const statusColor = entry.paid ? { bg: [220, 252, 231], text: [22, 101, 52] } : { bg: [254, 226, 226], text: [153, 27, 27] };
              const textWidth = doc.getTextWidth(cell) + 8;
              doc.setFillColor(statusColor.bg[0], statusColor.bg[1], statusColor.bg[2]);
              doc.roundedRect(textX - 2, rowY - 4, textWidth, 6, 3, 3, 'F');
              doc.setTextColor(statusColor.text[0], statusColor.text[1], statusColor.text[2]);
              doc.text(cell, textX, rowY, {align: 'left'});
              doc.setTextColor(0,0,0);
          } else if (i === 5) { // Amount column
               doc.text(cell, currentX + colWidths[i] - 2, rowY, {align: 'right'});
          } else {
              doc.text(cell, textX, rowY, {align: 'left'});
          }
          currentX += colWidths[i];
      });
    }

    doc.setDrawColor(226, 232, 240); // gray-200
    doc.line(MARGIN, cursorY + rowHeight, PAGE_WIDTH - MARGIN, cursorY + rowHeight);
    cursorY += rowHeight;
  };
  
  // --- PDF Generation Flow ---
  drawPageHeader();
  drawEmployeeDetails();
  drawSummary();
  drawTableHeader();

  const sortedEntries = [...employeeEntries].sort((a,b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  
  if (sortedEntries.length > 0) {
    sortedEntries.forEach(entry => {
        drawTableRow(entry);
    });
  } else {
    cursorY += 10;
    doc.text(t('noWorkHistory'), PAGE_WIDTH / 2, cursorY, { align: 'center' });
  }


  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      drawPageFooter(i, totalPages);
  }

  doc.save(`${employee.name}-report-${locale}.pdf`);
};
