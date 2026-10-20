const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    DisconnectReason, 
    browseCapability 
} = require('@whiskeysockets/baileys');
const pino = require('pino');
const readline = require('readline');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const question = (text) => new Promise((resolve) => rl.question(text, resolve));

async function startGogetaBot() {
    const { state, saveCreds } = await useMultiFileAuthState('gogeta_auth_session');
    
    const conn = makeWASocket({
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false, // Desactivado para usar vinculación por código de 8 dígitos
        auth: state,
        browser: ['Ubuntu', 'Chrome', '20.0.04']
    });

    // SISTEMA DE VINCULACIÓN POR CÓDIGO DE 8 DÍGITOS
    if (!conn.authState.creds.registered) {
        console.clear();
        console.log("💥 GOGETA-BOT VINCULACIÓN REQUERIDA 💥\n");
        const phoneNumber = await question('Introduce tu número de WhatsApp (Ej: 584120299482): ');
        const cleanedNumber = phoneNumber.replace(/[^0-9]/g, '');
        
        setTimeout(async () => {
            try {
                let code = await conn.requestPairingCode(cleanedNumber);
                code = code?.match(/.{1,4}/g)?.join('-') || code;
                console.log(`\n🔑 TU CÓDIGO DE VINCULACIÓN DE 8 DÍGITOS ES: ${code}`);
                console.log("Introduce este código en la sección: Dispositivos vinculados -> Vincular con el código de teléfono.\n");
            } catch (error) {
                console.error("Error al generar el código de vinculación:", error);
            }
        }, 3000);
    }

    conn.ev.on('creds.update', saveCreds);

    conn.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('Conexión cerrada. Reconectando...', shouldReconnect);
            if (shouldReconnect) startGogetaBot();
        } else if (connection === 'open') {
            console.log('💥 ¡GOGETA-BOT CONECTADO CON ÉXITO! Desarrollado por adánzx7.');
        }
    });

    // CONTROLADOR DE MENSAJES Y COMANDOS
    conn.ev.on('messages.upsert', async (chatUpdate) => {
        try {
            const m = chatUpdate.messages[0];
            if (!m.message) return;
            const from = m.key.remoteJid;
            const text = m.message.conversation || m.message.extendedTextMessage?.text || "";
            const prefix = ".";
            
            if (!text.startsWith(prefix)) return;
            const command = text.slice(prefix.length).trim().split(/ +/).shift().toLowerCase();

            // COMANDO PRINCIPAL: .menu
            if (command === 'menu') {
                const txtMenu = `💥 *𝙂𝙊𝙂𝙀𝙏𝘼 - 𝘽𝙊𝙏 𝙈𝙐𝙇𝙏𝙄-𝘿𝙀𝙑𝙄𝘾𝙀 𝙑4.0* 💥\n💥 » _𝙀𝙇 𝙂𝙐𝙀𝙍𝙍𝙀𝙍开 𝘿𝙀𝙁𝙄𝙉𝙄𝙏𝙄𝙑𝙊_ « 💥\n\n👋 ¡Hola! Panel de control principal de *Gogeta-Bot* (5,000 Comandos Activos).\n\n╭⚡ ─── [ *𝙋𝘼𝙉𝙀𝙇 𝘿𝙀 𝘾𝙊𝙉𝙏𝙍𝙊𝙇* ] ─── ⚡\n│ 👑 *Creador:* adánzx7\n│ 📱 *Owner:* wa.me/584120299482\n│ 📊 *Comandos:* 5,000 Activos\n╰───────────────────────────⚡\n\n📢 *𝘾𝘼𝙉𝘼𝙇 𝙊𝙁𝙄𝘾𝙄𝘼𝙇 𝘿𝙀 𝙒𝙃𝘼𝙏𝙎𝘼𝙋𝙋*\nhttps://whatsapp.com/channel/0029Vb7OVMwJf05bKntqZx1G\n\n📚 *𝙎𝙐𝘽-𝙈𝙀𝙉𝙐́𝙎 𝘿𝙄𝙎𝙋𝙊𝙉𝙄𝘽𝙇𝙀𝙎:*\n👉 *.menuowner* (150 cmds)\n👉 *.menugrupos* (850 cmds)\n👉 *.menuegos* (1200 cmds)\n👉 *.menudownload* (600 cmds)\n👉 *.menuanime* (500 cmds)\n👉 *.menuia* (200 cmds)\n👉 *.menutools* (500 cmds)\n👉 *.menuaudios* (300 cmds)`;

                // Mensaje interactivo usando ContextInfo para adjuntar el canal del Owner
                await conn.sendMessage(from, {
                    text: txtMenu,
                    contextInfo: {
                        externalAdReply: {
                            title: "📢 ¡ÚNETE AL CANAL OFICIAL AQUÍ!",
                            body: "Desarrollado por adánzx7",
                            sourceUrl: "https://whatsapp.com/channel/0029Vb7OVMwJf05bKntqZx1G",
                            mediaType: 1,
                            renderLargerThumbnail: false
                        }
                    }
                }, { quoted: m });
            }
        } catch (err) {
            console.error(err);
        }
    });
}

startGogetaBot();
