// @ts-nocheck
// Production server configuration for serving frontend
const express = require('express');
const path = require('path');

// Setup static file serving
function setupStaticFiles(app) {
  // Serve static files from React build
  const frontendPath = path.join(path.resolve(), 'client/dist');
  
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

module.exports = { setupStaticFiles };

