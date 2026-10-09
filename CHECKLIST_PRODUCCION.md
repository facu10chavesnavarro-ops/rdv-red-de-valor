# Checklist antes de producción (mainnet)

Nada de esto está hecho. **No desplegar en mainnet ni usar dinero real** hasta completar esta lista y tener autorización explícita.

## Seguridad del contrato
- [ ] **Auditoría externa** de `Raffle.sol` por una firma reconocida, con los hallazgos corregidos y re-auditados.
- [ ] Revisar el `callbackGasLimit` con el peor caso real (5.000 números y muchos rangos) y medir el gas del callback.
- [ ] Decidir el comportamiento si la meta se alcanza solo con donaciones (hoy pasa a reembolsos).
- [ ] Tests de integración en un fork de BNB Chain mainnet con el USDT real y el coordinador VRF real.
- [ ] Verificar el código fuente en BscScan.
- [ ] Considerar un programa de bug bounty.

## Fondos y operación
- [ ] **Tesorería con multisig** (por ejemplo Safe en BNB Chain, 2 de 3 o 3 de 5), nunca una wallet personal. Es inmutable en el contrato: revisarla dos veces antes de desplegar.
- [ ] Confirmar la dirección del USDT oficial en BNB Chain y sus 18 decimales: el script los lee con `decimals()`, pero hay que validar la dirección.
- [ ] Suscripción de Chainlink VRF en mainnet: elegir el gas lane (key hash), fondearla con margen y agregar la Raffle como consumer. Definir quién monitorea el saldo.
- [ ] Definir el procedimiento si VRF no responde: el contrato permite reintentar después de 24 h.
- [ ] Procedimiento de contacto con el ganador y entrega del premio, sin pedir nunca datos sensibles por chat.
- [ ] Comunicación del reembolso a los participantes si no se alcanza la meta.

## Legal
- [ ] **Revisión legal en Argentina:** autorización de la rifa ante el organismo competente (lotería provincial o el que corresponda), número de autorización en el footer, tratamiento impositivo de los aportes y del premio, y normativa de defensa del consumidor y de activos virtuales.
- [ ] Términos y condiciones y política de privacidad publicados (`NEXT_PUBLIC_TERMS_URL`).
- [ ] **"Sin fines de lucro":** la web hoy dice "lo recaudado no se reparte entre socios". Antes de afirmar "sin fines de lucro" como estatus, confirmar la figura jurídica (asociación civil, fundación u otra) con un abogado.
- [ ] **Destino de las donaciones (50/25/25):** el contrato envía todo a la tesorería; el reparto lo ejecuta el equipo. Definir el procedimiento y publicar cada transferencia de la tesorería a los proyectos con su comprobante, como promete la web.
- [ ] Revisión de la redacción: no presentar los aportes como inversión ni prometer rendimientos.

## Web
- [ ] Habilitar el soporte de mainnet en `web/lib/config.ts`, hoy bloqueado a propósito, y poner `isTestnet = false`. Eso oculta el faucet y el aviso de testnet.
- [ ] Quitar o revisar la "Cuenta de prueba (anvil)". Hoy solo aparece con chainId 31337.
- [ ] `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` propio y dominio verificado en Reown.
- [ ] RPC pago o dedicado (los públicos limitan `getLogs`) y monitoreo de errores.
- [ ] Imagen real del premio, redes de contacto y número de autorización cargados.
- [ ] Pruebas en celulares reales (MetaMask y Trust en Android e iOS) y con usuarios sin experiencia.
- [ ] Encabezados de seguridad (CSP) y dominio propio con HTTPS.
