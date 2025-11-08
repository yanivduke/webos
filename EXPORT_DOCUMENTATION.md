# Export Functionality Documentation

## Overview

WebOS now includes comprehensive file export functionality, allowing users to export files to various formats including PDF, Excel, Word, CSV, text, and images. All export libraries used are MIT-licensed.

## Features

### Supported Export Formats

1. **PDF** - Portable Document Format
2. **XLSX** - Microsoft Excel spreadsheet
3. **DOCX** - Microsoft Word document
4. **CSV** - Comma-separated values
5. **TXT** - Plain text
6. **PNG** - Portable Network Graphics image
7. **JPEG** - Joint Photographic Experts Group image

### Libraries Used (All MIT Licensed)

#### Server-side
- `pdfkit` - PDF document generation
- `xlsx` - Excel file creation and parsing
- `docx` - Word document generation

#### Client-side
- `jspdf` - Client-side PDF generation
- `xlsx` - Client-side Excel processing
- `docx` - Client-side Word document creation
- `html2canvas` - HTML element to canvas/image conversion
- `file-saver` - Cross-browser file downloading

## Usage

### In NotePad Application

1. Open a text file in NotePad
2. Click the **Export** button in the toolbar
3. Choose your desired export format (PDF, Excel, Word, CSV, or Text)
4. Enter a filename
5. Click **Export**

The file will be downloaded to your browser's default download location.

### In Folder Browser (Context Menu)

1. Right-click on any file in a folder
2. Select **Export** from the context menu
3. Choose your desired export format
4. Enter a filename
5. Click **Export**

Note: Export option is only available for files, not folders.

## API Endpoints

### Server-side Export API

All export endpoints are available under `/api/export/`:

#### POST /api/export/pdf
Export content to PDF format.

**Request Body:**
```json
{
  "path": "dh0/myfile.txt",        // File path (optional if content provided)
  "content": "Text content...",     // Direct content (optional if path provided)
  "fileName": "export.pdf"          // Output filename
}
```

**Response:** PDF file (binary stream)

#### POST /api/export/xlsx
Export data to Excel format.

**Request Body:**
```json
{
  "path": "dh0/myfile.txt",        // File path (optional)
  "content": "Text content...",     // Direct content (optional)
  "data": [["A1", "B1"], ["A2", "B2"]], // Structured data (optional)
  "fileName": "export.xlsx"         // Output filename
}
```

**Response:** Excel file (binary stream)

#### POST /api/export/docx
Export content to Word document format.

**Request Body:**
```json
{
  "path": "dh0/myfile.txt",        // File path (optional)
  "content": "Text content...",     // Direct content (optional)
  "fileName": "export.docx"         // Output filename
}
```

**Response:** Word document (binary stream)

#### POST /api/export/csv
Export data to CSV format.

**Request Body:**
```json
{
  "path": "dh0/myfile.txt",        // File path (optional)
  "content": "Text content...",     // Direct content (optional)
  "data": [["A", "B"], ["C", "D"]], // Structured data (optional)
  "fileName": "export.csv"          // Output filename
}
```

**Response:** CSV file (text/csv)

#### POST /api/export/txt
Export content to plain text format.

**Request Body:**
```json
{
  "path": "dh0/myfile.txt",        // File path (optional)
  "content": "Text content...",     // Direct content (optional)
  "fileName": "export.txt"          // Output filename
}
```

**Response:** Text file (text/plain)

## Client-side Export Manager

### Importing the Export Manager

```typescript
import ExportManager from '@/utils/export-manager';
```

### Export Methods

#### exportToPDF(options)
```typescript
await ExportManager.exportToPDF({
  fileName: 'document.pdf',
  content: 'Text content to export',
  path: 'dh0/file.txt' // Optional: load content from server
});
```

#### exportToXLSX(options)
```typescript
await ExportManager.exportToXLSX({
  fileName: 'spreadsheet.xlsx',
  data: [
    ['Header 1', 'Header 2'],
    ['Row 1 Col 1', 'Row 1 Col 2'],
    ['Row 2 Col 1', 'Row 2 Col 2']
  ]
});
```

#### exportToDOCX(options)
```typescript
await ExportManager.exportToDOCX({
  fileName: 'document.docx',
  content: 'Text content to export'
});
```

#### exportToCSV(options)
```typescript
await ExportManager.exportToCSV({
  fileName: 'data.csv',
  data: [['A', 'B'], ['C', 'D']]
});
```

#### exportToTXT(options)
```typescript
await ExportManager.exportToTXT({
  fileName: 'note.txt',
  content: 'Plain text content'
});
```

#### exportToPNG(options)
```typescript
await ExportManager.exportToPNG({
  fileName: 'screenshot.png',
  elementId: 'my-element-id' // DOM element to capture
});
```

#### exportToJPEG(options)
```typescript
await ExportManager.exportToJPEG({
  fileName: 'screenshot.jpg',
  elementId: 'my-element-id' // DOM element to capture
});
```

#### Generic Export Method
```typescript
await ExportManager.exportTo('pdf', {
  fileName: 'export.pdf',
  content: 'Content to export'
});
```

### Using the AmigaExportDialog Component

```vue
<template>
  <AmigaExportDialog
    :visible="showExportDialog"
    :fileName="myFileName"
    :content="myContent"
    :path="myFilePath"
    @close="showExportDialog = false"
    @exported="handleExported"
  />
</template>

<script setup>
import { ref } from 'vue';
import AmigaExportDialog from '@/components/AmigaExportDialog.vue';

const showExportDialog = ref(false);
const myFileName = ref('document.txt');
const myContent = ref('File content here');
const myFilePath = ref('dh0/document.txt');

const handleExported = (format) => {
  console.log(`Exported to ${format}`);
};
</script>
```

## Amiga-Authentic Styling

The export dialog maintains the authentic Amiga Workbench aesthetic:
- Classic gray background (#a0a0a0)
- Beveled borders for 3D effect
- Press Start 2P font for authentic retro typography
- Traditional button styling with proper hover and active states
- Grid layout for format selection with visual icons

## Error Handling

All export operations include comprehensive error handling:
- File not found errors when reading from server
- Invalid format errors
- Network errors for server-side exports
- User-friendly error messages displayed in the dialog

## Implementation Details

### Client-side vs Server-side Export

The system supports both client-side and server-side export:

**Client-side (default):**
- Faster for users (no server round-trip)
- Works offline
- Better for small to medium files
- Uses browser capabilities

**Server-side (fallback):**
- Better for large files
- Consistent formatting across browsers
- Can access server-side files directly
- Available via `ExportManager.exportViaServer()`

### File Size Considerations

- Client-side exports work well for files up to ~10MB
- Server-side exports recommended for larger files
- Image exports (PNG/JPEG) depend on element size and complexity

## Future Enhancements

Potential future additions:
- Batch export (multiple files at once)
- Custom export templates
- Export presets/profiles
- Additional formats (RTF, HTML, Markdown)
- Export scheduling/automation
- Cloud storage integration

## Testing the Export Functionality

1. **Start the server:**
   ```bash
   cd src/server
   node index.js
   ```

2. **Start the client:**
   ```bash
   cd src/client
   npm run dev
   ```

3. **Test exports:**
   - Open NotePad and create a text file
   - Click Export and try different formats
   - Right-click files in folders and select Export

## License

All export libraries used are MIT-licensed, ensuring compatibility with the WebOS project license.
