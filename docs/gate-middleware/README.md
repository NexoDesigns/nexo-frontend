# Puerta de autenticación para subdominios

`middleware.ts` en esta carpeta es la **fuente canónica**. Cada herramienta de
Nexo que viva en su propio subdominio (`editor.nexodesign.ai`, y las que
vengan) lleva una copia en la raíz de su repo.

No edites la copia. Cambia esta, sube la versión de la cabecera, y vuelve a
copiar.

## Las dos mitades

| Mitad | Dónde | Qué hace |
|---|---|---|
| Emisor | `src/app/api/auth/gate/route.ts` (este repo) | Comprueba la sesión de Supabase y acuña un ticket de 60 s |
| Verificador | `middleware.ts` (cada subdominio) | Cambia el ticket por una cookie de sesión de 1 h y sirve, o manda al emisor |

El subdominio nunca ve el JWT de Supabase. Si alguna de las herramientas
tuviera un XSS, lo que se llevaría es una sesión de una hora para esa
herramienta, no la cuenta de Nexo.

## Enlazar a una herramienta desde la app

Nunca con la URL directa: siempre con `gatedUrl(url)` (`src/lib/gate.ts`), que
pasa por `/api/auth/gate` **del origen donde está la app**. Así el ticket lo
acuña quien tiene la sesión (producción, un preview o `localhost`) y la
herramienta abre sin login. Con la URL directa, el subdominio rebota a su
`GATE_ISSUER_URL` (producción), que no ve sesiones de otros orígenes y enseña
el login.

En `localhost` esto arregla las pestañas nuevas, pero **no** el editor en
iframe: el CSP `frame-ancestors` solo admite `https://nexodesign.ai` y la
cookie `SameSite=Lax` no se guarda en un iframe de otro sitio. Es a propósito;
en local, ábrelo en pestaña nueva.

## Añadir un subdominio nuevo

1. **Copiar** `middleware.ts` a la raíz del repo.

2. **Ajustar el `matcher`.** Es lo único que cambia entre sitios, y es lo que
   controla el gasto: el middleware se factura por invocación y el matcher se
   aplica *antes* de invocar la función, así que cada excepción es una
   invocación ahorrada en cada carga de página. Excluye lo que ya es público
   —librerías de terceros, logos— y no excluyas nada tuyo.

   ```ts
   matcher: ['/((?!lib/|_vercel/|favicon\\.ico|nexodesign_logo\\.jpg).*)']
   ```

3. **Variables de entorno** en el proyecto de Vercel:

   | Variable | Valor |
   |---|---|
   | `GATE_TICKET_SECRET` | El mismo que en `nexo-frontend` |
   | `GATE_ISSUER_URL` | `https://nexodesign.ai` |
   | `GATE_SELF_ORIGIN` | El origen de este subdominio, sin barra final |

4. **Añadir el origen** a `GATE_ALLOWED_ORIGINS` en `nexo-frontend`. El emisor
   solo acuña tickets para orígenes de esa lista; sin esto tendríamos un open
   redirect que además reparte credenciales firmadas.

5. **`package.json`** con `{"type": "module"}` si el repo no tiene ninguno.
   Vercel lo pide para compilar el middleware en proyectos sin framework. No
   hacen falta dependencias.

6. **`vercel.json`** para las cabeceras estáticas. Van aquí y no en el
   middleware **a propósito**: las cabeceras de `vercel.json` las aplica la CDN
   sin invocar nada.

No hay que tocar el emisor: los pasos 3 y 4 son toda la integración.

## Generar `GATE_TICKET_SECRET`

Es una clave HMAC-SHA256, no una contraseña. 32 bytes de un CSPRNG:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

```powershell
# Equivalente sin Node (PowerShell 5.1 y Core)
$bytes = New-Object byte[] 32
[System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
[Convert]::ToBase64String($bytes)
```

- **32 bytes, ni más ni menos.** Son 256 bits, el tamaño de la salida de
  SHA-256: ahí está la seguridad completa del algoritmo. Pasar de 64 bytes es
  inútil, porque HMAC reduce por hash toda clave mayor que su bloque.
- **`base64url`** evita `+`, `/` y `=`, que son los caracteres que se escapan
  mal al pegar en la UI de Vercel o entre comillas en una shell.
- **Genéralo en la terminal y pégalo en Vercel.** Si el valor pasa por un chat,
  un log de CI o un ticket, está comprometido aunque tenga 256 bits.
- **Márcalo Sensitive** en Vercel, para que no se pueda releer desde la UI.
- **Que sea distinto de `EDITOR_LINK_SECRET`** y del JWT secret de Supabase.
  Reutilizar uno hace que rotar cualquiera rompa los otros.

Rotarlo es barato: las sesiones duran 1 h, así que solo provoca que la gente
vuelva a pasar por la puerta, sin ver un login. Lo único crítico es cambiarlo
en el frontend y en todos los subdominios **a la vez**.

## Cosas que romperían esto

- **Editar la copia en vez de la canónica.** Dos subdominios que validan
  distinto es la clase de fallo que aparece meses después.
- **Rotar `GATE_TICKET_SECRET` en un sitio y no en los otros.** Invalida todas
  las sesiones de los subdominios que se queden atrás. Si lo rotas, hazlo en
  todos a la vez.
- **Quitar `GATE_SELF_ORIGIN`** y deducir el origen de la petición. El `aud` del
  ticket dejaría de significar nada: un ticket de un subdominio valdría en
  cualquier otro.
- **Meter algo propio en las excepciones del matcher.** Queda servido a
  cualquiera, sin aviso.

## Qué NO resuelve

La puerta comprueba que hay sesión en Nexo, que es lo que el resto de la
aplicación exige hoy. **No** comprueba permisos por proyecto, porque todavía no
existen: `routers/projects.py` devuelve todos los proyectos a cualquier usuario
autenticado. Cuando lleguen, el sitio donde enchufarlos es
`nexo-backend/core/authz.py`, y el emisor debe empezar a llamarlo — están
escritos para eso.

## Subdominios que no son un sitio estático en Vercel

`middleware.ts` es Routing Middleware de Vercel: no corre delante de un
servidor propio. `datasheets.nexodesign.ai` es una app Python en Render, así
que lleva un **port** en `datasheet_extractor/datasheets/gate.py`: mismo
ticket, misma cookie `nexo_gate`, mismo `/__gate/callback`, mismas tres
variables. El emisor no distingue entre los dos.

- **Si cambias este `middleware.ts`, cambia también `gate.py`** (y sube la
  versión de su cabecera). Su test (`tests/test_gate.py`) ejecuta este archivo
  con Node y comprueba que cada uno acepta los tickets y las cookies del
  otro: un cambio que los separe lo rompe.
- **Una diferencia deliberada**: una llamada a `/api/*` sin sesión recibe
  `401` con JSON en vez de `302`. Un `fetch` de la página no puede seguir una
  redirección al login; la página recarga y pasa por la puerta como
  cualquier navegación.
