/**
 * Export Manager - Client-side export utilities for WebOS
 * Handles exporting files to various formats (PDF, XLSX, DOCX, Images, etc.)
 * All libraries used are MIT-licensed
 */

import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import html2canvas from 'html2canvas';
import { saveAs } from 'file-saver';

export interface ExportOptions {
  fileName?: string;
  content?: string;
  path?: string;
  data?: any[][];
  elementId?: string;
}

export class ExportManager {
  /**
   * Export content to PDF format
   */
  static async exportToPDF(options: ExportOptions): Promise<void> {
    const { fileName = 'export.pdf', content = '', path } = options;

    try {
      let textContent = content;

      // If path is provided, fetch content from server
      if (path && !content) {
        textContent = await this.fetchFileContent(path);
      }

      // Create PDF document
      const doc = new jsPDF();

      // Configure font and styling
      doc.setFont('courier');
      doc.setFontSize(10);

      // Split content into lines
      const lines = textContent.split('\n');
      const pageHeight = doc.internal.pageSize.height;
      const lineHeight = 5;
      const margin = 20;
      let y = margin;

      // Add text with pagination
      for (const line of lines) {
        if (y + lineHeight > pageHeight - margin) {
          doc.addPage();
          y = margin;
        }

        // Split long lines
        const splitLines = doc.splitTextToSize(line || ' ', 170);
        for (const splitLine of splitLines) {
          if (y + lineHeight > pageHeight - margin) {
            doc.addPage();
            y = margin;
          }
          doc.text(splitLine, margin, y);
          y += lineHeight;
        }
      }

      // Save the PDF
      doc.save(fileName);
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      throw new Error('Failed to export to PDF');
    }
  }

  /**
   * Export content to Excel (XLSX) format
   */
  static async exportToXLSX(options: ExportOptions): Promise<void> {
    const { fileName = 'export.xlsx', content = '', data, path } = options;

    try {
      let exportData: any[][];

      if (data && Array.isArray(data)) {
        // Use provided data directly
        exportData = data;
      } else {
        // Convert content to rows
        let textContent = content;

        if (path && !content) {
          textContent = await this.fetchFileContent(path);
        }

        const lines = textContent.split('\n');
        exportData = lines.map(line => [line]);
      }

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(exportData);

      // Auto-size columns
      const maxWidth = 50;
      const colWidths = exportData[0]?.map((_, colIdx) => {
        const maxLen = exportData.reduce((max, row) => {
          const cellLen = String(row[colIdx] || '').length;
          return Math.max(max, cellLen);
        }, 0);
        return { wch: Math.min(maxLen + 2, maxWidth) };
      }) || [];

      ws['!cols'] = colWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

      // Write and save file
      XLSX.writeFile(wb, fileName);
    } catch (error) {
      console.error('Error exporting to XLSX:', error);
      throw new Error('Failed to export to Excel');
    }
  }

  /**
   * Export content to Word (DOCX) format
   */
  static async exportToDOCX(options: ExportOptions): Promise<void> {
    const { fileName = 'export.docx', content = '', path } = options;

    try {
      let textContent = content;

      if (path && !content) {
        textContent = await this.fetchFileContent(path);
      }

      // Create paragraphs from content
      const lines = textContent.split('\n');
      const paragraphs = lines.map(
        line =>
          new Paragraph({
            children: [
              new TextRun({
                text: line || ' ',
                font: 'Courier New',
                size: 22, // 11pt * 2
              }),
            ],
          })
      );

      // Create document
      const doc = new Document({
        sections: [
          {
            properties: {},
            children: paragraphs,
          },
        ],
      });

      // Generate and save file
      const blob = await Packer.toBlob(doc);
      saveAs(blob, fileName);
    } catch (error) {
      console.error('Error exporting to DOCX:', error);
      throw new Error('Failed to export to Word document');
    }
  }

  /**
   * Export content to CSV format
   */
  static async exportToCSV(options: ExportOptions): Promise<void> {
    const { fileName = 'export.csv', content = '', data, path } = options;

    try {
      let csvContent: string;

      if (data && Array.isArray(data)) {
        // Convert array data to CSV
        csvContent = data
          .map(row =>
            Array.isArray(row)
              ? row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
              : `"${String(row).replace(/"/g, '""')}"`
          )
          .join('\n');
      } else {
        // Use content directly
        csvContent = content;

        if (path && !content) {
          csvContent = await this.fetchFileContent(path);
        }
      }

      // Create blob and save
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      saveAs(blob, fileName);
    } catch (error) {
      console.error('Error exporting to CSV:', error);
      throw new Error('Failed to export to CSV');
    }
  }

  /**
   * Export content to plain text format
   */
  static async exportToTXT(options: ExportOptions): Promise<void> {
    const { fileName = 'export.txt', content = '', path } = options;

    try {
      let textContent = content;

      if (path && !content) {
        textContent = await this.fetchFileContent(path);
      }

      // Create blob and save
      const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8;' });
      saveAs(blob, fileName);
    } catch (error) {
      console.error('Error exporting to TXT:', error);
      throw new Error('Failed to export to plain text');
    }
  }

  /**
   * Export HTML element to PNG image
   */
  static async exportToPNG(options: ExportOptions): Promise<void> {
    const { fileName = 'export.png', elementId } = options;

    try {
      if (!elementId) {
        throw new Error('Element ID is required for image export');
      }

      const element = document.getElementById(elementId);
      if (!element) {
        throw new Error(`Element with ID "${elementId}" not found`);
      }

      // Capture element as canvas
      const canvas = await html2canvas(element, {
        backgroundColor: '#a0a0a0', // Amiga gray background
        scale: 2, // Higher quality
      });

      // Convert to blob and save
      canvas.toBlob(blob => {
        if (blob) {
          saveAs(blob, fileName);
        }
      });
    } catch (error) {
      console.error('Error exporting to PNG:', error);
      throw new Error('Failed to export to image');
    }
  }

  /**
   * Export HTML element to JPEG image
   */
  static async exportToJPEG(options: ExportOptions): Promise<void> {
    const { fileName = 'export.jpg', elementId } = options;

    try {
      if (!elementId) {
        throw new Error('Element ID is required for image export');
      }

      const element = document.getElementById(elementId);
      if (!element) {
        throw new Error(`Element with ID "${elementId}" not found`);
      }

      // Capture element as canvas
      const canvas = await html2canvas(element, {
        backgroundColor: '#a0a0a0',
        scale: 2,
      });

      // Convert to JPEG blob and save
      canvas.toBlob(
        blob => {
          if (blob) {
            saveAs(blob, fileName);
          }
        },
        'image/jpeg',
        0.95
      );
    } catch (error) {
      console.error('Error exporting to JPEG:', error);
      throw new Error('Failed to export to JPEG');
    }
  }

  /**
   * Export using server-side API
   * Falls back to server when client-side export is not suitable
   */
  static async exportViaServer(
    format: 'pdf' | 'xlsx' | 'docx' | 'csv' | 'txt',
    options: ExportOptions
  ): Promise<void> {
    const { fileName, content, path, data } = options;

    try {
      const response = await fetch(`/api/export/${format}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path,
          content,
          fileName: fileName || `export.${format}`,
          data,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server export failed: ${response.statusText}`);
      }

      // Download the file
      const blob = await response.blob();
      saveAs(blob, fileName || `export.${format}`);
    } catch (error) {
      console.error('Error exporting via server:', error);
      throw new Error(`Failed to export to ${format.toUpperCase()}`);
    }
  }

  /**
   * Fetch file content from server
   */
  private static async fetchFileContent(path: string): Promise<string> {
    try {
      const response = await fetch('/api/files/read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ path }),
      });

      if (!response.ok) {
        throw new Error('Failed to read file');
      }

      const data = await response.json();
      return data.content || '';
    } catch (error) {
      console.error('Error fetching file content:', error);
      throw new Error('Failed to fetch file content');
    }
  }

  /**
   * Get supported export formats
   */
  static getSupportedFormats(): string[] {
    return ['pdf', 'xlsx', 'docx', 'csv', 'txt', 'png', 'jpg'];
  }

  /**
   * Export to specified format
   */
  static async exportTo(format: string, options: ExportOptions): Promise<void> {
    switch (format.toLowerCase()) {
      case 'pdf':
        return this.exportToPDF(options);
      case 'xlsx':
      case 'xls':
        return this.exportToXLSX(options);
      case 'docx':
      case 'doc':
        return this.exportToDOCX(options);
      case 'csv':
        return this.exportToCSV(options);
      case 'txt':
        return this.exportToTXT(options);
      case 'png':
        return this.exportToPNG(options);
      case 'jpg':
      case 'jpeg':
        return this.exportToJPEG(options);
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }
}

export default ExportManager;
