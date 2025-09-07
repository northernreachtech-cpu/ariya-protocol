# Ariya Telegram Webhook

This webhook handles Telegram bot commands for the Ariya Events platform.

## 🚀 Quick Setup

### 1. Deploy to Vercel

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Deploy:**
   ```bash
   cd telegram-webhook
   vercel
   ```

3. **Set Environment Variables in Vercel Dashboard:**
   - `TELEGRAM_BOT_TOKEN` - Your bot token from BotFather
   - `FIREBASE_PROJECT_ID` - Your Firebase project ID
   - `FIREBASE_PRIVATE_KEY` - Your Firebase service account private key
   - `FIREBASE_CLIENT_EMAIL` - Your Firebase service account email

### 2. Set Up Telegram Webhook

1. **Get your webhook URL** from Vercel (e.g., `https://your-app.vercel.app/webhook`)

2. **Set the webhook:**
   ```bash
   curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
        -H "Content-Type: application/json" \
        -d '{"url": "https://your-app.vercel.app/webhook"}'
   ```

### 3. Test the Bot

1. Start a chat with your bot
2. Send `/start` to see the welcome message
3. Send `/help` to see available commands
4. Test the verification flow in your app

## 🔧 Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create `.env` file** with your environment variables

3. **Run locally:**
   ```bash
   npm run dev
   ```

4. **Use ngrok for local testing:**
   ```bash
   npx ngrok http 3000
   ```

## 📝 Available Commands

- `/start` - Welcome message
- `/verify username` - Get verification code
- `/help` - Show help message

## 🔐 Firebase Setup

You need to create a Firebase service account:

1. Go to Firebase Console → Project Settings → Service Accounts
2. Generate a new private key
3. Use the values in your environment variables

## 🐛 Troubleshooting

- Check Vercel logs for errors
- Verify environment variables are set correctly
- Test webhook URL with: `https://your-app.vercel.app/health`
