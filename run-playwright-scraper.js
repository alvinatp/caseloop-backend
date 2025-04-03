import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get command line arguments
const args = process.argv.slice(2);
const category = args[0] || 'housing';
const zipcode = args[1] || '94103';

// Path to the python script
const scriptPath = path.join(__dirname, 'src', 'playwright_scraper.py');

console.log(`Starting playwright scraper with category: ${category}, zipcode: ${zipcode}`);
console.log(`Script path: ${scriptPath}`);

// Spawn a child process to run the Python script
const pythonProcess = spawn('python3', [scriptPath, category, zipcode]);

// Handle stdout from the Python process
pythonProcess.stdout.on('data', (data) => {
  console.log(`${data}`);
});

// Handle stderr from the Python process
pythonProcess.stderr.on('data', (data) => {
  console.error(`${data}`);
});

// Handle process exit
pythonProcess.on('close', (code) => {
  console.log(`Child process exited with code ${code}`);
});

// Handle errors in spawning the process
pythonProcess.on('error', (err) => {
  console.error('Failed to start child process:', err);
}); 