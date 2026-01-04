// Script to inject backend URL configuration into built files
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get backend URL from environment or use placeholder
const BACKEND_URL = process.env.VITE_BACKEND_URL || '${BACKEND_URL}';

console.log(`🔧 Injecting backend URL configuration...`);
console.log(`   Backend URL: ${BACKEND_URL}`);

// Files to update
const htmlFiles = [
  'dist/index.html',
  'dist/proctored_exam.html',
];

// Inject configuration script at the beginning of each HTML file
const configScript = `
<script>
  // Backend URL Configuration - can be replaced during deployment
  window.BACKEND_URL = '${BACKEND_URL}';
  window.API_BASE_URL = '${BACKEND_URL}';
  console.log('🌐 Backend URL configured:', window.BACKEND_URL);
</script>
`;

htmlFiles.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Inject config script after <head> tag
    if (content.includes('<head>')) {
      content = content.replace('<head>', `<head>${configScript}`);
      
      // Replace hardcoded URLs with window.BACKEND_URL references
      content = content.replace(/['"]http:\/\/(127\.0\.0\.1|localhost):(786|8000)['"]/g, 'window.BACKEND_URL');
      content = content.replace(/const DJANGO_API\s*=\s*['"]http:\/\/(127\.0\.0\.1|localhost):(786|8000)['"]/g, 'const DJANGO_API = window.BACKEND_URL');
      content = content.replace(/const API_BASE\s*=\s*['"]http:\/\/(127\.0\.0\.1|localhost):(786|8000)['"]/g, 'const API_BASE = window.BACKEND_URL');
      
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Updated: ${file}`);
    } else {
      console.log(`⚠️  No <head> tag found in: ${file}`);
    }
  } else {
    console.log(`⏭️  File not found (will be created during build): ${file}`);
  }
});

console.log('✨ Configuration injection complete!');
