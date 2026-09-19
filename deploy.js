const fs = require('fs');
const { execSync } = require('child_process');

try {
  const envFile = fs.readFileSync('.env', 'utf8');
  const lines = envFile.split('\n');
  
  let envArgs = '';
  
  for (let line of lines) {
    line = line.trim();
    if (line && !line.startsWith('#')) {
      const parts = line.split('=');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        let value = parts.slice(1).join('=').trim();
        // Remove quotes if present
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.slice(1, -1);
        }
        if (value.startsWith("'") && value.endsWith("'")) {
          value = value.slice(1, -1);
        }
        
        // Escape quotes for command line
        value = value.replace(/"/g, '\\"');
        
        envArgs += ` -e ${key}="${value}" -b ${key}="${value}"`;
      }
    }
  }

  console.log('Deploying to Vercel with environment variables...');
  const cmd = `cmd /c vercel --prod --yes ${envArgs}`;
  console.log('Executing deployment command...');
  
  const output = execSync(cmd, { encoding: 'utf8', stdio: 'pipe' });
  console.log(output);

} catch (error) {
  console.error('Deployment failed:');
  if (error.stdout) console.log(error.stdout);
  if (error.stderr) console.error(error.stderr);
  console.error(error.message);
}
