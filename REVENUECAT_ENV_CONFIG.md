# Configuración de RevenueCat por Entorno

Este documento explica cómo configurar RevenueCat con diferentes Public SDK Keys para entornos de desarrollo y producción.

## 🎯 Resumen

El proyecto usa diferentes Public SDK Keys de RevenueCat dependiendo del valor de `EXPO_PUBLIC_APP_ENV`:

- **`development`**: Usa la key del proyecto de desarrollo de RevenueCat (pruebas y testing)
- **`production`**: Usa la key del proyecto principal de RevenueCat (App Store / Play Store)

## 🏗️ Arquitectura Recomendada

### ⚠️ IMPORTANTE: Proyectos Separados

Es **ALTAMENTE RECOMENDADO** crear dos proyectos separados en RevenueCat:

1. **Proyecto de Desarrollo** (`Mi App - Development`)
   - Para pruebas locales, TestFlight, Internal Testing
   - Aislado de datos de producción
   - Permite testear sin afectar métricas reales

2. **Proyecto de Producción** (`Mi App`)
   - Para App Store y Google Play oficiales
   - Datos y métricas reales de clientes
   - Configuración de producción

### Beneficios de Proyectos Separados

✅ **Aislamiento de datos**: Las pruebas no contaminan métricas reales
✅ **Testing seguro**: Puedes probar compras sin preocuparte por los datos
✅ **Configuración independiente**: Diferentes productos, precios, ofertas para testing
✅ **Debugging más fácil**: Logs y datos de debug sin ruido de producción

## 📋 Variables de Entorno Configuradas

### Keys de Desarrollo
```bash
# Public SDK Key del proyecto de desarrollo
EXPO_PUBLIC_REVENUECAT_PUBLIC_KEY_DEV=appl_dev_XXXXXXXXXXXXXXXX  # iOS
# o
EXPO_PUBLIC_REVENUECAT_PUBLIC_KEY_DEV=goog_XXXXXXXXXXXXXXXX     # Android
```

### Keys de Producción
```bash
# Public SDK Key del proyecto principal
EXPO_PUBLIC_REVENUECAT_PUBLIC_KEY_PROD=appl_XXXXXXXXXXXXXXXX    # iOS
# o
EXPO_PUBLIC_REVENUECAT_PUBLIC_KEY_PROD=goog_XXXXXXXXXXXXXXXX    # Android
```

### Entitlement
```bash
# Nombre del entitlement (mismo en ambos proyectos)
EXPO_PUBLIC_RC_ENTITLEMENT=premium
```

## 🔧 Configuración

### Paso 1: Crear Proyectos en RevenueCat

1. **Crear Proyecto de Desarrollo**
   ```
   Nombre: Mi App - Development
   Platform: iOS y/o Android
   ```

2. **Crear Proyecto de Producción**
   ```
   Nombre: Mi App
   Platform: iOS y/o Android
   ```

### Paso 2: Configurar Productos en Ambos Proyectos

En cada proyecto, configura los mismos productos:

**Proyecto Development:**
- Productos de prueba (sandbox)
- IDs: `psico_weekly_399`, `psico_annual_2499` (o tus IDs)
- Precios de prueba

**Proyecto Production:**
- Productos reales
- IDs: `psico_weekly_399`, `psico_annual_2499` (mismos IDs)
- Precios reales

### Paso 3: Obtener Public SDK Keys

1. Ve a RevenueCat Dashboard
2. Selecciona proyecto "Development"
3. Ve a: **Settings → API Keys**
4. Copia la **Public SDK Key** (comienza con `appl_` o `goog_`)
5. Pégala en `EXPO_PUBLIC_REVENUECAT_PUBLIC_KEY_DEV`
6. Repite para proyecto "Production" → `EXPO_PUBLIC_REVENUECAT_PUBLIC_KEY_PROD`

### Paso 4: Configurar .env Local

```bash
# .env
EXPO_PUBLIC_APP_ENV=development
EXPO_PUBLIC_REVENUECAT_PUBLIC_KEY_DEV=appl_dev_tu_key_aqui
EXPO_PUBLIC_REVENUECAT_PUBLIC_KEY_PROD=appl_tu_key_prod_aqui
EXPO_PUBLIC_RC_ENTITLEMENT=premium
```

## 🚀 Configuración para EAS Build

### Para TestFlight / Internal Testing

**Configura EAS Secrets:**

```bash
# Configurar entorno como development
eas secret:create --scope project --name EXPO_PUBLIC_APP_ENV --value development --type string

# Configurar key de desarrollo
eas secret:create --scope project --name EXPO_PUBLIC_REVENUECAT_PUBLIC_KEY_DEV --value appl_dev_tu_key_aqui --type string

# Configurar entitlement
eas secret:create --scope project --name EXPO_PUBLIC_RC_ENTITLEMENT --value premium --type string
```

**eas.json:**
```json
{
  "build": {
    "preview": {
      "distribution": "internal",
      "env": {
        "EXPO_PUBLIC_APP_ENV": "development"
      }
    }
  }
}
```

**Build:**
```bash
# iOS (TestFlight)
eas build --profile preview --platform ios

# Android (Internal Testing)
eas build --profile preview --platform android
```

### Para App Store / Google Play (Producción)

**Configura EAS Secrets:**

```bash
# Cambiar entorno a production
eas secret:create --scope project --name EXPO_PUBLIC_APP_ENV --value production --type string --force

# Configurar key de producción
eas secret:create --scope project --name EXPO_PUBLIC_REVENUECAT_PUBLIC_KEY_PROD --value appl_tu_key_prod_aqui --type string

# Configurar entitlement
eas secret:create --scope project --name EXPO_PUBLIC_RC_ENTITLEMENT --value premium --type string
```

**eas.json:**
```json
{
  "build": {
    "production": {
      "env": {
        "EXPO_PUBLIC_APP_ENV": "production"
      }
    }
  }
}
```

**Build:**
```bash
# iOS (App Store)
eas build --profile production --platform ios

# Android (Play Store)
eas build --profile production --platform android
```

## 🧪 Testing de Compras

### iOS - Sandbox Testing

1. **Crear Sandbox Tester**
   - Ve a: App Store Connect → Users and Access → Sandbox Testers
   - Crea un usuario de prueba con email único

2. **Usar en dispositivo/simulador**
   - Cierra sesión de App Store
   - En la app, inicia compra
   - Cuando se pida login, usa el sandbox tester
   - Las compras son gratis en sandbox

3. **Proyecto RevenueCat**
   - Con `APP_ENV=development`: usa proyecto Development
   - RevenueCat procesa recibos sandbox normalmente
   - Los datos no afectan producción

### Android - Testing en Google Play

1. **Configurar License Testers**
   - Ve a: Google Play Console → Setup → License Testing
   - Agrega emails de testers

2. **Internal Testing Track**
   - Sube build a Internal Testing
   - Invita testers
   - Las compras son gratis para license testers

3. **Proyecto RevenueCat**
   - Con `APP_ENV=development`: usa proyecto Development
   - RevenueCat procesa recibos de prueba
   - Datos aislados de producción

## 📱 Pantalla de Debug

El proyecto incluye una pantalla de debug en `/revenuecat-debug` que muestra:

- **Entorno actual** (development/production)
- **API Key** (prefix por seguridad)
- **Offerings disponibles**
- **Productos configurados**
- **Estado de Customer Info**
- **Entitlements activos**

Para acceder (agregar navegación según tu app):
```typescript
// Ejemplo: desde perfil o configuración
<TouchableOpacity onPress={() => router.push('/revenuecat-debug')}>
  <Text>RevenueCat Debug</Text>
</TouchableOpacity>
```

## 🔍 Verificación

### Verificar en Logs

Al iniciar la app, busca en logs:

```
[RevenueCat] Configuration
============================================================
Environment: development  (o production)
Using DEV key: true  (o false)
Platform: ios (o android)
API Key (prefix): appl_dev_XX...  (o appl_XX...)
Debug logs: enabled  (o disabled)
============================================================
```

### Verificar Configuración Correcta

✅ **Development (TestFlight/Internal)**
- `APP_ENV: development`
- `Using DEV key: true`
- `API Key (prefix): appl_dev_...` o `goog_...`
- `Debug logs: enabled`

✅ **Production (App Store/Play Store)**
- `APP_ENV: production`
- `Using DEV key: false`
- `API Key (prefix): appl_...` o `goog_...`
- `Debug logs: disabled`

## 📚 Uso del Módulo de Configuración

El proyecto incluye `src/config/revenuecatConfig.ts` con funciones helper:

### Inicializar RevenueCat

```typescript
import { initRevenueCat } from '../src/config/revenuecatConfig';

// En App.tsx o _layout.tsx
useEffect(() => {
  initRevenueCat();
}, []);
```

### Cargar Offerings

```typescript
import { loadOfferings } from '../src/config/revenuecatConfig';

const offerings = await loadOfferings();
console.log('Current offering:', offerings.current);
console.log('Available packages:', offerings.current?.availablePackages);
```

### Obtener Productos

```typescript
import { getProducts } from '../src/config/revenuecatConfig';

const products = await getProducts(['psico_weekly_399', 'psico_annual_2499']);
console.log('Products:', products);
```

### Obtener Customer Info

```typescript
import { getCustomerInfo } from '../src/config/revenuecatConfig';

const customerInfo = await getCustomerInfo();
console.log('Active entitlements:', customerInfo.entitlements.active);
```

### Realizar Compra

```typescript
import { purchasePackage } from '../src/config/revenuecatConfig';

try {
  const result = await purchasePackage(package);
  console.log('Purchase successful!', result);
} catch (error) {
  console.error('Purchase failed:', error);
}
```

### Verificar Entitlement Activo

```typescript
import { hasActiveEntitlement } from '../src/config/revenuecatConfig';

const isPremium = await hasActiveEntitlement('premium');
if (isPremium) {
  // Usuario tiene premium activo
}
```

## 🆘 Solución de Problemas

### Los productos no se cargan

**Problema**: `getOfferings()` retorna `null` o sin packages

**Solución**:
1. Verifica que la Public SDK Key esté correcta
2. Verifica que los productos estén configurados en RevenueCat Dashboard
3. Verifica que los productos estén vinculados a una Offering
4. Verifica que los Product IDs coincidan con los de App Store/Play Console

### Las compras no se procesan

**Problema**: `purchasePackage()` falla o no se completa

**Solución**:
1. **iOS**: Verifica que estés usando sandbox tester correcto
2. **Android**: Verifica que el tester esté en license testers
3. Verifica que el bundle ID/package name coincida con RevenueCat
4. Revisa logs de RevenueCat Dashboard → Customer History

### "API key missing for env"

**Problema**: Warning de API key no configurada

**Solución**:
1. Verifica que `EXPO_PUBLIC_REVENUECAT_PUBLIC_KEY_DEV` o `_PROD` estén en .env
2. Si usas EAS Build, verifica que los secrets estén configurados:
   ```bash
   eas secret:list
   ```
3. Reconstruye la app si cambiaste variables de entorno

### Los datos de producción aparecen en desarrollo

**Problema**: Estás viendo datos de producción durante desarrollo

**Solución**:
1. Verifica que `APP_ENV=development` en tu .env local
2. Verifica los logs: debe decir "Using DEV key: true"
3. Si está incorrecto, cambia el .env y reinicia el servidor
4. Para EAS Build, verifica que el secret `APP_ENV` tenga el valor correcto

## 🔒 Seguridad

- ✅ Las Public SDK Keys son seguras de incluir en la app (no son secretas)
- ✅ Nunca expongas Service Keys o Secret Keys en el código
- ✅ Los proyectos separados garantizan aislamiento de datos
- ✅ RevenueCat maneja la validación de recibos de forma segura

## 🎓 Mejores Prácticas

1. **Siempre usa proyectos separados** para dev y producción
2. **Testea exhaustivamente en sandbox** antes de publicar
3. **Verifica los logs** para confirmar el entorno correcto
4. **Mantén los Product IDs idénticos** en ambos proyectos
5. **Usa la pantalla de debug** para verificar configuración
6. **Documenta los cambios** de configuración en tu equipo

## 📚 Recursos

- [RevenueCat Documentation](https://www.revenuecat.com/docs/)
- [iOS Sandbox Testing](https://developer.apple.com/documentation/storekit/in-app_purchase/testing_in-app_purchases_in_xcode)
- [Android Testing](https://developer.android.com/google/play/billing/test)
- [EAS Build Configuration](https://docs.expo.dev/build/eas-json/)
- [Expo Environment Variables](https://docs.expo.dev/guides/environment-variables/)
