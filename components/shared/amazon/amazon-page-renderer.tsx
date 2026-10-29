import fs from 'fs';
import path from 'path';

interface AmazonPageRendererProps {
  pageFile: string;
}

export default function AmazonPageRenderer({ pageFile }: AmazonPageRendererProps) {
  const filePath = path.join(process.cwd(), 'public', 'sanitized_pages', pageFile);
  let html = '';
  try {
    html = fs.readFileSync(filePath, 'utf-8');
  } catch {
    html = `<div style="padding: 40px; text-align: center; font-family: sans-serif;">
      <h2>Page Loading...</h2>
      <p>Unable to load ${pageFile}. Please refresh.</p>
    </div>`;
  }

  return (
    <div 
      className="amazon-page-root w-full min-h-screen"
      style={{ margin: 0, padding: 0 }}
      dangerouslySetInnerHTML={{ __html: html }} 
    />
  );
}
