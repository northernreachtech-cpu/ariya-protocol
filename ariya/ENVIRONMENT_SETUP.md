# Environment Setup Guide

This guide will help you set up all the required environment variables for the Ariya Protocol project.

## Quick Start

1. Copy the example environment file:
   ```bash
   cp env.example .env.local
   ```

2. Fill in your actual values in `.env.local`
3. Restart your development server

## Required Services Setup

### 1. Firebase Setup

Firebase is used for community features, file storage, and real-time data.

#### Step 1: Create a Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or select an existing project
3. Follow the setup wizard

#### Step 2: Get Firebase Configuration
1. In your Firebase project, go to **Project Settings** (gear icon)
2. Scroll down to **Your apps** section
3. Click **Add app** → **Web app** (</>)
4. Register your app with a nickname
5. Copy the configuration object

#### Step 3: Enable Services
1. **Firestore Database**: Go to Firestore Database → Create database → Start in test mode
2. **Storage**: Go to Storage → Get started → Start in test mode
3. **Authentication** (optional): Go to Authentication → Get started

#### Step 4: Update Environment Variables
Replace the Firebase values in your `.env.local`:

```env
VITE_FIREBASE_API_KEY=your-actual-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

### 2. ImgBB Setup

ImgBB is used for image uploads in event creation.

#### Step 1: Get API Key
1. Go to [ImgBB API](https://api.imgbb.com/)
2. Sign up for a free account
3. Get your API key from the dashboard

#### Step 2: Update Environment Variable
Add your ImgBB API key to `.env.local`:

```env
VITE_IMGBB_API_KEY=your-imgbb-api-key
```

### 3. Enoki Setup

Enoki is used for zkLogin proof generation and transaction execution.

#### Step 1: Get API Key
1. Go to [Enoki Portal](https://portal.enoki.mystenlabs.com/)
2. Sign up for an account
3. Create a new app and get your API key
4. Configure your Firebase Google Auth client ID in Enoki

#### Step 2: Update Environment Variable
Add your Enoki API key to `.env.local`:

```env
VITE_ENOKI_API_KEY=your-enoki-api-key
```

### 4. Sui Blockchain Configuration

The project uses Sui blockchain for event management and subscriptions.

#### Current Configuration
The project is currently configured for **testnet**. The contract addresses are already set in the environment file.

#### For Production (Mainnet)
When deploying to mainnet, update these variables:

```env
VITE_SUI_NETWORK=mainnet
VITE_PACKAGE_ID=your-mainnet-package-id
VITE_EVENT_REGISTRY_ID=your-mainnet-event-registry
# ... update all other registry IDs
```

## Environment Variables Reference

### Firebase Variables
| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_FIREBASE_API_KEY` | Firebase API key | `AIzaSyC...` |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase auth domain | `myproject.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID | `myproject-12345` |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket | `myproject.appspot.com` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID | `123456789` |
| `VITE_FIREBASE_APP_ID` | Firebase app ID | `1:123456789:web:abc123` |

### ImgBB Variables
| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_IMGBB_API_KEY` | ImgBB API key for image uploads | `abc123def456...` |

### Sui Network Variables
| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_SUI_NETWORK` | Sui network (testnet/mainnet/devnet) | `testnet` |
| `VITE_PACKAGE_ID` | Deployed contract package ID | `0x10d0fc6df7...` |
| `VITE_EVENT_REGISTRY_ID` | Event registry contract ID | `0x0bc6254162...` |
| `VITE_SUBSCRIPTION_REGISTRY_ID` | Subscription registry contract ID | `0x34572e6aa5...` |
| `VITE_SUBSCRIPTION_CONFIG_ID` | Subscription config contract ID | `0x3572153f8a...` |

## Troubleshooting

### Firebase Issues
- **"Missing Firebase environment variables"**: Make sure all Firebase variables are set in `.env.local`
- **"Firebase not initialized"**: Check that your Firebase project is properly set up
- **Storage permission errors**: Make sure Firebase Storage rules allow read/write access

### ImgBB Issues
- **"Invalid API key"**: Verify your ImgBB API key is correct
- **Upload failures**: Check your ImgBB account limits and API key permissions

### Sui Network Issues
- **"Contract not found"**: Verify the contract addresses are correct for your network
- **"Network mismatch"**: Ensure `VITE_SUI_NETWORK` matches your wallet's network

## Security Notes

1. **Never commit `.env.local`** to version control
2. **Use different API keys** for development and production
3. **Set up proper Firebase security rules** for production
4. **Monitor API usage** to avoid rate limits

## Development vs Production

### Development
- Use testnet for Sui contracts
- Use Firebase project with relaxed security rules
- Use ImgBB free tier

### Production
- Use mainnet for Sui contracts
- Use Firebase project with strict security rules
- Consider ImgBB paid tier for higher limits
- Set up proper monitoring and logging
