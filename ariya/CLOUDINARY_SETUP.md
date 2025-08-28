# Cloudinary Setup for Fallback Storage

## Overview
This setup provides a fallback storage solution when Walrus uploads fail. Cloudinary will automatically be used if Walrus encounters issues.

## Setup Steps

### 1. Create Cloudinary Account
1. Go to [Cloudinary Console](https://cloudinary.com/console)
2. Sign up for a free account
3. Get your **Cloud Name** from the dashboard

### 2. Configure Upload Preset
1. In Cloudinary Console, go to **Settings** → **Upload**
2. Scroll to **Upload presets**
3. Click **Add upload preset**
4. Set **Preset name** to `ml_default` (or any name you prefer)
5. Set **Signing Mode** to **Unsigned**
6. Save the preset

### 3. Update Environment Variables
Add these to your `.env.local` file:

```env
VITE_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=ml_default
```

### 4. Test the Fallback
1. Try uploading an image
2. If Walrus fails, it should automatically fall back to Cloudinary
3. Check console logs to see which provider was used

## How It Works

1. **Primary**: Tries Walrus first (decentralized storage)
2. **Fallback**: If Walrus fails, automatically uses Cloudinary
3. **Error Handling**: If both fail, shows comprehensive error message

## Benefits

- ✅ **Reliability**: Always have a backup storage option
- ✅ **No Downtime**: Users can still upload when Walrus is down
- ✅ **Transparent**: Users don't need to know which service is used
- ✅ **Free Tier**: Cloudinary offers generous free storage

## Troubleshooting

### Cloudinary Upload Fails
- Check your cloud name is correct
- Verify upload preset is set to "unsigned"
- Ensure you're within free tier limits

### Both Services Fail
- Check network connectivity
- Verify environment variables are set correctly
- Try with a smaller image file
