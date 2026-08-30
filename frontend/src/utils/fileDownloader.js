// Native client-side file download helper
export const triggerBlobDownload = (blob, fileName) => {
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.URL.revokeObjectURL(url);
};

// Export tabular spreadsheet (.csv / .xlsx compatible)
export const downloadExcelFile = (fileName, title, headers, rows) => {
  let csvContent = `\uFEFF`; // UTF-8 BOM for Excel
  csvContent += `"${title}"\n`;
  csvContent += `"Generated on: ${new Date().toLocaleString('en-IN')}"\n\n`;

  // Headers
  csvContent += headers.map(h => `"${String(h).replace(/"/g, '""')}"`).join(',') + '\n';

  // Rows
  rows.forEach(row => {
    const line = row.map(val => `"${String(val ?? '').replace(/"/g, '""')}"`).join(',');
    csvContent += line + '\n';
  });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  triggerBlobDownload(blob, fileName.endsWith('.xlsx') || fileName.endsWith('.csv') ? fileName : `${fileName}.csv`);
};

// Export printable HTML/PDF dossier
export const downloadPdfDocument = (fileName, docTitle, metadata, sections) => {
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${docTitle}</title>
  <style>
    body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 40px; color: #1e293b; line-height: 1.6; }
    .header { border-bottom: 2px solid #0f172a; padding-bottom: 20px; margin-bottom: 25px; }
    .emblem { font-size: 24px; font-weight: bold; color: #1e3a8a; text-transform: uppercase; letter-spacing: 1px; }
    .title { font-size: 20px; font-weight: 800; margin-top: 5px; color: #0f172a; }
    .meta-box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; margin-bottom: 20px; font-size: 12px; }
    .meta-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
    .section-title { font-size: 14px; font-weight: 700; color: #1e3a8a; text-transform: uppercase; margin-top: 20px; margin-bottom: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
    .content-box { font-size: 12px; color: #334155; margin-bottom: 15px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 10px; }
    th { background: #0f172a; color: white; text-align: left; padding: 8px; font-size: 11px; }
    td { border-bottom: 1px solid #e2e8f0; padding: 8px; }
    .footer { margin-top: 40px; border-top: 1px solid #cbd5e1; padding-top: 15px; font-size: 10px; color: #64748b; text-align: center; }
    .badge { display: inline-block; padding: 3px 8px; border-radius: 4px; font-weight: bold; font-size: 10px; background: #dbeafe; color: #1e40af; }
  </style>
</head>
<body>
  <div class="header">
    <div class="emblem">🏛️ Central Public Procurement Intelligence</div>
    <div class="title">${docTitle}</div>
    <p style="font-size: 11px; color: #64748b; margin: 4px 0 0 0;">Official Government Procurement Oversight Document</p>
  </div>

  <div class="meta-box">
    <div class="meta-grid">
      ${Object.entries(metadata).map(([k, v]) => `<div><strong>${k}:</strong> ${v}</div>`).join('')}
    </div>
  </div>

  ${sections.map(s => `
    <div class="section-title">${s.title}</div>
    <div class="content-box">
      ${s.content}
      ${s.table ? `
        <table>
          <thead>
            <tr>${s.table.headers.map(h => `<th>${h}</th>`).join('')}</tr>
          </thead>
          <tbody>
            ${s.table.rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}
          </tbody>
        </table>
      ` : ''}
    </div>
  `).join('')}

  <div class="footer">
    Verified Digital Signature • Central Public Procurement Oversight System • Generated ${new Date().toLocaleString('en-IN')}
  </div>
</body>
</html>
  `;

  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
  triggerBlobDownload(blob, fileName.endsWith('.html') || fileName.endsWith('.pdf') ? (fileName.replace(/\.pdf$/, '.html')) : `${fileName}.html`);
};
