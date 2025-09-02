// @ts-nocheck
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import type { Employee, TimeEntry } from '@/types';
import { calculateDuration, calculateDurationInHours, formatDate, formatTime } from './utils';

// We have to use a type assertion here because the jspdf-autotable definitions are not up to date.
type jsPDFWithAutoTable = jsPDF & {
  autoTable: (options: any) => jsPDF;
};

interface TranslationHelpers {
    t: (key: string) => string;
    language: string;
    dir: 'ltr' | 'rtl';
    getLocationName: (id: string) => string;
}

// Function to fetch the font and convert it to Base64
async function getFontAsBase64(fontPath: string): Promise<string> {
    const response = await fetch(fontPath);
    if (!response.ok) {
        throw new Error(`Failed to fetch font: ${response.statusText}`);
    }
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            // The result is a data URL, we need to extract the Base64 part.
            const base64data = (reader.result as string).split(',')[1];
            resolve(base64data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}


export const generatePdfReport = async (employee: Employee, entries: TimeEntry[], helpers: TranslationHelpers) => {
    const { t, language, dir, getLocationName } = helpers;
    const isRtl = dir === 'rtl';

    const doc = new jsPDF() as jsPDFWithAutoTable;

    // Add Rubik font for Arabic support
    if (isRtl) {
        try {
            const fontBase64 = await getFontAsBase64('/fonts/Rubik-VariableFont_wght.ttf');
            doc.addFileToVFS("Rubik-Regular.ttf", fontBase64);
            doc.addFont("Rubik-Regular.ttf", "Rubik", "normal");
            doc.setFont("Rubik");
        } catch (error) {
            console.error("Could not load custom font for PDF, falling back to default.", error);
            // Fallback to a default font if custom font fails to load
            doc.setFont('helvetica');
        }
    } else {
        doc.setFont('helvetica');
    }
    
    // Header
    doc.setFontSize(20);
    const title = t('workReport');
    const titleWidth = doc.getTextWidth(title);
    doc.text(title, (doc.internal.pageSize.width - titleWidth) / 2, 20);

    // Employee Details
    doc.setFontSize(12);
    const employeeDetailsY = 35;
    if (isRtl) {
        const detailsText = `${employee.name} :${t('employeeDetails')}`;
        const detailsWidth = doc.getTextWidth(detailsText);
        doc.text(detailsText, doc.internal.pageSize.width - 20, employeeDetailsY, { align: 'right' });
    } else {
        doc.text(`${t('employeeDetails')}: ${employee.name}`, 20, employeeDetailsY);
    }
    doc.text(`${t('reportGeneratedBy')}: ${t('appTitle')}`, 20, employeeDetailsY + 8);
    
    // Summary
    const totalHours = entries.reduce((acc, entry) => acc + calculateDurationInHours(entry.startTime, entry.endTime), 0);
    const totalPaid = entries.filter(e => e.paid).reduce((acc, entry) => acc + (entry.amount || 0), 0);
    const totalUnpaidEntries = entries.filter(e => !e.paid).length;
    
    const summaryY = employeeDetailsY + 20;
    doc.setFontSize(14);
    doc.text(t('summary'), (doc.internal.pageSize.width - doc.getTextWidth(t('summary'))) / 2, summaryY);

    const summaryData = [
        [totalHours.toFixed(2), t('totalHours')],
        [totalPaid.toLocaleString() + ' ' + t('currency'), t('totalPaid')],
        [totalUnpaidEntries, t('totalUnpaid')]
    ];

    doc.autoTable({
        startY: summaryY + 5,
        head: [[t('value'), t('description')]],
        body: summaryData,
        theme: 'striped',
        headStyles: {
            fillColor: [41, 128, 185],
            textColor: 255,
            fontStyle: 'bold',
            halign: isRtl ? 'right' : 'left',
            font: isRtl ? 'Rubik' : 'helvetica',
        },
        bodyStyles: {
            halign: isRtl ? 'right' : 'left',
            font: isRtl ? 'Rubik' : 'helvetica',
        },
        columnStyles: {
            0: { halign: 'center' }
        },
        didParseCell: function (data) {
            if (isRtl && data.section === 'body') {
                data.cell.text = [data.cell.text[0].split(' ').reverse().join('  ')];
            }
        },
    });


    // Time Entries Table
    const tableY = doc.autoTable.previous.finalY + 15;
    doc.setFontSize(14);
    doc.text(t('timeEntries'), (doc.internal.pageSize.width - doc.getTextWidth(t('timeEntries'))) / 2, tableY);

    const tableColumns = [
        { header: t('status'), dataKey: 'status' },
        { header: t('amount'), dataKey: 'amount' },
        { header: t('duration'), dataKey: 'duration' },
        { header: t('time'), dataKey: 'time' },
        { header: t('location'), dataKey: 'location' },
        { header: t('date'), dataKey: 'date' },
    ];
    
    if (!isRtl) {
        tableColumns.reverse();
    }


    const tableRows = entries.map(entry => {
        const row = {
            date: formatDate(entry.startTime, language),
            location: getLocationName(entry.locationId),
            time: `${formatTime(entry.startTime, language)} - ${formatTime(entry.endTime, language)}`,
            duration: calculateDuration(entry.startTime, entry.endTime),
            amount: entry.amount ? entry.amount.toLocaleString() + ' ' + t('currency') : '-',
            status: entry.paid ? t('paid') : t('unpaid'),
        };
        return row;
    });

    doc.autoTable({
        startY: tableY + 5,
        head: [tableColumns.map(c => c.header)],
        body: tableRows.map(row => tableColumns.map(c => row[c.dataKey])),
        theme: 'grid',
        headStyles: {
            fillColor: [41, 128, 185],
            textColor: 255,
            fontStyle: 'bold',
            halign: isRtl ? 'right' : 'left',
            font: isRtl ? 'Rubik' : 'helvetica',
        },
        bodyStyles: {
            halign: isRtl ? 'right' : 'left',
            font: isRtl ? 'Rubik' : 'helvetica',
        },
        didDrawPage: (data) => {
            // Footer
            const pageCount = doc.internal.getNumberOfPages();
            doc.setFontSize(10);
            const pageText = `${t('page')} ${data.pageNumber} ${t('of')} ${pageCount}`;
            doc.text(pageText, doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 10, { align: 'center' });
        }
    });

    // Save the PDF
    doc.save(`Work-Report-${employee.name.replace(/\s/g, '-')}.pdf`);
}
