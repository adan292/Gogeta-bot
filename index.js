import { makeWASocket, useMultiFileAuthState, DisconnectReason, delay } from '@whiskeysockets/baileys';
import pino from 'pino';
import readline from 'readline';
import { Boom } from '@hapi/boom';

// Configuración para leer la entrada del usuario en la consola de Termux
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const question = (text) => new Promise((resolve) => rl.question(text, resolve));

async function startGogetaBot() {
    const { state, saveCreds } = await useMultiFileAuthState('session_auth');

    const sock = makeWASocket({
        logger: pino({ level: 'silent' }),
        auth: state,
        printQRInTerminal: false // Desactivamos el código QR por completo
    });

    // LÓGICA DE VINCULACIÓN POR CÓDIGO DE 8 DÍGITOS
    if (!sock.authState.creds.registered) {
        await delay(3000); // Espera corta para inicializar correctamente
        
        console.log('🌌 ⭐ GOGETA BOT: MODO VINCULACIÓN POR CÓDIGO CELESTIAL ⭐ 🌌');
        const numeroTelefono = await question('📱 Escribe tu número de WhatsApp con código de país (Ej: 54911XXXXXX o 521XXXXXXXXXX):\n> ');
        
        // Limpiamos el número por si el usuario mete espacios o símbolos
        const numeroLimpio = numeroTelefono.replace(/[^0-9]/g, '');

        try {
            const codigo = await sock.requestPairingCode(numeroLimpio);
            console.log('\n=============================================');
            console.log(`🔥 TU CÓDIGO DE VINCULACIÓN ES:  ${codigo}  🔥`);
            console.log('=============================================');
            console.log('👉 Entra a tu WhatsApp -> Dispositivos Vinculados -> Vincular con número de teléfono e ingresa ese código.\n');
        } catch (error) {
            console.error('❌ Error al generar el código de emparejamiento:', error);
        }
    }

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error instanceof Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('⚠️ Conexión cerrada. ¿Reconectando?: ', shouldReconnect);
            if (shouldReconnect) {
                startGogetaBot();
            }
        } else if (connection === 'open') {
            console.log('✅ ¡GOGETA BLUE BOT ESTÁ CONECTADO Y LISTO PARA EL COMBATE! 🚀');
        }
    });

    // Escucha de mensajes (Menú con prefijo /)
    sock.ev.on('messages.upsert', async (chatUpdate) => {
        try {
            const mek = chatUpdate.messages[0];
            if (!mek.message) return;
                                              
            const messageType = Object.keys(mek.message)[0];
            let body = '';

            if (messageType === 'conversation') body = mek.message.conversation;
            else if (messageType === 'extendedTextMessage') body = mek.message.extendedTextMessage.text;

            const from = mek.key.remoteJid;
            const prefix = '/';

            if (body.startsWith(prefix)) {
                const command = body.slice(prefix.length).trim().split(/ +/).shift().toLowerCase();

                if (command === 'menu') {
                    const menuTexto = `💠 "¡A partir de aquí, las cosas serán de un nivel completamente diferente!" 💠

Bienvenido a 🌟 GOGETA BLUE BOT 🌟
Usa los comandos escribiendo la barra diagonal:

╔════════════════════════╗
      📋 COMANDOS DIVINOS
╚════════════════════════╝

🛸 /menu ➔ Despliega este mapa de navegación.
🛸 /ping ➔ Verifica la velocidad de respuesta del bot.

🎨 ➔ TALLER MULTIMEDIA
⚡ /sticker ➔ Convierte una imagen, GIF o video en Sticker.

🔮 ➔ ARENA DE ENTRETENIMIENTO
⚡ /poder ➔ Mide el Ki exacto de un miembro del grupo.

📥 ➔ CÁPSULA DE DESCARGAS
⚡ /musica ➔ Descarga canciones directo desde YouTube.

👑 ➔ TRONO DE ADMINISTRACIÓN
⚡ /kick ➔ Expulsa a un insecto que cause problemas.

════════════════════════
❄️ "¡Este es el poder del Super Saiyajin Blue Dinámico!" ❄️
Sistema estable ➔ Prefijo activo: [ / ]`;

                    await sock.sendMessage(from, { text: menuTexto }, { quoted: mek });
                }

                if (command === 'ping') {
                    await sock.sendMessage(from, { text: '🏓 ¡Pong! Tu Ki está sincronizado con Gogeta.' }, { quoted: mek });
                }
            }
        } catch (error) {
            console.error('Error al procesar mensaje: ', error);
        }
    });
}

startGogetaBot();

