const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');

const server = http.createServer((req, res) => {
    let filePath = '.' + req.url;
    if (filePath === './') filePath = './page6.html'; // по умолчанию открываем page6
    
    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404);
            res.end('File not found');
        } else {
            res.writeHead(200, { 'Content-Type': 'text/html; charset=UTF-8' });
            res.end(data);
        }
    });
});

const wss = new WebSocket.Server({ server });

let currentTask = {
    topic: "Ожидание задания...",
    encrypted: "********"
};

wss.on('connection', (ws) => {
    console.log('✅ Клиент подключился');
    
    // Отправляем текущее задание новому клиенту
    ws.send(JSON.stringify({
        type: 'current_task',
        ...currentTask
    }));
    
    ws.on('message', (data) => {
        try {
            const message = JSON.parse(data);
            console.log('📩 Получено:', message);
            
            if (message.type === 'new_task') {
                // Обновляем задание
                currentTask = {
                    topic: message.topic,
                    encrypted: message.encrypted
                };
                
                // Рассылаем ВСЕМ подключенным клиентам (page7)
                wss.clients.forEach(client => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({
                            type: 'new_task',
                            ...currentTask
                        }));
                    }
                });
                console.log('📤 Разослано всем дешифровщикам');
            }
        } catch (e) {
            console.log('Ошибка:', e);
        }
    });
});

server.listen(3000, () => {
    console.log('🚀 Сервер запущен на http://localhost:3000');
    console.log('📁 page6.html - шифровальщики');
    console.log('📁 page7.html - дешифровщики');
});