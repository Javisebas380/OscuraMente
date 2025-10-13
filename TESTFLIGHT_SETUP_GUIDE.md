# Guía Completa: Configuración para TestFlight

Esta guía te ayudará a solucionar los problemas de RevenueCat y AdMob en TestFlight.

## 🚨 Problemas Comunes en TestFlight

### Problema 1: "Plan no encontrado" (RevenueCat)
**Síntomas:**
- Al intentar comprar una suscripción aparece: "Plan no encontrado. Asegúrate de que las ofertas de RevenueCat estén configuradas"

**Causa raíz:**
- Los productos no están configurados correctamente en RevenueCat Dashboard
- Los productos de App Store Connect no están vinculados a RevenueCat
- El offering "default" no tiene paquetes disponibles

### Problema 2: Anuncios no se muestran
**Síntomas:**
- Al presionar "Ver Anuncio para Desbloquear" aparece "¡Contenido Desbloqueado!" pero no se muestra ningún anuncio
- El contenido se desbloquea sin ver el anuncio

**Causa raíz:**
- La app estaba usando IDs de TEST de AdMob en TestFlight
- Los IDs de test de Google no siempre funcionan en TestFlight
- Falta configuración en el dashboard de AdMob

---

## ✅ Solución Implementada en el Código

### Cambios Realizados:

#### 1. Detección de Entorno TestFlight (`src/utils/environment.ts`)
- **CRÍTICO:** TestFlight ahora se trata como entorno de "production"
- Esto asegura que se usen IDs reales de AdMob y RevenueCat
- La función `getEnvironment()` ahora retorna `'production'` para TestFlight

#### 2. Configuración de AdMob (`src/services/ads.native.ts`)
- TestFlight ahora usa **IDs de PRODUCCIÓN** en lugar de IDs de test
- Mejorado el logging para identificar problemas de configuración
- Agregados códigos de error específicos de AdMob con soluciones

#### 3. Manejo de Errores en RevenueCat (`hooks/useSubscription.ts`)
- Logging detallado de offerings y paquetes disponibles
- Mensajes de error más descriptivos con pasos para solucionar
- Validación de que los productos existan antes de intentar la compra

#### 4. Corrección de Bug en UI (`components/LockedSection.tsx`)
- Corregido error de sintaxis que impedía el sticky CTA

---

## 📋 Checklist de Configuración para TestFlight

### Paso 1: Configuración de RevenueCat

#### 1.1. Verificar Productos en App Store Connect
1. Ve a [App Store Connect](https://appstoreconnect.apple.com/)
2. Selecciona tu app
3. Ve a **Features** → **Subscriptions** o **In-App Purchases**
4. Verifica que existan estos productos (o crea nuevos):
   - **Suscripción Semanal:** Product ID debe ser algo como `psico_weekly_399`
   - **Suscripción Anual:** Product ID debe ser algo como `psico_annual_2499`
5. Asegúrate de que ambos productos estén en estado **"Ready to Submit"**

#### 1.2. Configurar Productos en RevenueCat Dashboard
1. Ve a [RevenueCat Dashboard](https://app.revenuecat.com/)
2. Selecciona tu proyecto
3. Ve a **Products**
4. Para cada producto de App Store Connect:
   - Haz clic en **+ New**
   - Selecciona **App Store**
   - Ingresa el **Product ID** exacto de App Store Connect
   - Guarda

#### 1.3. Crear Offering "default"
1. En RevenueCat Dashboard, ve a **Offerings**
2. Si no existe "default", crea uno nuevo:
   - Identifier: `default`
   - Display name: `Default Offering`
3. Dentro del offering "default":
   - Agrega el producto semanal como **"Weekly"** package
   - Agrega el producto anual como **"Annual"** package
4. Marca el offering como **"Current"**

#### 1.4. Verificar API Key de iOS
1. Ve a **Project Settings** → **API Keys**
2. Copia la API Key para iOS (debe empezar con `appl_...`)
3. Verifica que esta clave esté configurada en tu archivo `.env`:
   ```
   EXPO_PUBLIC_RC_API_KEY_IOS=appl_TuClaveAqui
   ```

#### 1.5. Configurar en EAS Secrets (CRÍTICO para TestFlight)
```bash
# Configura la API Key de RevenueCat como secret
eas secret:create --scope project --name EXPO_PUBLIC_RC_API_KEY_IOS --value appl_TuClaveAqui

# Configura el entitlement
eas secret:create --scope project --name EXPO_PUBLIC_RC_ENTITLEMENT --value premium
```

---

### Paso 2: Configuración de AdMob

#### 2.1. Verificar App en AdMob Dashboard
1. Ve a [AdMob Dashboard](https://apps.admob.com/)
2. Verifica que tu app esté registrada
3. Anota tu **App ID** para iOS (formato: `ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX`)

#### 2.2. Crear/Verificar Unidad de Anuncio Recompensado
1. En AdMob Dashboard, ve a tu app
2. Ve a **Ad units**
3. Busca o crea una unidad de tipo **"Rewarded"**
4. Anota el **Ad Unit ID** (formato: `ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX`)
5. **IMPORTANTE:** Asegúrate de que la unidad esté **ACTIVADA**

#### 2.3. Completar Información de Pago (si no está hecha)
1. Ve a **Payments** en AdMob
2. Completa toda la información fiscal requerida
3. Agrega método de pago
4. **NOTA:** Sin esto, los anuncios no se mostrarán

#### 2.4. Verificar que la App esté Aprobada
1. Ve a **App settings** → **App status**
2. Debe decir **"Ready to serve ads"** o **"Approved"**
3. Si dice "Under review" o "Needs attention", sigue las instrucciones

#### 2.5. Configurar IDs en .env
Actualiza tu archivo `.env` con tus IDs reales:
```bash
# App ID de iOS
EXPO_PUBLIC_ADMOB_IOS_APP_ID=ca-app-pub-9521354088644356~4323532279

# ID de anuncio recompensado para iOS (PRODUCCIÓN)
EXPO_PUBLIC_ADMOB_REWARDED_ID_IOS_PROD=ca-app-pub-9521354088644356/8741181635
```

#### 2.6. Configurar en EAS Secrets (CRÍTICO para TestFlight)
```bash
# App ID
eas secret:create --scope project --name EXPO_PUBLIC_ADMOB_IOS_APP_ID --value ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX

# Rewarded Ad Unit ID para PRODUCCIÓN
eas secret:create --scope project --name EXPO_PUBLIC_ADMOB_REWARDED_ID_IOS_PROD --value ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX
```

---

### Paso 3: Configuración de Build para TestFlight

#### 3.1. Verificar app.config.js
Tu configuración actual ya tiene las referencias correctas:
```javascript
plugins: [
  [
    "react-native-google-mobile-ads",
    {
      androidAppId: process.env.EXPO_PUBLIC_ADMOB_ANDROID_APP_ID,
      iosAppId: process.env.EXPO_PUBLIC_ADMOB_IOS_APP_ID,
      // ... sk_ad_network_items ya configurados
    }
  ]
]
```

#### 3.2. Verificar Todos los Secrets de EAS
```bash
# Lista todos los secrets configurados
eas secret:list

# Deberías ver:
# - EXPO_PUBLIC_RC_API_KEY_IOS
# - EXPO_PUBLIC_RC_ENTITLEMENT
# - EXPO_PUBLIC_ADMOB_IOS_APP_ID
# - EXPO_PUBLIC_ADMOB_REWARDED_ID_IOS_PROD
```

#### 3.3. Incrementar Build Number
En `app.config.js`:
```javascript
ios: {
  buildNumber: "4", // Incrementa el número
  // ... resto de configuración
}
```

#### 3.4. Hacer el Build para TestFlight
```bash
# Build de producción para iOS
eas build --platform ios --profile production

# O si tienes un profile específico para TestFlight:
eas build --platform ios --profile testflight
```

---

## 🔍 Cómo Verificar que Todo Funcione

### Después del Build de TestFlight:

#### 1. Verificar Logs de AdMob
Instala la app desde TestFlight y:
1. Abre Xcode
2. Ve a **Window** → **Devices and Simulators**
3. Selecciona tu dispositivo
4. Haz clic en **Open Console**
5. Busca líneas que digan `[AdsManager]`
6. Deberías ver:
   ```
   ✅ Production Build (including TestFlight)
   Using PRODUCTION ad unit IDs
   Ad Unit ID (first 25 chars): ca-app-pub-...
   ```

#### 2. Verificar Logs de RevenueCat
En la consola, busca líneas que digan `[useSubscription]`:
1. Al abrir la pantalla de suscripción, deberías ver:
   ```
   [useSubscription] Current offering identifier: default
   [useSubscription] Available packages count: 2
   [useSubscription] Package 1:
     - Identifier: weekly
     - Package Type: WEEKLY
     - Product ID: psico_weekly_399
     - Price: $3.99
   ```

#### 3. Probar Compra en Sandbox
1. Configura una cuenta de Sandbox en **Settings** → **App Store** → **Sandbox Account**
2. Intenta comprar una suscripción
3. Usa las credenciales de Sandbox cuando se solicite
4. La compra debe completarse sin errores

#### 4. Probar Anuncios
1. Ve a cualquier sección con contenido bloqueado
2. Presiona "Ver Anuncio para Desbloquear"
3. Un anuncio real debe aparecer (puede tardar unos segundos en cargar)
4. Completa el anuncio
5. El contenido debe desbloquearse

---

## 🚨 Troubleshooting

### Problema: "No hay planes disponibles"
**Solución:**
1. Verifica que los productos existan en App Store Connect
2. Verifica que los productos estén agregados al offering "default" en RevenueCat
3. Verifica que el offering "default" esté marcado como "Current"
4. Espera 5-10 minutos después de hacer cambios en RevenueCat

### Problema: "Plan monthly/yearly no encontrado"
**Solución:**
1. Los logs mostrarán qué packages están disponibles
2. Verifica que los packages tengan el tipo correcto:
   - Semanal debe ser tipo "WEEKLY" o "MONTHLY"
   - Anual debe ser tipo "ANNUAL"
3. En RevenueCat Dashboard, edita el offering y asegúrate de asignar el tipo correcto a cada producto

### Problema: Anuncio no carga (timeout después de 15 segundos)
**Solución:**
1. Verifica que el Ad Unit ID sea correcto (debe empezar con `ca-app-pub-`)
2. Verifica que la unidad de anuncio esté activada en AdMob Dashboard
3. Verifica que hayas completado la información de pago en AdMob
4. Verifica que tu app esté aprobada para mostrar anuncios
5. Intenta con WiFi en lugar de datos móviles
6. Espera 24-48 horas después de configurar AdMob (los anuncios pueden tardar en activarse)

### Problema: Error code 1 (INVALID_REQUEST)
**Solución:**
- El Ad Unit ID está mal configurado
- Verifica que EXPO_PUBLIC_ADMOB_REWARDED_ID_IOS_PROD tenga el formato correcto
- Verifica que el ID pertenezca a tu cuenta de AdMob

### Problema: Error code 3 (NO_FILL)
**Solución:**
- No hay anuncios disponibles para mostrar en este momento
- Esto es normal en TestFlight si la app es nueva
- Puede tomar 24-48 horas para que Google tenga anuncios disponibles
- Intenta más tarde o prueba en diferentes horas del día

---

## 📊 Checklist Final antes de Publicar a TestFlight

- [ ] Productos configurados en App Store Connect (estado "Ready to Submit")
- [ ] Productos agregados en RevenueCat Dashboard
- [ ] Offering "default" creado con packages weekly y annual
- [ ] API Key de RevenueCat configurada en EAS Secrets
- [ ] App registrada en AdMob Dashboard
- [ ] Unidad de anuncio recompensado creada y activada
- [ ] Información de pago completada en AdMob
- [ ] Ad Unit IDs configurados en EAS Secrets
- [ ] Build number incrementado
- [ ] Todos los EAS Secrets verificados con `eas secret:list`
- [ ] Build de producción generado con `eas build`
- [ ] Build subido a TestFlight
- [ ] Probado en dispositivo real desde TestFlight
- [ ] Logs verificados en Xcode Console
- [ ] Compra de suscripción probada en Sandbox
- [ ] Anuncios probados y funcionando

---

## 🎯 Próximos Pasos

Una vez que todo funcione en TestFlight:

1. **Monitoreo:**
   - Revisa los logs de RevenueCat Dashboard para ver compras
   - Revisa AdMob Dashboard para ver impresiones de anuncios
   - Monitorea feedback de testers de TestFlight

2. **Optimización:**
   - Ajusta precios si es necesario
   - Prueba diferentes formatos de anuncios
   - Optimiza la experiencia de usuario

3. **Producción:**
   - Una vez todo esté probado, prepara para App Store
   - Asegúrate de que todos los screenshots y metadata estén listos
   - Sube a revisión de Apple

---

## 📞 Soporte

### RevenueCat
- Dashboard: https://app.revenuecat.com/
- Docs: https://www.revenuecat.com/docs/
- Support: support@revenuecat.com

### AdMob
- Dashboard: https://apps.admob.com/
- Docs: https://support.google.com/admob
- Support: https://support.google.com/admob/contact

### Expo/EAS
- Dashboard: https://expo.dev/
- Docs: https://docs.expo.dev/
- Forums: https://forums.expo.dev/

---

**Última actualización:** 2025-10-13

**Cambios principales en esta versión:**
- TestFlight ahora usa configuración de producción (IDs reales)
- Mejoras en logging para debugging
- Corrección de bug en LockedSection.tsx
- Mensajes de error más descriptivos
