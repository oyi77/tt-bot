#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');

async function setup() {
  console.log('🚀 Setting up Bot Tok project...\n');

  try {
    // Create necessary directories
    const directories = [
      'data',
      'data/logs',
      'data/screenshots',
      'data/cookies',
      'data/user-agents',
      'data/proxies',
    ];

    for (const dir of directories) {
      await fs.ensureDir(dir);
      console.log(`✅ Created directory: ${dir}`);
    }

    // Create sample user agents file
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    ];

    await fs.writeJson('data/user-agents.json', userAgents, { spaces: 2 });
    console.log('✅ Created sample user agents file');

    // Create sample proxies file (empty for now)
    const proxies = [];
    await fs.writeJson('data/proxies.json', proxies, { spaces: 2 });
    console.log('✅ Created empty proxies file');

    // Create empty cookies file
    const cookies = {};
    await fs.writeJson('data/cookies.json', cookies, { spaces: 2 });
    console.log('✅ Created empty cookies file');

    // Create .gitignore if it doesn't exist
    const gitignoreContent = `# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
data/logs/
*.log

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/

# nyc test coverage
.nyc_output

# Dependency directories
node_modules/
jspm_packages/

# Optional npm cache directory
.npm

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# dotenv environment variables file
.env

# IDE files
.vscode/
.idea/
*.swp
*.swo

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# Project specific
data/cookies.json
data/screenshots/
*.png
*.jpg
*.jpeg
`;

    if (!await fs.pathExists('.gitignore')) {
      await fs.writeFile('.gitignore', gitignoreContent);
      console.log('✅ Created .gitignore file');
    }

    // Create README.md if it doesn't exist
    const readmeContent = `# Bot Tok

Bot Tok is a TikTok Up Bot (likes, shares, favorites and views) based in Node.js, Puppeteer, and third-party providers (zefoy.com & freer.es).

## Features

- 🤖 Automate TikTok views, shares, and favorites
- 🔄 Support for multiple providers (Zefoy, Freer)
- 🎯 Multiple action types (views, likes, shares, favorites, followers, comments)
- 🛡️ Robust error handling and retry mechanisms
- 📊 Comprehensive logging and monitoring
- 🌐 RESTful API for easy integration
- 🔒 Session management with cookie persistence
- 🚀 Scalable architecture with provider abstraction

## Installation

1. Clone the repository:
\`\`\`bash
git clone <repository-url>
cd tt-bot
\`\`\`

2. Install dependencies:
\`\`\`bash
npm install
\`\`\`

3. Copy environment file and configure:
\`\`\`bash
cp env.example .env
# Edit .env with your configuration
\`\`\`

4. Run setup script:
\`\`\`bash
npm run setup
\`\`\`

## Usage

### Start the server:
\`\`\`bash
npm start
\`\`\`

### Development mode:
\`\`\`bash
npm run dev
\`\`\`

## API Endpoints

- \`POST /api/tiktok/action\` - Perform TikTok action
- \`GET /api/tiktok/status/:taskId\` - Get task status
- \`GET /api/tiktok/tasks\` - Get task list
- \`DELETE /api/tiktok/tasks/:taskId\` - Cancel task
- \`GET /api/tiktok/stats\` - Get service statistics
- \`GET /api/tiktok/actions\` - Get available actions
- \`POST /api/tiktok/reset\` - Reset all providers

## Example Usage

\`\`\`bash
# Perform a view action
curl -X POST http://localhost:3000/api/tiktok/action \\
  -H "Content-Type: application/json" \\
  -d '{
    "videoUrl": "https://www.tiktok.com/@username/video/1234567890",
    "actionType": "views"
  }'
\`\`\`

## Configuration

See \`env.example\` for all available configuration options.

## Disclaimer

This tool is provided for educational and research purposes only. Using automated tools to manipulate social media metrics may violate the terms of service of the respective platforms. Use at your own risk.

## License

MIT License - see LICENSE file for details.
`;

    if (!await fs.pathExists('README.md') || (await fs.readFile('README.md', 'utf8')).length < 100) {
      await fs.writeFile('README.md', readmeContent);
      console.log('✅ Updated README.md file');
    }

    console.log('\n🎉 Setup completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Copy env.example to .env and configure your settings');
    console.log('2. Run npm install to install dependencies');
    console.log('3. Run npm start to start the server');
    console.log('\nHappy botting! 🤖');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

// Run setup if this file is executed directly
if (require.main === module) {
  setup();
}

module.exports = setup;
