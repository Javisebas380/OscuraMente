# Dark Psychology App - RevenueCat & AdMob Integration

## Current Status

✅ **Development Mode (Expo Go):**
- Mock ads (2-second simulation) and subscriptions working
- All unlock functionality available
- Test IDs configured for Google AdMob
- Detailed logging for debugging
- Premium subscription active by default for testing

✅ **Production Mode (Development Build):**
- Real AdMob integration ready
- Real RevenueCat integration ready
- Automatic environment detection

## Setup Instructions

### 1. Install RevenueCat SDK

Since this project uses Expo with native modules, you'll need to create a development build:

```bash
# Install RevenueCat SDK (requires development build)
npm install react-native-purchases

# Create development build (required for native modules)
eas build --profile development --platform ios
eas build --profile development --platform android
```

### 2. RevenueCat Configuration

1. Create a RevenueCat account at https://app.revenuecat.com
2. Set up your app and products
3. Get your API key from the RevenueCat dashboard
4. **For Production:** Update `.env` file with your real API key:

```env
EXPO_PUBLIC_RC_API_KEY_IOS=your_actual_revenuecat_ios_api_key
EXPO_PUBLIC_RC_API_KEY_ANDROID=your_actual_revenuecat_android_api_key
EXPO_PUBLIC_RC_ENTITLEMENT=pro
```

### 3. AdMob Configuration

1. Create a Google AdMob account
2. Set up your app and ad units
3. **For Production:** Update `.env` with your real AdMob IDs:

```env
EXPO_PUBLIC_ADMOB_APP_ID_IOS=ca-app-pub-your-real-ios-app-id
EXPO_PUBLIC_ADMOB_APP_ID_ANDROID=ca-app-pub-your-real-android-app-id
EXPO_PUBLIC_ADMOB_REWARDED_ID_IOS_PROD=ca-app-pub-your-real-rewarded-ios-id
EXPO_PUBLIC_ADMOB_REWARDED_ID_ANDROID_PROD=ca-app-pub-your-real-rewarded-android-id
```

4. **For Production:** Update `app.json` with your real App IDs

## Testing in Development

### Current Configuration (Works in Expo Go):
- ✅ Test AdMob IDs configured
- ✅ Mock RevenueCat for testing
- ✅ All functionality available
- ✅ Detailed logging for debugging

### Debugging:
1. Open React Native debugger or Metro logs
2. Look for logs prefixed with:
   - `[AdsManager]` - Ad operations
   - `[RevenueCat]` - Subscription operations  
   - `[TestResults]` - Results screen behavior
   - `[LockedSection]` - Lock/unlock UI
   - `[UnlockManager]` - Content unlocking
   - `[useSubscription]` - Subscription hook state changes

### 4. Development Build

Create a development build to test purchases and ads:

```bash
# Install Expo Dev Client
npx expo install expo-dev-client

# Create development build
eas build --profile development --platform ios
eas build --profile development --platform android
```

### 5. Testing

- **Subscriptions**: Use RevenueCat's sandbox environment
- **Ads**: Test IDs are already configured for development
- **GDPR**: Test with EU VPN to see consent flow
- **ATT**: Test on iOS 14.5+ devices

### 6. Production

1. Replace test IDs with production IDs in `.env`
2. Configure RevenueCat products and entitlements
3. Set up AdMob production ad units
4. Test thoroughly before release

## Features Implemented

- ✅ RevenueCat subscription management (mock + real)
- ✅ AdMob rewarded video ads (mock + real)
- ✅ Hybrid development/production setup
- ✅ Ad cooldown system (90 seconds)
- ✅ Dynamic unlock system
- ✅ Premium content gating
- ✅ Error handling and fallbacks
- ✅ Detailed logging for debugging
- ✅ Expo Go compatibility
- ✅ Automatic environment detection
- ✅ Complete SDK integration for production

## Architecture

- `src/services/ads.ts` - AdMob manager with GDPR/ATT
- `src/state/subscription.ts` - RevenueCat subscription state
- `src/services/unlockManager.ts` - Content unlock logic
- `components/LockedSection.tsx` - UI for locked content
- `app/results/[id].tsx` - Test results with unlock integration

## Important Notes

- **Development:** Mock implementations work in Expo Go for testing
- **Production:** Real RevenueCat and AdMob require development build
- Current setup uses Google's test ad unit IDs for development
- Test thoroughly with real devices before publishing
- Follow platform guidelines for subscription and ad policies

## Troubleshooting

### Common Issues:
1. **App crashes on results screen:** Check logs for `[AdsManager]` and `[RevenueCat]` errors
2. **Premium buttons not showing:** Check logs for `[LockedSection]` and subscription state
3. **Ads not working:** Verify environment and check `[AdsManager]` logs
4. **iOS Premium buttons missing:** Check `[RevenueCat]` logs for subscription state
5. **Android app closing:** Look for `[AdsManager]` initialization errors

### Debug Commands:
```bash
# View logs in development
npx expo start --clear

# For Android device logs
adb logcat | grep -E "(AdsManager|RevenueCat|TestResults|LockedSection|UnlockManager|useSubscription)"

# For iOS device logs (if using Xcode)
# Open Xcode -> Window -> Devices and Simulators -> Select device -> View Device Logs
```