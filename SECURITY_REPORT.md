# 🛡️ SECURITY REPORT - TribuRunnerWeb

Informe de auditoría y controles de ciberseguridad para la plataforma web de **Tribu Runner**, desarrollado bajo los estándares de **OWASP Top 10**, **ISO/IEC 27001**, **ISO/IEC 27002** e **ISO/IEC 27032**.

---

## 1. Auditoría de Stack y Dependencias

| Dependencia / Módulo | Propósito en el Proyecto | Aporte a la Ciberseguridad |
| :--- | :--- | :--- |
| **Angular Core (v22+)** | Framework reactivo de Single Page Application | Contextual encoding y sanitización automática de templates contra XSS. Manejo de estado inmutable y Signals. |
| **Firebase JS SDK (v11+)** | Conexión modular con Firebase Auth y Cloud Firestore | Autenticación criptográfica CSPRNG, canales TLS 1.3 en tiempo real (`onSnapshot`), validación de firmas JWT en tokens ID de usuario. |
| **Angular CDK & Material (v22+)** | Componentes de interfaz accesibles y estandarizados | Cumplimiento de accesibilidad WCAG/ARIA, aislamiento de eventos de teclado y foco, mitigación de Clickjacking en modales. |
| **Angular Router** | Enrutamiento del cliente | Protección contra open redirects en el cliente mediante rutas fuertemente tipadas y declarativas. |
| **RxJS** | Programación reactiva | Manejo seguro y asíncrono de flujos de datos sin memory leaks ni estados compartidos inseguros. |
| **TypeScript (v6+)** | Lenguaje tipado estricto | Prevención de errores de tipo en tiempo de compilación y validación de interfaces de datos entrantes. |

---

## 2. Mapa de Rutas y Seguridad (Frontend / Cliente & RBAC)

| Ruta | Nivel de Acceso | Mecanismo de Seguridad | Descripción |
| :--- | :---: | :--- | :--- |
| `/home` | Público | Renderizado estático seguro | Landing page con información pública de la plataforma, descarga y comunidad. |
| `/equipamiento` | Público | Enlaces externos seguros (`rel="noopener noreferrer"`) | Catálogo filtrable de equipamiento deportivo y links oficiales de Mercado Libre sincronizado con Firestore. |
| `/admin` | **Restringido (RBAC)** | **Firebase Auth + Verificación Firestore `/admins`** | Panel de control para Fundador (`FOUNDER`) y Moderadores (`MODERATOR`). Bloquea acceso si el rol es `NONE`. |
| `/afiliados` | Redirección | Router Redirect | Redirección canónica a `/equipamiento`. |
| `/**` | Redirección | Router Fallback | Redirección automática a `/home` ante rutas no reconocidas para evitar estados inconsistentes. |

---

## 3. Matriz de Endpoints y Colecciones Firestore (Backend / BaaS)

| Colección Firestore | Nivel de Seguridad | Mecanismo de Control (Security Rules v2) | Mitigación de Vulnerabilidad |
| :--- | :---: | :--- | :--- |
| `/admins/{adminId}` | **Restringido (Root)** | Lectura pública controlada, escritura bloqueada salvo credenciales server/founder. | **OWASP A01: Broken Access Control / Escalada de Privilegios.** |
| `/promo_codes/{code}` | **Restringido (Founder)** | Lectura pública de validación; creación, actualización y borrado solo por Administradores autenticados. | **OWASP A04: Insecure Design / Abuso de Beneficios VIP.** |
| `/official_events/{id}` | **Staff / Moderación** | Lectura pública; escritura, modificación y eliminación restringida a usuarios autenticados con rol Staff. | **OWASP A01: Broken Access Control.** |
| `/event_suggestions/{id}` | **Comunitario / Moderado**| Creación abierta para atletas; actualización y borrado exclusivo para moderadores autorizados. | **OWASP A08: Software & Data Integrity.** |
| `/affiliate_products/{id}` | **Staff / Admin** | Lectura pública; escritura y edición restringida a administradores. | **OWASP A03: Injection / Desfiguración de Enlaces.** |
| `/reports/{reportId}` | **Moderación UGC** | Creación permitida; resolución y borrado reservado para el equipo de moderación. | **OWASP A04: Insecure Design.** |

---

## 4. Estrategia de Sanitización y Escape de Datos

1. **Prevención contra Cross-Site Scripting (XSS - OWASP A03):**
   - Angular trata por defecto todos los valores vinculados mediante `{{ }}` o `[property]` como no confiables y los sanitiza automáticamente antes de insertarlos en el DOM.
   - Prohibido el uso de `bypassSecurityTrust*` a menos que exista una justificación documentada y validación rigurosa con CSP.
   - Todo input proveniente de formularios en el Dashboard (códigos promo, nombres de eventos, enlaces de afiliados) es normalizado (`trim()`, `toUpperCase()`, sanitización de URLs).

2. **Sanitización de Almacenamiento Local (Local Storage):**
   - El almacenamiento de preferencias (como `tribu_theme_preference`) se valida estrictamente contra un conjunto cerrado de valores permitidos (`['dark', 'light']`).

3. **Content Security Policy (CSP):**
   - La aplicación está preparada para desplegarse con encabezados HTTP estrictos:
     ```http
     Content-Security-Policy: default-src 'self' https://*.firebaseio.com https://*.googleapis.com; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https://*.googleusercontent.com https://*.mercadolibre.com https://*.mlstatic.com;
     X-Content-Type-Options: nosniff
     X-Frame-Options: SAMEORIGIN
     Referrer-Policy: strict-origin-when-cross-origin
     ```

---

## 5. Matriz de Prevención de Vulnerabilidades (OWASP Top 10)

| ID OWASP | Vulnerabilidad | Nivel de Riesgo | Medida Implementada en TribuRunnerWeb |
| :---: | :--- | :---: | :--- |
| **A01:2021** | Broken Access Control | Alto | RBAC estricto en `/admin`, validación de roles en tiempo real contra `/admins` y lista de correos de fundadores. |
| **A02:2021** | Cryptographic Failures | Alto | Uso estricto de HTTPS / TLS 1.3 en SDK de Firebase, Google Auth y links de Mercado Libre. |
| **A03:2021** | Injection (XSS / HTMLi) | Crítico | Motor de plantillas de Angular con sanitización contextual y validación de tipos estricta con TypeScript. |
| **A04:2021** | Insecure Design | Medio | Arquitectura desacoplada en Servicios (FirebaseService, AdminService), principio de Mínimo Privilegio. |
| **A05:2021** | Security Misconfiguration | Medio | Eliminación de comentarios de depuración, compilación optimizada para producción (`ng build`). |
| **A06:2021** | Vulnerable & Outdated Components | Alto | Auditoría de dependencias con `npm audit` (0 vulnerabilidades) y uso de Firebase JS SDK v11+. |
| **A07:2021** | Identification & Authentication Failures | Alto | Manejo de sesiones mediante Firebase Auth seguro con tokens JWT revocables y expiración controlada. |
| **A08:2021** | Software & Data Integrity Failures | Medio | Integridad estricta mediante `package-lock.json` y tipado fuerte de entidades de Firestore. |
| **A09:2021** | Security Logging & Monitoring | Bajo | Sin exposición de PII ni passwords en logs de consola de usuario final. |
| **A10:2021** | Server-Side Request Forgery (SSRF) | N/A (Frontend) | Sin peticiones arbitrarias hacia URLs no confiables. |

---

*Reporte generado y mantenido por el equipo de ingeniería y ciberseguridad de Tribu Runner.*
