
'use client';

import jsPDF from 'jspdf';
import { amiriFont } from './amiri-font';
import type { Employee, TimeEntry, Location } from '@/types';
import { calculateDuration, formatDate, formatTime } from './utils';

type Translations = (key: string) => string;

const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const MARGIN = 10;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

// Helper for RTL text
const rtlText = (doc: jsPDF, text: string, x: number, y: number, options: any = {}) => {
  const isRtl = options.align === 'right';
  const textWidth = doc.getTextWidth(text);
  const finalX = isRtl ? x - textWidth : x;
  doc.text(text, finalX, y, options);
  return finalX + textWidth;
};


export const generatePdfReport = (
  employee: Employee,
  employeeEntries: TimeEntry[],
  locations: Location[],
  t: Translations,
  isRtl: boolean,
  language: string
) => {
  const doc = new jsPDF('p', 'mm', 'a4');

  // Register and set font
  if (isRtl) {
    try {
      doc.addFileToVFS('Amiri-Regular.ttf', amiriFont);
      doc.addFont('Amiri-Regular.ttf', 'Amiri', 'normal');
      doc.setFont('Amiri');
    } catch (e) {
      console.error("Could not load Amiri font for PDF, falling back to default.", e);
      // Fallback font if Amiri fails
      doc.setFont('helvetica');
    }
  } else {
    doc.setFont('helvetica');
  }

  const locale = language === 'ar' ? 'ar-EG' : 'de-DE';

  const totalHours = employeeEntries.reduce((acc, entry) => {
      const start = new Date(entry.startTime).getTime();
      const end = new Date(entry.endTime).getTime();
      const durationMs = end - start;
      return acc + (durationMs > 0 ? durationMs / (1000 * 60 * 60) : 0);
  }, 0).toFixed(2);

  const totalPaidAmount = employeeEntries
    .filter(entry => entry.paid && entry.amount)
    .reduce((acc, entry) => acc + (entry.amount || 0), 0);

  let pageNumber = 1;
  const totalPages = 1; // We will update this later
  let cursorY = MARGIN;

  const drawHeader = () => {
    // App Title
    doc.setFontSize(22);
    doc.setTextColor(48, 84, 153); // primary color
    if (isRtl) {
      rtlText(doc, t('appTitle'), PAGE_WIDTH - MARGIN, cursorY + 5, { align: 'right' });
    } else {
      doc.text(t('appTitle'), MARGIN, cursorY + 5);
    }
    
    // Report Title
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    const reportTitle = t('workReport');
    const reportDate = new Date().toLocaleDateString(locale);
    
    if (isRtl) {
        rtlText(doc, reportTitle, MARGIN + 40, cursorY, { align: 'right' });
        doc.setFontSize(10);
        rtlText(doc, reportDate, MARGIN + 40, cursorY + 5, { align: 'right' });

    } else {
        const reportTitleWidth = doc.getTextWidth(reportTitle);
        doc.text(reportTitle, PAGE_WIDTH - MARGIN - reportTitleWidth, cursorY);
        doc.setFontSize(10);
        const reportDateWidth = doc.getTextWidth(reportDate);
        doc.text(reportDate, PAGE_WIDTH - MARGIN - reportDateWidth, cursorY + 5);
    }

    cursorY += 15;
    doc.setDrawColor(226, 232, 240); // gray-200
    doc.line(MARGIN, cursorY, PAGE_WIDTH - MARGIN, cursorY);
    cursorY += 10;
  };

  const drawEmployeeDetails = () => {
    doc.setFontSize(12);
    doc.setTextColor(0,0,0);
    if (isRtl) {
      rtlText(doc, t('employeeDetails'), PAGE_WIDTH - MARGIN, cursorY, { align: 'right' });
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
    
    if (isRtl) {
        rtlText(doc, employeeNameLabel, PAGE_WIDTH - MARGIN - 5, cursorY + 5, { align: 'right' });
        doc.setFontSize(11);
        doc.setTextColor(0,0,0);
        rtlText(doc, employee.name, PAGE_WIDTH - MARGIN - 5 - doc.getTextWidth(employeeNameLabel) - 5, cursorY + 5, { align: 'right' });

    } else {
        doc.text(employeeNameLabel, MARGIN + 5, cursorY + 5);
        doc.setFontSize(11);
        doc.setTextColor(0,0,0);
        doc.text(employee.name, MARGIN + 5 + doc.getTextWidth(employeeNameLabel) + 5, cursorY + 5);
    }
    
    cursorY += 20;
  };

  const drawSummary = () => {
    doc.setFontSize(12);
    doc.setTextColor(0,0,0);

    if (isRtl) {
        rtlText(doc, t('summary'), PAGE_WIDTH - MARGIN, cursorY, { align: 'right' });
    } else {
        doc.text(t('summary'), MARGIN, cursorY);
    }
    cursorY += 5;

    const cardWidth = (CONTENT_WIDTH / 2) - 2;

    // Total Hours Card
    doc.setFillColor(241, 245, 249); // gray-100
    doc.roundedRect(MARGIN, cursorY, cardWidth, 20, 3, 3, 'F');
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); // gray-500
    rtlText(doc, t('totalHours'), MARGIN + cardWidth / 2, cursorY + 7, { align: 'center' });
    doc.setFontSize(14);
    doc.setTextColor(0,0,0);
    rtlText(doc, `${totalHours}h`, MARGIN + cardWidth / 2, cursorY + 15, { align: 'center' });

    // Total Paid Card
    const secondCardX = MARGIN + cardWidth + 4;
    doc.setFillColor(220, 252, 231); // green-100
    doc.roundedRect(secondCardX, cursorY, cardWidth, 20, 3, 3, 'F');
    doc.setFontSize(10);
    doc.setTextColor(22, 101, 52); // green-700
    rtlText(doc, t('totalPaid'), secondCardX + cardWidth / 2, cursorY + 7, { align: 'center' });
    doc.setFontSize(14);
    doc.setTextColor(21, 94, 53); // green-800
    rtlText(doc, `${totalPaidAmount.toLocaleString(locale)} ${t('currency')}`, secondCardX + cardWidth / 2, cursorY + 15, { align: 'center' });

    cursorY += 30;
  };

  const drawTableHeader = () => {
    doc.setFontSize(12);
    doc.setTextColor(0,0,0);
    if(isRtl) {
        rtlText(doc, t('timeEntries'), PAGE_WIDTH - MARGIN, cursorY, { align: 'right' });
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
    let currentX = isRtl ? PAGE_WIDTH - MARGIN - 2 : MARGIN + 2;

    headers.forEach((header, i) => {
        const options: any = { };
        if (isRtl) {
            options.align = 'right';
        }
        rtlText(doc, header, currentX, tableHeaderY + 7, options);
        currentX += isRtl ? -colWidths[i] : colWidths[i];
    });

    cursorY += 10;
  };

  const drawTableRow = (entry: TimeEntry, rowY: number) => {
    const rowHeight = 10;
    doc.setFontSize(9);
    doc.setTextColor(0,0,0);

    const getLocationName = (locationId: string) => locations.find(l => l.id === locationId)?.name || t('unknown');
    const statusText = entry.paid ? t('paid') : t('unpaid');
    const amountText = entry.amount ? `${entry.amount.toLocaleString(locale)} ${t('currency')}` : '-';

    const values = [
        formatDate(entry.startTime),
        getLocationName(entry.locationId),
        `${formatTime(entry.startTime)} - ${formatTime(entry.endTime)}`,
        calculateDuration(entry.startTime, entry.endTime),
        statusText,
        amountText
    ];

    const colWidths = [25, 45, 30, 25, 30, 35];
    let currentX = MARGIN + 2;
    if (isRtl) {
        currentX = PAGE_WIDTH - MARGIN - 2;
    }

    values.forEach((cell, i) => {
        const textX = isRtl ? currentX : currentX;
        const options: any = {};
        if (isRtl) {
          options.align = 'right';
        }
        
        // Handle status badge
        if (i === 4) { // Status column
            const statusColor = entry.paid ? { bg: [220, 252, 231], text: [22, 101, 52] } : { bg: [254, 226, 226], text: [153, 27, 27] };
            
            const textWidth = doc.getTextWidth(cell) + 8;
            const cellX = isRtl ? textX - textWidth + 2 : textX - 2;
            
            doc.setFillColor(statusColor.bg[0], statusColor.bg[1], statusColor.bg[2]);
            doc.roundedRect(cellX, rowY - rowHeight / 2 - 1, textWidth, 6, 3, 3, 'F');
            doc.setTextColor(statusColor.text[0], statusColor.text[1], statusColor.text[2]);
            rtlText(doc, cell, textX, rowY, options);
            doc.setTextColor(0,0,0); // reset text color
        } else if (i === 5) { // Amount column, align right
            const amountOptions: any = { align: 'right' };
            if (!isRtl) {
                rtlText(doc, cell, currentX + colWidths[i] - 4, rowY, amountOptions);
            } else {
                 rtlText(doc, cell, currentX, rowY, amountOptions);
            }

        } else {
            rtlText(doc, cell, textX, rowY, options);
        }

        currentX += isRtl ? -colWidths[i] : colWidths[i];
    });

    doc.setDrawColor(226, 232, 240); // gray-200
    doc.line(MARGIN, rowY + rowHeight / 2, PAGE_WIDTH - MARGIN, rowY + rowHeight / 2);
  };
  
  const drawFooter = (pNum: number, totalP: number) => {
      const footerY = PAGE_HEIGHT - 7;
      doc.setFontSize(8);
      doc.setTextColor(156, 163, 175); // gray-400
      const footerText = `${t('reportGeneratedBy')} ${t('appTitle')}`;
      const pageText = `${t('page')} ${pNum} ${t('of')} ${totalP}`;

      rtlText(doc, footerText, PAGE_WIDTH / 2, footerY, { align: 'center'});
      rtlText(doc, pageText, PAGE_WIDTH / 2, footerY + 4, { align: 'center'});
  }

  // --- PDF Generation Flow ---
  drawHeader();
  drawEmployeeDetails();
  drawSummary();
  drawTableHeader();

  const sortedEntries = [...employeeEntries].sort((a,b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  
  sortedEntries.forEach(entry => {
    const rowHeight = 10;
    if (cursorY + rowHeight > PAGE_HEIGHT - MARGIN - 15) { // check for footer space
      pageNumber++;
      doc.addPage();
      cursorY = MARGIN;
      drawHeader();
      drawTableHeader();
    }
    drawTableRow(entry, cursorY + rowHeight / 2);
    cursorY += rowHeight;
  });

  // Add footers to all pages
  const totalPagesFinal = doc.getNumberOfPages();
  for (let i = 1; i <= totalPagesFinal; i++) {
      doc.setPage(i);
      drawFooter(i, totalPagesFinal);
  }


  doc.save(`${employee.name}-report.pdf`);
};

