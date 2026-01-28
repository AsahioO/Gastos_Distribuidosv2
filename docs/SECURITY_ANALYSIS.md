# 🔐 Análisis de Seguridad - Gastos Distribuidos

**Fecha de Análisis:** 2026-01-27  
**Versión Analizada:** 2.0.0  
**Analista:** Security Review

---

## 📊 Resumen Ejecutivo

| Categoría | Crítico | Alto | Medio | Bajo |
|-----------|---------|------|-------|------|
| Backend | 1 | 2 | 3 | 2 |
| Frontend | 0 | 1 | 2 | 1 |
| API | 0 | 1 | 2 | 0 |
| Infraestructura | 1 | 1 | 1 | 0 |
| **Total** | **2** | **5** | **8** | **3** |

---

## 🔴 Vulnerabilidades Críticas

### CRIT-01: SECRET_KEY Hardcodeada en local.py

**Archivo:** `config/settings/local.py:13`

```python
SECRET_KEY = 'local-dev-secret-key-not-for-production'
```

**Riesgo:** Si este archivo se usa accidentalmente en producción, un atacante podría:
- Forjar sesiones y cookies
- Comprometer tokens JWT
- Ejecutar ataques de deserialización

**Solución:**
```python
from decouple import config
SECRET_KEY = config('SECRET_KEY')
```

---

### CRIT-02: CORS Permite Todos los Orígenes (local.py)

**Archivo:** `config/settings/local.py:134`

```python
CORS_ALLOW_ALL_ORIGINS = True
```

**Riesgo:** Permite que cualquier sitio web haga peticiones a la API, facilitando ataques CSRF y robo de datos.

**Solución:**
```python
# Usar lista blanca incluso en desarrollo
CORS_ALLOWED_ORIGINS = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
]
CORS_ALLOW_ALL_ORIGINS = False
```

---

## 🟠 Vulnerabilidades Altas

### HIGH-01: ALLOWED_HOSTS = ['*'] en local.py

**Archivo:** `config/settings/local.py:14`

```python
ALLOWED_HOSTS = ['*']
```

**Riesgo:** Permite ataques de Host Header Injection que pueden ser usados para:
- Phishing
- Cache poisoning
- Password reset poisoning

**Solución:**
```python
ALLOWED_HOSTS = ['localhost', '127.0.0.1']
```

---

### HIGH-02: Tokens JWT Almacenados en localStorage

**Archivo:** `frontend/src/stores/authStore.ts:24-49`

```typescript
persist(
  (set) => ({ ... }),
  { name: 'auth-storage' }  // Guarda en localStorage
)
```

**Riesgo:** localStorage es vulnerable a ataques XSS. Si hay una vulnerabilidad XSS, un atacante puede robar los tokens.

**Solución recomendada:**
```typescript
// Opción 1: Usar httpOnly cookies (requiere cambios en backend)
// El backend debe enviar tokens en cookies httpOnly

// Opción 2: Almacenar en memoria + refresh token en cookie
const useAuthStore = create<AuthState>()(
  (set) => ({
    // Solo en memoria, no persistir
    accessToken: null,
    refreshToken: null,  // Este debería estar en httpOnly cookie
  })
)
```

**Cambio en Backend (`SIMPLE_JWT` settings):**
```python
SIMPLE_JWT = {
    'AUTH_COOKIE': 'access_token',
    'AUTH_COOKIE_SECURE': True,
    'AUTH_COOKIE_HTTP_ONLY': True,
    'AUTH_COOKIE_SAMESITE': 'Lax',
}
```

---

### HIGH-03: Rate Limiting Deshabilitado en Local

**Archivo:** `config/settings/local.py:122`

```python
'DEFAULT_THROTTLE_CLASSES': [],
```

**Riesgo:** Sin rate limiting, la API es vulnerable a:
- Ataques de fuerza bruta en login
- Denegación de servicio (DoS)
- Enumeración de usuarios

**Solución:**
```python
'DEFAULT_THROTTLE_CLASSES': [
    'rest_framework.throttling.AnonRateThrottle',
    'rest_framework.throttling.UserRateThrottle'
],
'DEFAULT_THROTTLE_RATES': {
    'anon': '20/minute',
    'user': '100/minute',
    'login': '5/minute',
}
```

---

### HIGH-04: Falta Verificación de Propietario en Acciones

**Archivo:** `apps/procurement/views.py:76-96`

```python
@action(detail=True, methods=['post'])
def submit(self, request, pk=None):
    solicitud = self.get_object()  # Cualquier usuario autenticado puede acceder
```

**Riesgo:** Un usuario podría manipular solicitudes de otros usuarios si conoce el ID.

**Solución:**
```python
@action(detail=True, methods=['post'])
def submit(self, request, pk=None):
    solicitud = self.get_object()
    
    # Verificar que el usuario es el propietario
    if solicitud.created_by != request.user and not request.user.is_admin:
        return Response(
            {'error': 'No tiene permisos para esta solicitud.'},
            status=status.HTTP_403_FORBIDDEN
        )
```

---

## 🟡 Vulnerabilidades Medias

### MED-01: Debug Activo en Desarrollo

**Archivo:** `config/settings/local.py:12`

```python
DEBUG = True
```

**Riesgo:** Si se usa en producción, expone stack traces con información sensible.

**Solución:** ✅ Ya está `DEBUG = False` en production.py. Verificar que se use correctamente.

---

### MED-02: No Hay Expiración Forzada de Sesiones

**Archivo:** `config/settings/base.py:171-172`

```python
'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
```

**Riesgo:** Tokens de larga duración aumentan la ventana de ataque.

**Solución:**
```python
'ACCESS_TOKEN_LIFETIME': timedelta(minutes=15),
'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
```

---

### MED-03: Logging No Incluye IP de Usuario

**Riesgo:** No hay auditoría de direcciones IP, dificultando la investigación de incidentes.

**Solución:** Agregar middleware de logging:
```python
class AuditMiddleware:
    def __call__(self, request):
        response = self.get_response(request)
        if request.user.is_authenticated:
            logger.info(f"User: {request.user.email} | IP: {get_client_ip(request)}")
        return response
```

---

### MED-04: No Hay Blacklist Activa para Tokens en Logout

**Riesgo:** No hay endpoint de logout que invalide tokens activos.

**Solución:**
```python
from rest_framework_simplejwt.tokens import RefreshToken

@action(detail=False, methods=['post'])
def logout(self, request):
    token = RefreshToken(request.data['refresh'])
    token.blacklist()
    return Response({'message': 'Logout exitoso'})
```

---

### MED-05: Exposición de IDs Secuenciales

**Riesgo:** Los IDs numéricos (1, 2, 3...) facilitan la enumeración de recursos.

**Solución a largo plazo:**
```python
import uuid

class BaseModel(models.Model):
    uuid = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
```

---

## 🟢 Vulnerabilidades Bajas

### LOW-01: Contraseña por Defecto en Scripts

**Riesgo:** Credenciales `admin@gastos.local / admin123` visibles.

**Solución:** Documentar que deben cambiarse después del primer login.

---

### LOW-02: Console.log en Código

**Solución:**
```typescript
if (import.meta.env.DEV) {
    console.log('Debug:', data)
}
```

---

### LOW-03: Política de Contraseñas Básica

**Solución:**
```python
{'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
 'OPTIONS': {'min_length': 12}},
```

---

## ✅ Buenas Prácticas Detectadas

| Aspecto | Estado |
|---------|--------|
| ORM Django (no SQL raw) | ✅ |
| Validadores de contraseña | ✅ |
| HTTPS en producción | ✅ |
| HSTS headers | ✅ |
| Refresh token rotation | ✅ |
| Token blacklist disponible | ✅ |
| Permisos por rol | ✅ |
| CSRF middleware | ✅ |
| No hay .env en repo | ✅ |
| Throttling configurado (base) | ✅ |

---

## 📋 Plan de Remediación

### Fase 1 - Inmediato (1-2 días)
1. Cambiar `CORS_ALLOW_ALL_ORIGINS = False` en local.py
2. Cambiar `ALLOWED_HOSTS` a valores específicos
3. Agregar verificación de propietario en acciones
4. Remover console.log de debug

### Fase 2 - Corto plazo (1 semana)
1. Implementar endpoint de logout con blacklist
2. Agregar rate limiting en local.py
3. Reducir tiempo de vida de tokens

### Fase 3 - Mediano plazo (1 mes)
1. Evaluar migración de localStorage a httpOnly cookies
2. Implementar logging de auditoría con IP
3. Agregar UUIDs para URLs públicas
4. Implementar 2FA para admin
