# Configuración Rápida de EAS Secrets para TestFlight

## ⚠️ IMPORTANTE
Las variables de entorno del archivo `.env` **NO se incluyen automáticamente** en builds de EAS/TestFlight. Debes configurarlas manualmente como "secrets" de EAS.

---

## 📋 Comandos para Configurar Secrets

### 1. RevenueCat

```bash
# API Key de iOS (REQUERIDO)
eas secret:create --scope project --name EXPO_PUBLIC_RC_API_KEY_IOS --value appl_YnKGAqJnFZlAByqGUDPkuuNRFJt

# API Key de Android (opcional si solo haces iOS)
eas secret:create --scope project --name EXPO_PUBLIC_RC_API_KEY_ANDROID --value appl_YnKGAqJnFZlAByqGUDPkuuNRFJt

# Entitlement (REQUERIDO)
eas secret:create --scope project --name EXPO_PUBLIC_RC_ENTITLEMENT --value premium
```

---

### 2. AdMob

```bash
# iOS App ID (REQUERIDO para iOS)
eas secret:create --scope project --name EXPO_PUBLIC_ADMOB_IOS_APP_ID --value ca-app-pub-9521354088644356~4323532279

# iOS Rewarded Ad Unit ID de PRODUCCIÓN (REQUERIDO para anuncios en TestFlight)
eas secret:create --scope project --name EXPO_PUBLIC_ADMOB_REWARDED_ID_IOS_PROD --value ca-app-pub-9521354088644356/8741181635

# Android App ID (opcional si solo haces iOS)
eas secret:create --scope project --name EXPO_PUBLIC_ADMOB_ANDROID_APP_ID --value ca-app-pub-9521354088644356~6949695611

# Android Rewarded Ad Unit ID de PRODUCCIÓN (opcional si solo haces iOS)
eas secret:create --scope project --name EXPO_PUBLIC_ADMOB_REWARDED_ID_ANDROID_PROD --value ca-app-pub-9521354088644356/9384287265
```

---

### 3. Supabase (si lo usas)

```bash
# URL de Supabase
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value https://0ec90b57d6e95fcbda19832f.supabase.co

# Anon Key de Supabase
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJib2x0IiwicmVmIjoiMGVjOTBiNTdkNmU5NWZjYmRhMTk4MzJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4ODE1NzQsImV4cCI6MTc1ODg4MTU3NH0.9I8-U0x86Ak8t2DGaIk0HfvTSLsAyzdnz-Nw00mMkKw
```

---

## ✅ Verificar Secrets Configurados

```bash
# Lista todos los secrets del proyecto
eas secret:list
```

**Deberías ver:**
- EXPO_PUBLIC_RC_API_KEY_IOS
- EXPO_PUBLIC_RC_API_KEY_ANDROID (si configuraste Android)
- EXPO_PUBLIC_RC_ENTITLEMENT
- EXPO_PUBLIC_ADMOB_IOS_APP_ID
- EXPO_PUBLIC_ADMOB_REWARDED_ID_IOS_PROD
- EXPO_PUBLIC_ADMOB_ANDROID_APP_ID (si configuraste Android)
- EXPO_PUBLIC_ADMOB_REWARDED_ID_ANDROID_PROD (si configuraste Android)
- EXPO_PUBLIC_SUPABASE_URL (si usas Supabase)
- EXPO_PUBLIC_SUPABASE_ANON_KEY (si usas Supabase)

---

## 🔄 Actualizar un Secret

Si necesitas cambiar el valor de un secret:

```bash
# Elimina el secret existente
eas secret:delete --scope project --name NOMBRE_DEL_SECRET

# Crea el secret con el nuevo valor
eas secret:create --scope project --name NOMBRE_DEL_SECRET --value nuevo_valor
```

---

## 🚀 Hacer el Build de TestFlight

Una vez configurados todos los secrets:

```bash
# Build de producción para iOS
eas build --platform ios --profile production

# O si tienes un profile específico para TestFlight
eas build --platform ios --profile testflight
```

---

## 📝 Notas Importantes

1. **Los secrets están encriptados** y solo son accesibles durante el build
2. **No necesitas hacer commit** de estos valores a Git
3. **Cada proyecto tiene sus propios secrets** - si trabajas en múltiples proyectos, configura los secrets para cada uno
4. **Los secrets son permanentes** hasta que los elimines manualmente
5. **Puedes sobrescribir** un secret eliminándolo y creándolo de nuevo con un nuevo valor

---

## 🔒 Seguridad

- ✅ **NUNCA** hagas commit del archivo `.env` a Git
- ✅ **NUNCA** compartas tus secrets públicamente
- ✅ Las variables `EXPO_PUBLIC_*` son accesibles desde el cliente (esto es normal)
- ✅ Para claves secretas (service keys), usa Edge Functions de Supabase
- ✅ Rota tus claves periódicamente por seguridad

---

## 🆘 Troubleshooting

### "eas: command not found"
```bash
# Instala EAS CLI
npm install -g eas-cli

# Verifica instalación
eas --version
```

### "Not logged in"
```bash
# Inicia sesión
eas login
```

### "Project not found"
```bash
# Verifica que estés en el directorio del proyecto
cd /ruta/a/tu/proyecto

# Verifica que app.config.js tenga el projectId correcto
cat app.config.js | grep projectId
```

### Secrets no aparecen en el build
- Asegúrate de que los nombres coincidan exactamente (incluyendo `EXPO_PUBLIC_` prefix)
- Verifica con `eas secret:list` que los secrets existan
- Haz un build limpio: `eas build --platform ios --clear-cache`

---

## 📚 Referencias

- [EAS Secrets Documentation](https://docs.expo.dev/build-reference/variables/)
- [EAS Build Configuration](https://docs.expo.dev/build/eas-json/)
- [Environment Variables in Expo](https://docs.expo.dev/guides/environment-variables/)
