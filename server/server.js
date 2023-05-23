const express = require('express');
const session = require('express-session')
const axios = require('axios');
const cors = require('cors');
const http = require('http');


const app = express();
const APIKEY = 'JjVlY73BHixISg';

const server = http.createServer(app);

const io = require('socket.io')(server, {
    cors: {
      origin: ['http://localhost:3000', 'http://localhost:3001'],
      methods: ['GET', 'POST'], 
      allowedHeaders: ['Content-Type', 'Authorization'], 
      credentials: true
    }
});

app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    methods: ['GET', 'POST'], 
    allowedHeaders: ['Content-Type', 'Authorization'], 
    credentials: true
}))

app.use(session({
    secret: 'mouse',
    resave: false,
    saveUninitialized: false,
}))

const sessionMiddleWare = session({
    secret: 'mouse', 
    resave: false,
    saveUninitialized: false,
})

io.use((socket, next) => {
    sessionMiddleWare(socket.request, {}, next)
})
io.on('connection', (socket) => {

    socket.on('create-private-room', (data) => {
        const { players, roomName, rounds, customWords, drawTime } = data;
        const existing = io.sockets.adapter.rooms.get(roomName);
        if(existing){
            socket.emit('create-room-status', {
                message: 'failed',
            })
        }else{
            socket.join(roomName);

            io.sockets.adapter.rooms.get(roomName).max = players;
            io.sockets.adapter.rooms.get(roomName).names = [];
            io.sockets.adapter.rooms.get(roomName).rounds = rounds;
            io.sockets.adapter.rooms.get(roomName).customWords = customWords;
            io.sockets.adapter.rooms.get(roomName).time = drawTime;

            socket.request.session.info = data;
            socket.emit('create-room-status', {
                message: 'successful'
            });
        }
    })

    socket.on('join-room', (data) => {
        const existing = io.sockets.adapter.rooms;
        const room = existing.get(data.roomName);
        if(room && room.size+1 <= parseInt(room.max)+1){
            socket.join(data.roomName);
            io.sockets.adapter.rooms.get(data.roomName).names = 
            [...io.sockets.adapter.rooms.get(data.roomName).names, [data.name, socket.id]]
        }
        socket.emit('join-room-status', {
            message: ((room && room.size <= parseInt(room.max)) ? 'successful' : 'failed')
        })
    })

    socket.on('initial-commit', ({roomName, message}) => {
        if(message === 'initial commit') {
            io.to(roomName.slice(1, -1)).emit('name-check', {
                users: 
                    io.sockets.adapter.rooms.get(roomName.slice(1, roomName.length-1)).names,
                time: 
                    io.sockets.adapter.rooms.get(roomName.slice(1, -1)).time,
                rounds:
                    io.sockets.adapter.rooms.get(roomName.slice(1,-1)).rounds,
            })
        }
    });

    socket.on('start-game', ({roomName}) => {
        const order = (ids = [...io.sockets.adapter.rooms.get(roomName).names]) => {
            let res = [];
            for(let i=0; i<ids.length; i++){
                let rand = Math.floor(Math.random() * ids.length);
                if(!res.includes(ids[rand])){
                    res.push(ids[rand])
                }else{
                    i--
                }
            }
            return res;
        }
        io.to(roomName).emit('start-game', {
            ids: [...io.sockets.adapter.rooms.get(roomName).names],
            order: order(),
        })
    })

    socket.on('drawing', (data) => {
        io.to(data.roomName).emit('receive-art', data);
    })

    socket.on('guess', ({res, cur, roomName, name}) => {
        let check = false;
        let n = [];
        let p;
        let data;
        if(res.toLowerCase() === cur.toLowerCase()){
            check = true;
            n = [name];
            p = io.sockets.adapter.rooms.get(roomName).names
        }
        (check ? data = {message: check, n: n, p: p} : data = {message: res})
        io.to(roomName).emit('guess', data);
    })

    socket.on('current-word', ({cur, roomName}) => {
        io.to(roomName).emit('current-word', {
            cur: cur
        })
    })

    socket.on('timer', (data) => {
        io.to(data.roomName).emit('timer', data)
    })

    socket.on('round-end', ({message, roomName}) => {
        io.to(roomName).emit('round-start', {
            message: 'round begins',
        })
    })
})


app.get('/get-avatar', async (request, response) => {
    const img = ['db9c9f1667f52cb83c', '9b3a4f447ef9aa2913', '2b6f37ee6163f28c3c', 'e1c5304d9fc9661073', 
                 'c2219582b12cdb455e', 'f45fa527d9e6dbf61a', '5e6cff131e6fb1eaa7', '69fb4f2767b1328407']
    const requests = img.map((ele) => {
        let url = `https://api.multiavatar.com/${JSON.stringify(ele)}?apikey=${APIKEY}`;
        return axios.get(url, {
            withCredentials: true,
        })
    });
    try {
        const responses = await Promise.all(requests);
        const ans = responses.map((res) => res.data);
        response.send(ans);
    } catch (err) {
        console.log(err.message);
    }
})

server.listen(3001, () => {
    console.log('server running on port 3001');
})
