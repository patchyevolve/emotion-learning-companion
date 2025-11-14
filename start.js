// Start script to run both backend and frontend servers
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 Starting Emotion-Aware Learning Companion...\n');

// Check if server directory exists
const serverDir = path.join(__dirname, 'server');
if (!fs.existsSync(serverDir)) {
  console.error('❌ Server directory not found!');
  process.exit(1);
}

// Check if server.js exists
const serverFile = path.join(serverDir, 'server.js');
if (!fs.existsSync(serverFile)) {
  console.error('❌ server.js not found in server directory!');
  process.exit(1);
}

// Start backend server
console.log('📡 Starting backend server on port 3000...');
const backend = spawn('node', ['server.js'], {
  cwd: serverDir,
  stdio: 'inherit',
  shell: true
});

// Wait a bit for backend to start, then start frontend
setTimeout(() => {
  console.log('\n🌐 Starting frontend server on port 8080...');
  console.log('📖 Opening browser in 3 seconds...\n');
  
  const frontend = spawn('python', ['-m', 'http.server', '8080'], {
    cwd: __dirname,
    stdio: 'inherit',
    shell: true
  });
  
  // Open browser after a short delay
  setTimeout(() => {
    const { exec } = require('child_process');
    const url = 'http://localhost:8080';
    console.log(`\n✅ Both servers are running!`);
    console.log(`\n📱 Frontend: ${url}`);
    console.log(`📡 Backend: http://localhost:3000`);
    console.log(`\n🌐 Opening browser...\n`);
    
    // Try to open browser (works on Windows, Mac, Linux)
    const platform = process.platform;
    let command;
    if (platform === 'win32') {
      command = `start ${url}`;
    } else if (platform === 'darwin') {
      command = `open ${url}`;
    } else {
      command = `xdg-open ${url}`;
    }
    
    exec(command, (error) => {
      if (error) {
        console.log(`\n⚠️  Could not open browser automatically. Please open: ${url}\n`);
      }
    });
  }, 3000);
  
  // Handle process termination
  process.on('SIGINT', () => {
    console.log('\n\n🛑 Shutting down servers...');
    backend.kill();
    frontend.kill();
    process.exit();
  });
  
  process.on('SIGTERM', () => {
    backend.kill();
    frontend.kill();
    process.exit();
  });
  
}, 2000);

// Handle backend errors
backend.on('error', (error) => {
  console.error('❌ Failed to start backend server:', error.message);
  console.error('💡 Make sure you have Node.js installed and dependencies are installed (cd server && npm install)');
  process.exit(1);
});

backend.on('exit', (code) => {
  if (code !== null && code !== 0) {
    console.error(`\n❌ Backend server exited with code ${code}`);
    process.exit(code);
  }
});

