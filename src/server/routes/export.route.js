const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const PDFDocument = require('pdfkit');
const xlsx = require('xlsx');
const { Document, Packer, Paragraph, TextRun } = require('docx');
const { sanitizePath, resolveStoragePath } = require('../utils/path-utils');

// Storage base path
const STORAGE_BASE = path.join(__dirname, '../storage/workbench');

const getFullPath = (diskPath, fileName = '') => {
  return resolveStoragePath(STORAGE_BASE, diskPath, fileName);
};

/**
 * POST /api/export/pdf
 * Export file content to PDF format
 */
router.post('/pdf', async (req, res) => {
  try {
    const { path: diskPath, content, fileName = 'export.pdf' } = req.body;

    if (!diskPath && !content) {
      return res.status(400).json({
        error: 'Either path or content is required'
      });
    }

    let fileContent = content;

    // If path provided, read the file
    if (diskPath && !content) {
      const fullPath = getFullPath(sanitizePath(diskPath));
      try {
        fileContent = await fs.readFile(fullPath, 'utf-8');
      } catch (error) {
        return res.status(404).json({
          error: 'File not found',
          path: diskPath
        });
      }
    }

    // Create PDF document
    const doc = new PDFDocument();

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    // Pipe the PDF to the response
    doc.pipe(res);

    // Add content to PDF
    doc.fontSize(12)
       .font('Courier')
       .text(fileContent || '', {
         align: 'left',
         lineGap: 2
       });

    // Finalize PDF
    doc.end();
  } catch (error) {
    console.error('Error exporting to PDF:', error);
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Failed to export to PDF',
        message: error.message
      });
    }
  }
});

/**
 * POST /api/export/xlsx
 * Export data to Excel format
 */
router.post('/xlsx', async (req, res) => {
  try {
    const { path: diskPath, content, fileName = 'export.xlsx', data } = req.body;

    let exportData;

    if (data && Array.isArray(data)) {
      // If structured data is provided, use it directly
      exportData = data;
    } else {
      // Otherwise, convert content to rows
      let fileContent = content;

      if (diskPath && !content) {
        const fullPath = getFullPath(sanitizePath(diskPath));
        try {
          fileContent = await fs.readFile(fullPath, 'utf-8');
        } catch (error) {
          return res.status(404).json({
            error: 'File not found',
            path: diskPath
          });
        }
      }

      // Convert text content to rows
      const lines = (fileContent || '').split('\n');
      exportData = lines.map(line => [line]);
    }

    // Create workbook and worksheet
    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.aoa_to_sheet(exportData);
    xlsx.utils.book_append_sheet(wb, ws, 'Sheet1');

    // Generate buffer
    const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

    // Send response
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(buffer);
  } catch (error) {
    console.error('Error exporting to XLSX:', error);
    res.status(500).json({
      error: 'Failed to export to XLSX',
      message: error.message
    });
  }
});

/**
 * POST /api/export/docx
 * Export content to Word document format
 */
router.post('/docx', async (req, res) => {
  try {
    const { path: diskPath, content, fileName = 'export.docx' } = req.body;

    if (!diskPath && !content) {
      return res.status(400).json({
        error: 'Either path or content is required'
      });
    }

    let fileContent = content;

    // If path provided, read the file
    if (diskPath && !content) {
      const fullPath = getFullPath(sanitizePath(diskPath));
      try {
        fileContent = await fs.readFile(fullPath, 'utf-8');
      } catch (error) {
        return res.status(404).json({
          error: 'File not found',
          path: diskPath
        });
      }
    }

    // Create document with paragraphs
    const paragraphs = (fileContent || '').split('\n').map(line =>
      new Paragraph({
        children: [
          new TextRun({
            text: line || ' ',
            font: 'Courier New',
            size: 22 // 11pt * 2
          })
        ]
      })
    );

    const doc = new Document({
      sections: [{
        properties: {},
        children: paragraphs
      }]
    });

    // Generate buffer
    const buffer = await Packer.toBuffer(doc);

    // Send response
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(buffer);
  } catch (error) {
    console.error('Error exporting to DOCX:', error);
    res.status(500).json({
      error: 'Failed to export to DOCX',
      message: error.message
    });
  }
});

/**
 * POST /api/export/csv
 * Export data to CSV format
 */
router.post('/csv', async (req, res) => {
  try {
    const { path: diskPath, content, fileName = 'export.csv', data } = req.body;

    let csvContent;

    if (data && Array.isArray(data)) {
      // If structured data is provided, convert to CSV
      csvContent = data.map(row =>
        Array.isArray(row)
          ? row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
          : `"${String(row).replace(/"/g, '""')}"`
      ).join('\n');
    } else {
      // Use content directly
      csvContent = content;

      if (diskPath && !content) {
        const fullPath = getFullPath(sanitizePath(diskPath));
        try {
          csvContent = await fs.readFile(fullPath, 'utf-8');
        } catch (error) {
          return res.status(404).json({
            error: 'File not found',
            path: diskPath
          });
        }
      }
    }

    // Send response
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(csvContent);
  } catch (error) {
    console.error('Error exporting to CSV:', error);
    res.status(500).json({
      error: 'Failed to export to CSV',
      message: error.message
    });
  }
});

/**
 * POST /api/export/txt
 * Export content to plain text format
 */
router.post('/txt', async (req, res) => {
  try {
    const { path: diskPath, content, fileName = 'export.txt' } = req.body;

    if (!diskPath && !content) {
      return res.status(400).json({
        error: 'Either path or content is required'
      });
    }

    let fileContent = content;

    // If path provided, read the file
    if (diskPath && !content) {
      const fullPath = getFullPath(sanitizePath(diskPath));
      try {
        fileContent = await fs.readFile(fullPath, 'utf-8');
      } catch (error) {
        return res.status(404).json({
          error: 'File not found',
          path: diskPath
        });
      }
    }

    // Send response
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(fileContent || '');
  } catch (error) {
    console.error('Error exporting to TXT:', error);
    res.status(500).json({
      error: 'Failed to export to TXT',
      message: error.message
    });
  }
});

module.exports = router;
