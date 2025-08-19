# Bot Tok

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
```bash
git clone <repository-url>
cd tt-bot
```

2. Install dependencies:
```bash
npm install
```

3. Copy environment file and configure:
```bash
cp env.example .env
# Edit .env with your configuration
```

4. Run setup script:
```bash
npm run setup
```

## Usage

### Start the server:
```bash
npm start
```

### Development mode:
```bash
npm run dev
```

## API Endpoints

- `POST /api/tiktok/action` - Perform TikTok action
- `GET /api/tiktok/status/:taskId` - Get task status
- `GET /api/tiktok/tasks` - Get task list
- `DELETE /api/tiktok/tasks/:taskId` - Cancel task
- `GET /api/tiktok/stats` - Get service statistics
- `GET /api/tiktok/actions` - Get available actions
- `POST /api/tiktok/reset` - Reset all providers

## Example Usage

```bash
# Perform a view action
curl -X POST http://localhost:3000/api/tiktok/action \
  -H "Content-Type: application/json" \
  -d '{
    "videoUrl": "https://www.tiktok.com/@username/video/1234567890",
    "actionType": "views"
  }'
```

## Configuration

See `env.example` for all available configuration options.

## Disclaimer

This tool is provided for educational and research purposes only. Using automated tools to manipulate social media metrics may violate the terms of service of the respective platforms. Use at your own risk.

## License

MIT License - see LICENSE file for details.
