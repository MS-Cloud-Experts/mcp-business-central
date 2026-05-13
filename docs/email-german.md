**Para:** German
**De:** Ivan / MS Cloud Experts
**Asunto:** MCP de Dataverse — estado y por qué la config de PPAC quedó obsoleta

---

Hola German,

Te resumo en una sola pasada el estado del MCP de Dataverse para Claude Desktop y por qué la configuración que viste en Power Platform Admin Center (PPAC) hace unas semanas ya no aplica.

### Primer intento (abril) — cliente oficial de Microsoft

Empezamos con el cliente oficial `@microsoft/dataverse`, que apunta al endpoint MCP nativo de Microsoft (`https://<org>.crm.dynamics.com/api/mcp`). Para habilitarlo configuramos en PPAC los dos pasos que pide Microsoft: prendimos el feature **Dataverse Model Context Protocol** y agregamos la app registration `e6cfa67d-...` a la tabla **Allowed MCP Clients**.

Funcionó en **Claude Code** pero **no en Claude Desktop**, por dos problemas técnicos del cliente oficial:

1. El handshake `tools/list` tarda más de 30 segundos en responder. Claude Desktop tiene un timeout de 30 segundos hardcoded que no se puede cambiar, así que mata la conexión antes de que termine el saludo inicial.
2. El proxy `npx` del paquete oficial escribe líneas tipo `warn: ...` a **stdout** en vez de **stderr**. Claude Desktop interpreta cualquier cosa en stdout como mensajes JSON-RPC del protocolo, así que esas líneas rompen la conexión.

Claude Code tolera ambas cosas (maneja distinto los streams), pero el usuario final usa Claude Desktop, así que esa ruta quedó descartada.

### Solución actual — MCP comunitario + instalador propio

Pasamos a usar `codeurali/mcp-dataverse`, un paquete público en npm mantenido por la comunidad. La diferencia clave: **NO usa el endpoint MCP nativo de Microsoft. Va contra el Web API estándar de Dataverse** (`/api/data/v9.2/`), que es la misma API que usa Power Apps, Power Automate, y cualquier integración OData desde hace años. Eso esquiva los dos problemas del cliente oficial.

Para que sea fácil de instalar para cualquier usuario, construimos un **instalador wizard** en PowerShell (`setup-dataverse.ps1`). El usuario corre una sola línea, el wizard le pide el tenant, environment, company name y el client secret, y configura todo solo. **Reutilizamos la misma app registration** que se creó para el primer intento — no hubo que duplicar trabajo en Azure.

Lo único que necesita esa app registration para funcionar con nuestro setup es:
- El permiso `user_impersonation` sobre Dynamics CRM (ya lo tenía).
- Estar dada de alta como **Application User** en Dataverse con un Security Role.

### Validación empírica esta semana

Para confirmar que la config de PPAC ya no es necesaria, en el SANDBOX hicimos lo siguiente:

- Apagamos los dos toggles (GA y Preview) del feature *Dataverse Model Context Protocol*.
- Eliminamos completamente la fila de Claude Desktop de la tabla *Allowed MCP Clients*.

Después de reiniciar Claude Desktop, la integración **siguió funcionando intacta** — `dataverse_whoami` y consultas de cuentas devolvieron datos correctos sin tocar nuestra instalación. Eso confirma de forma definitiva que el setup actual no depende de ninguna de esas piezas de PPAC.

### Conclusión

La configuración que se hizo en PPAC en abril es legacy del intento original y **no requiere atención**. Podés dejarla apagada / limpia sin riesgo. Si en algún momento Microsoft mejora el cliente oficial (resuelve los dos problemas técnicos), lo re-evaluamos — por ahora, el camino comunitario es más estable, más rápido y sin cobro de Copilot Credits.

Cualquier duda me decís.

Saludos,
Ivan
