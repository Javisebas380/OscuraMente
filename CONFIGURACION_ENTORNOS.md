# 🔧 Guía de Configuración de Entornos (Development & Production)

Esta guía explica cómo configurar y usar la aplicación en modo **Development** y **Production**.

---

## 📋 Tabla de Contenidos

1. [Diferencias entre Entornos](#diferencias-entre-entornos)
2. [Configuración de Development](#configuración-de-development)
3. [Configuración de Production](#configuración-de-production)
4. [Scripts de Build Disponibles](#scripts-de-build-disponibles)
5. [Variables de Entorno](#variables-de-entorno)
6. [Troubleshooting](#troubleshooting)

---

## 🔄 Diferencias entre Entornos

### Development Mode

**Cuándo usar:** Durante desarrollo local, testing, TestFlight (iOS), Internal Testing (Android)

**Características:**
- ✅ Usa IDs de test de AdMob (oficiales de Google)
- ✅ Puede usar keys de desarrollo de RevenueCat (o funcionar sin ellas)
- ✅ Logs detallados en consola
- ✅ Banner de entorno visible en modo debug
- ✅ Validación de configuración con warnings
- ✅ Mock implementations cuando servicios no están configurados
- ✅ Timeouts más cortos para detección rápida de problemas

**Variables usadas:**
```bash
EXPO_PUBLIC_APP_ENV=development
EXPO_PUBLIC_ADMOB_IOS_APP_ID_TEST=ca-app-pub-3940256099942544~1458002511
EXPO_PUBLIC_ADMOB_ANDROID_APP_ID_TEST=ca-app-pub-3940256099942544~3347511713
EXPO_PUBLIC_ADMOB_REWARDED_ID_IOS_TEST=ca-app-pub-3940256099942544/1712485313
EXPO_PUBLIC_ADMOB_REWARDED_ID_ANDROID_TEST=ca-app-pub-3940256099942544/5224354917
EXPO_PUBLIC_REVENUECAT_IOS_KEY_DEV=appl_dev_XXXXXXXX (opcional)
EXPO_PUBLIC_REVENUECAT_ANDROID_KEY_DEV=goog_XXXXXXXX (opcional)
```

### Production Mode

**Cuándo usar:** Para publicar en App Store y Google Play Store

**Características:**
- ✅ Usa IDs reales de AdMob (deben estar configurados en tu cuenta)
- ✅ Usa keys reales de RevenueCat (deben estar configurados)
- ⚠️ Sin logs excesivos
- ⚠️ Sin banner de entorno
- ⚠️ Validación estricta de configuración
- ❌ No funciona con IDs/keys de test

**Variables usadas:**
```bash
EXPO_PUBLIC_APP_ENV=production
EXPO_PUBLIC_ADMOB_IOS_APP_ID_PROD=ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX
EXPO_PUBLIC_ADMOB_ANDROID_APP_ID_PROD=ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX
EXPO_PUBLIC_ADMOB_REWARDED_ID_IOS_PROD=ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX
EXPO_PUBLIC_ADMOB_REWARDED_ID_ANDROID_PROD=ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX
EXPO_PUBLIC_REVENUECAT_IOS_KEY_PROD=appl_XXXXXXXXXXXXXXXX
EXPO_PUBLIC_REVENUECAT_ANDROID_KEY_PROD=goog_XXXXXXXXXXXXXXXX
```

---

## 🛠️ Configuración de Development

### Paso 1: Configurar Variables de Entorno

Edita tu archivo `.env`:

```bash
# Establecer modo development
EXPO_PUBLIC_APP_ENV=development

# Los IDs de test ya están configurados por defecto y funcionan sin configuración adicional
```

### Paso 2: (Opcional) Configurar RevenueCat para Testing

Si quieres probar suscripciones en development:

1. Crea una cuenta en [RevenueCat](https://www.revenuecat.com/)
2. Crea un proyecto de desarrollo/testing
3. Obtén las Public SDK Keys:
   - Ve a Settings → API Keys
   - Copia la key de iOS (formato: `appl_dev_XXXXXXXXXXXXXXXX`)
   - Copia la key de Android (formato: `goog_XXXXXXXXXXXXXXXX`)
4. Agrégalas al `.env`:

```bash
EXPO_PUBLIC_REVENUECAT_IOS_KEY_DEV=appl_dev_TU_KEY_AQUI
EXPO_PUBLIC_REVENUECAT_ANDROID_KEY_DEV=goog_TU_KEY_AQUI
```

**Nota:** Si no configuras RevenueCat, la app funcionará en modo mock (suscripciones simuladas).

### Paso 3: Prebuild (Solo para Development Builds nativos)

Si estás usando Expo Go, salta este paso. Si necesitas un development build:

```bash
npm run prebuild:dev
```

Esto genera los archivos nativos con la configuración de development.

### Paso 4: Ejecutar la App

**Opción A: Expo Go (Recomendado para desarrollo rápido)**
```bash
npm run dev
```

**Opción B: Development Build (Para probar AdMob y RevenueCat reales)**
```bash
# iOS
npm run ios

# Android
npm run android
```

### Paso 5: Verificar Configuración

Cuando la app inicie en modo debug (`__DEV__`), verás:

1. **Banner amarillo** en la parte superior: `🟡 DEVELOPMENT`
2. **Warnings en consola** si algo no está configurado
3. **Logs detallados** de inicialización

---

## 🚀 Configuración de Production

### ⚠️ IMPORTANTE: Requisitos Previos

Antes de configurar production, DEBES tener:

1. **Cuenta AdMob creada**: https://admob.google.com/
2. **Apps registradas en AdMob** (iOS y Android)
3. **Ad Units creados** (Rewarded Ads)
4. **Cuenta RevenueCat creada**: https://www.revenuecat.com/
5. **Productos configurados** en App Store Connect y Google Play Console
6. **RevenueCat conectado** a ambas stores

### Paso 1: Obtener IDs de AdMob

1. Ve a [AdMob Console](https://apps.admob.com/)
2. Crea tu app iOS:
   - Copia el **App ID** (formato: `ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX`)
   - Crea un **Rewarded Ad Unit**
   - Copia el **Ad Unit ID** (formato: `ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX`)
3. Repite para Android

### Paso 2: Obtener Keys de RevenueCat

1. Ve a [RevenueCat Dashboard](https://app.revenuecat.com/)
2. Selecciona tu proyecto de producción
3. Ve a Settings → API Keys
4. Copia las Public SDK Keys:
   - iOS: `appl_XXXXXXXXXXXXXXXX`
   - Android: `goog_XXXXXXXXXXXXXXXX`

### Paso 3: Configurar Variables de Entorno

Actualiza tu archivo `.env` (o mejor, configura EAS Secrets):

```bash
# Establecer modo production
EXPO_PUBLIC_APP_ENV=production

# IDs de AdMob Production
EXPO_PUBLIC_ADMOB_IOS_APP_ID_PROD=ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX
EXPO_PUBLIC_ADMOB_REWARDED_ID_IOS_PROD=ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX
EXPO_PUBLIC_ADMOB_ANDROID_APP_ID_PROD=ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX
EXPO_PUBLIC_ADMOB_REWARDED_ID_ANDROID_PROD=ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX

# Keys de RevenueCat Production
EXPO_PUBLIC_REVENUECAT_IOS_KEY_PROD=appl_XXXXXXXXXXXXXXXX
EXPO_PUBLIC_REVENUECAT_ANDROID_KEY_PROD=goog_XXXXXXXXXXXXXXXX
```

### Paso 4: Configurar EAS Secrets (Recomendado)

En lugar de usar `.env` para production, usa EAS Secrets:

```bash
# Configurar entorno
eas secret:create --scope project --name EXPO_PUBLIC_APP_ENV --value production

# Configurar AdMob iOS
eas secret:create --scope project --name EXPO_PUBLIC_ADMOB_IOS_APP_ID_PROD --value "tu-id-aqui"
eas secret:create --scope project --name EXPO_PUBLIC_ADMOB_REWARDED_ID_IOS_PROD --value "tu-id-aqui"

# Configurar AdMob Android
eas secret:create --scope project --name EXPO_PUBLIC_ADMOB_ANDROID_APP_ID_PROD --value "tu-id-aqui"
eas secret:create --scope project --name EXPO_PUBLIC_ADMOB_REWARDED_ID_ANDROID_PROD --value "tu-id-aqui"

# Configurar RevenueCat
eas secret:create --scope project --name EXPO_PUBLIC_REVENUECAT_IOS_KEY_PROD --value "tu-key-aqui"
eas secret:create --scope project --name EXPO_PUBLIC_REVENUECAT_ANDROID_KEY_PROD --value "tu-key-aqui"
```

### Paso 5: Build de Production

```bash
# iOS
npm run build:prod:ios

# Android
npm run build:prod:android

# Ambos
npm run build:prod:all
```

### Paso 6: Verificar Build

Antes de enviar a las stores, verifica:

1. ✅ No hay warnings de configuración en logs
2. ✅ AdMob muestra anuncios reales (no de test)
3. ✅ RevenueCat carga offerings correctamente
4. ✅ Las suscripciones funcionan en Sandbox/Testing
5. ✅ No aparece banner de entorno en la app

---

## 📜 Scripts de Build Disponibles

### Development

```bash
# Prebuild con configuración de development
npm run prebuild:dev

# Builds de development (para testing interno)
npm run build:dev:ios
npm run build:dev:android
```

### Preview (Development IDs pero sin logs excesivos)

```bash
# Builds de preview (para TestFlight e Internal Testing)
npm run build:preview:ios
npm run build:preview:android
```

### Production

```bash
# Prebuild con configuración de production
npm run prebuild:prod

# Builds de production (para App Store y Play Store)
npm run build:prod:ios
npm run build:prod:android
npm run build:prod:all
```

### Utilidades

```bash
# Limpiar y reconstruir archivos nativos
npm run prebuild

# Validar configuración
npm run validate:config
```

---

## 🔐 Variables de Entorno

### Variables de Control

| Variable | Valores | Descripción |
|----------|---------|-------------|
| `EXPO_PUBLIC_APP_ENV` | `development` \| `production` | Controla qué IDs/keys se usan |

### Variables de AdMob

| Variable | Cuándo se usa | Formato |
|----------|---------------|---------|
| `EXPO_PUBLIC_ADMOB_IOS_APP_ID_TEST` | `development` | `ca-app-pub-3940256099942544~1458002511` |
| `EXPO_PUBLIC_ADMOB_ANDROID_APP_ID_TEST` | `development` | `ca-app-pub-3940256099942544~3347511713` |
| `EXPO_PUBLIC_ADMOB_REWARDED_ID_IOS_TEST` | `development` | `ca-app-pub-3940256099942544/1712485313` |
| `EXPO_PUBLIC_ADMOB_REWARDED_ID_ANDROID_TEST` | `development` | `ca-app-pub-3940256099942544/5224354917` |
| `EXPO_PUBLIC_ADMOB_IOS_APP_ID_PROD` | `production` | `ca-app-pub-XXXXXXXX~XXXXXXXX` |
| `EXPO_PUBLIC_ADMOB_ANDROID_APP_ID_PROD` | `production` | `ca-app-pub-XXXXXXXX~XXXXXXXX` |
| `EXPO_PUBLIC_ADMOB_REWARDED_ID_IOS_PROD` | `production` | `ca-app-pub-XXXXXXXX/XXXXXXXX` |
| `EXPO_PUBLIC_ADMOB_REWARDED_ID_ANDROID_PROD` | `production` | `ca-app-pub-XXXXXXXX/XXXXXXXX` |

### Variables de RevenueCat

| Variable | Cuándo se usa | Formato |
|----------|---------------|---------|
| `EXPO_PUBLIC_REVENUECAT_IOS_KEY_DEV` | `development` | `appl_dev_XXXXXXXXXXXXXXXX` |
| `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY_DEV` | `development` | `goog_XXXXXXXXXXXXXXXX` |
| `EXPO_PUBLIC_REVENUECAT_IOS_KEY_PROD` | `production` | `appl_XXXXXXXXXXXXXXXX` |
| `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY_PROD` | `production` | `goog_XXXXXXXXXXXXXXXX` |
| `EXPO_PUBLIC_RC_ENTITLEMENT` | Ambos | `premium` (default) |

---

## 🔍 Troubleshooting

### Problema: Pantalla Negra al Iniciar

**Causa:** IDs de AdMob inválidos o servicios que no se inicializan

**Solución:**

1. Verifica que `EXPO_PUBLIC_APP_ENV` esté correctamente configurada
2. En development, la app debe usar IDs de test automáticamente
3. Revisa los logs en consola para ver qué servicio está fallando
4. La app ahora tiene timeouts cortos (5-8s) y continuará aunque los servicios fallen

### Problema: AdMob no muestra anuncios en Production

**Causa:** IDs incorrectos o no activados en AdMob

**Solución:**

1. Verifica que los IDs de production estén correctos
2. Asegúrate de que las apps estén aprobadas en AdMob Console
3. Los ads pueden tardar hasta 24h en activarse después de crear la cuenta
4. Prueba primero con los IDs de test cambiando a `development`

### Problema: RevenueCat dice "Invalid API Key"

**Causa:** Key inválida o formato incorrecto

**Solución:**

1. Verifica que la key empiece con `appl_` (iOS) o `goog_` (Android)
2. Asegúrate de estar usando la Public SDK Key, no la Secret Key
3. Verifica que estés usando la key del proyecto correcto (dev vs prod)
4. La app funcionará en modo mock si la key es inválida

### Problema: Warning "AdMob ID is invalid or missing"

**Causa:** Variables de entorno no configuradas correctamente

**Solución:**

1. Verifica que el `.env` tenga las variables correctas
2. Si usas EAS Secrets, verifica con `eas secret:list`
3. Asegúrate de hacer `prebuild` después de cambiar variables
4. Reinicia el dev server: `npm run dev -- --clear`

### Problema: App funciona en desarrollo pero falla en production

**Causa:** Falta configurar IDs/keys reales

**Solución:**

1. La app REQUIERE IDs reales de AdMob en production
2. La app REQUIERE keys reales de RevenueCat en production
3. No puedes usar IDs de test en production
4. Sigue la sección "Configuración de Production" paso a paso

### Problema: EAS Build falla con error de variables

**Causa:** Variables no configuradas en EAS Secrets

**Solución:**

```bash
# Listar secrets actuales
eas secret:list

# Agregar secreto faltante
eas secret:create --scope project --name NOMBRE_VARIABLE --value "valor"

# Eliminar secret incorrecto
eas secret:delete --scope project --name NOMBRE_VARIABLE
```

---

## ✅ Checklist de Verificación

### Para Development

- [ ] `EXPO_PUBLIC_APP_ENV=development` en `.env`
- [ ] IDs de test de AdMob funcionan automáticamente
- [ ] (Opcional) Keys de RevenueCat de desarrollo configuradas
- [ ] Banner amarillo `🟡 DEVELOPMENT` visible en la app
- [ ] Logs detallados en consola
- [ ] Warnings visibles si algo falta

### Para Production

- [ ] `EXPO_PUBLIC_APP_ENV=production` en `.env` o EAS Secrets
- [ ] Cuenta AdMob creada y apps registradas
- [ ] IDs de AdMob de production configurados
- [ ] Ad Units creados en AdMob
- [ ] Cuenta RevenueCat creada
- [ ] Productos configurados en stores
- [ ] Keys de RevenueCat de production configuradas
- [ ] Build de production exitoso
- [ ] Anuncios funcionan en dispositivo real
- [ ] Suscripciones funcionan en Sandbox
- [ ] Sin warnings de configuración en logs

---

## 📞 Soporte

Si tienes problemas:

1. Revisa los logs en consola (usa `console.log` en development)
2. Verifica que todas las variables estén configuradas correctamente
3. Asegúrate de estar usando el entorno correcto (`development` vs `production`)
4. Consulta la documentación oficial:
   - [AdMob](https://admob.google.com/home/)
   - [RevenueCat](https://www.revenuecat.com/docs/)
   - [Expo EAS](https://docs.expo.dev/eas/)

---

**Última actualización:** Enero 2025
**Versión:** 1.0.0
