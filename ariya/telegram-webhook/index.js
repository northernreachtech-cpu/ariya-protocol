const express = require('express');
const app = express();

// Middleware to parse JSON
app.use(express.json());

// Your bot token (you'll set this as an environment variable)
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

// Function to send message to Telegram
async function sendMessage(chatId, text) {
  try {
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'HTML'
      }),
    });
    
    const result = await response.json();
    return result.ok;
  } catch (error) {
    console.error('Error sending message:', error);
    return false;
  }
}

// Function to get verification code from Firebase
async function getVerificationCode(username) {
  try {
    // You'll need to set up Firebase Admin SDK
    const admin = require('firebase-admin');
    
    // Initialize Firebase Admin (you'll need to set up service account)
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          // You'll need to add your Firebase service account key here
          projectId: process.env.FIREBASE_PROJECT_ID,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        }),
      });
    }
    
    const db = admin.firestore();
    
    // Look for verification code by username in telegram_verification collection
    const verificationSnapshot = await db.collection('telegram_verification')
      .where('telegramHandle', '==', username)
      .get();
    
    if (verificationSnapshot.empty) {
      return null;
    }
    
    const verificationDoc = verificationSnapshot.docs[0];
    const verificationData = verificationDoc.data();
    const now = new Date();
    const expiresAt = verificationData?.expiresAt?.toDate();
    
    if (!expiresAt || now > expiresAt) {
      // Code expired
      await verificationDoc.ref.delete();
      return null;
    }
    
    return verificationData.code;
  } catch (error) {
    console.error('Error getting verification code:', error);
    return null;
  }
}

// Function to store Telegram user ID
async function storeTelegramUserId(username, telegramUserId) {
  try {
    const admin = require('firebase-admin');
    
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        }),
      });
    }
    
    const db = admin.firestore();
    
    // Find the verification document by username
    const verificationSnapshot = await db.collection('telegram_verification')
      .where('telegramHandle', '==', username)
      .get();
    
    if (!verificationSnapshot.empty) {
      const verificationDoc = verificationSnapshot.docs[0];
      await verificationDoc.ref.update({
        telegram_user_id: telegramUserId
      });
    }
  } catch (error) {
    console.error('Error storing Telegram user ID:', error);
  }
}

// Webhook endpoint
app.post('/webhook', async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message || !message.text) {
      return res.status(200).send('OK');
    }
    
    const chatId = message.chat.id;
    const text = message.text.trim();
    const username = message.from.username;
    
    // Handle /verify command
    if (text.startsWith('/verify')) {
      const parts = text.split(' ');
      if (parts.length !== 2) {
        await sendMessage(chatId, '❌ Invalid command. Use: /verify your_username');
        return res.status(200).send('OK');
      }
      
      const requestedUsername = parts[1];
      
      // Get verification code
      const code = await getVerificationCode(requestedUsername);
      
      if (!code) {
        await sendMessage(chatId, '❌ No verification code found for this username. Make sure you\'ve generated a code in the app first.');
        return res.status(200).send('OK');
      }
      
      // Store Telegram user ID for this username
      await storeTelegramUserId(requestedUsername, chatId.toString());
      
      // Send verification code
      const message = `
🔐 <b>Ariya Event Platform</b>

Your verification code is:
<b>${code}</b>

Enter this code in the app to link your Telegram account.

This code expires in 10 minutes.
      `.trim();
      
      await sendMessage(chatId, message);
    }
    
    // Handle /start command
    else if (text === '/start') {
      const welcomeMessage = `
🤖 <b>Welcome to Ariya Events Bot!</b>

I help you link your Telegram account to the Ariya Events platform.

To get started:
1. Go to the Ariya app
2. Enter your Telegram username
3. Generate a verification code
4. Send me: <code>/verify your_username</code>

I'll send you the verification code to complete the linking process.
      `.trim();
      
      await sendMessage(chatId, welcomeMessage);
    }
    
    // Handle /help command
    else if (text === '/help') {
      const helpMessage = `
📖 <b>Available Commands:</b>

/start - Welcome message
/verify username - Get verification code
/help - Show this help message

<b>How to link your account:</b>
1. Enter your username in the Ariya app
2. Generate a verification code
3. Send me: <code>/verify your_username</code>
4. Enter the code in the app
      `.trim();
      
      await sendMessage(chatId, helpMessage);
    }
    
    res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).send('Error');
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).send('Webhook is running');
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Webhook server running on port ${PORT}`);
});

module.exports = app;
