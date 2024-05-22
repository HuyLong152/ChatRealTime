const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const axios = require('axios');
const cors = require('cors');

app.use(cors({
    origin: 'https://huylong.io.vn',
    methods: ["GET", "POST"]
}));

const io = new Server(server, {
    cors: {
        origin: "https://huylong.io.vn",
        methods: ["GET", "POST"],
        credentials: true
    }
});

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
    console.log('User connected: ' + socket.id);
    var room;

    socket.on('join', (data) => {
        room = data;
        socket.join(data);
        console.log(`User ${socket.id} joined room ${data}`);
        axios.get(`https://huylong.io.vn/api_food/public/api/message/${data}`)
            .then(response => {
                // console.log(`Data ${response.data}`);
                socket.emit('history', response.data);
            })
            .catch(error => {
                console.error('Error fetching messages:', error);
            });
    });

    socket.on('message', (message) => {
        console.log(`Message sent to room ${room}: ${message}`);
        io.to(room).emit('thread', message); // gọi đến hàm thread với những client connect đến room tương ứng
        const data = JSON.parse(message);
        axios.post('https://huylong.io.vn/api_food/public/api/message', {
            sender_id: data.sender_id,
            receiver_id:data.receiver_id,
            content: data.content,
            role: data.role
        }).then(response => {
            console.log('Message saved:', response.data);
        }).catch(error => {
            console.error('Error saving message:', error);
        });
    });
});

server.listen(8888, () => {
    console.log("Listening on port 8888");
});
