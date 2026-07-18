const { execSync } = require('child_process');
const fs = require('fs');

try {
  // Read secrets to get the active token
  const config = JSON.parse(fs.readFileSync('telegram_config.json', 'utf8'));
  
  // Read active tokens from our secure secrets file
  let token = '';
  if (fs.existsSync('telegram_secrets.json')) {
    const secrets = JSON.parse(fs.readFileSync('telegram_secrets.json', 'utf8'));
    token = secrets.githubToken;
  }
  
  const repo = config.githubRepo;
  const branch = config.githubBranch || 'main';

  if (!token || !repo) {
    console.error('Error: GitHub Token or Repo missing.');
    process.exit(1);
  }

  console.log('Initializing git repository locally...');
  execSync('git init', { stdio: 'inherit' });
  try {
    execSync('git checkout -B main', { stdio: 'inherit' });
  } catch (e) {
    execSync('git branch -m main', { stdio: 'inherit' });
  }
  execSync('git config --global --add safe.directory "*"', { stdio: 'inherit' });
  execSync('git config user.name "2507779"', { stdio: 'inherit' });
  execSync('git config user.email "2507779@gmail.com"', { stdio: 'inherit' });

  // Add remote with token embedded
  const remoteUrl = `https://${token}@github.com/${repo}.git`;
  try {
    execSync(`git remote add origin ${remoteUrl}`, { stdio: 'inherit' });
  } catch (e) {
    execSync(`git remote set-url origin ${remoteUrl}`, { stdio: 'inherit' });
  }

  console.log('Fetching from GitHub...');
  execSync(`git fetch origin ${branch}`, { stdio: 'inherit' });

  console.log('Aligning local file state with remote...');
  execSync(`git reset --mixed origin/${branch}`, { stdio: 'inherit' });

  console.log('Staging files...');
  execSync('git add .', { stdio: 'inherit' });

  const status = execSync('git status --porcelain').toString().trim();
  // Filter status to ignore untracked files like sync_to_github.cjs
  const lines = status.split('\n').filter(line => {
    return !line.includes('sync_to_github.cjs') && 
           !line.includes('telegram_secrets.json');
  });

  if (lines.length === 0) {
    console.log('No changes detected between your local workspace and GitHub.');
  } else {
    console.log('Committing changes...');
    execSync('git commit -m "Sync workspace updates: Secure credentials migration"', { stdio: 'inherit' });

    console.log('Pushing to GitHub...');
    execSync(`git push origin ${branch}`, { stdio: 'inherit' });
    console.log('Sync completed successfully!');
  }
} catch (err) {
  console.error('Sync failed:', err.message);
  process.exit(1);
}
