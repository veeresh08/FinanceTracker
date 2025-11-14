// Production server configuration for serving frontend
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import your existing server setup
// NOTE: You'll need to modify your server.ts to export the app
export function setupStaticFiles(app: express.Application) {
  // Serve static files from React build
  const frontendPath = path.join(__dirname, '../client/dist');
  
  app.use(express.static(frontendPath));

  // Handle React routing - send all non-API requests to index.html
  app.get('*', (req, res, next) => {
    // Skip API routes
    if (req.path.startsWith('/api/')) {
      return next();
    }
    
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
}

