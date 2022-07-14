let express = require('express');
let cookieParser = require('cookie-parser');
let logger = require('morgan');
// cors 이슈 해결을 위한 cors 패키지 추가.
const cors = require('cors');


// express 패키지를 변수에 담음 → REST API 작성 가능 (그 중에서도 HTTP 4가지 메소드를 통해 URL에 접근할 수 있게 해줌)
let app = express();

// app.use ~~ = 미들웨어 사용
app.use(logger('dev'));

app.use(express.json());

app.use(express.urlencoded({ extended: false }));

app.use(cookieParser());

app.use(cors());

// TODO : URL 추가시 해당 아래에 route 추가!

const indexRouter = require('../src/routes');
const usersRouter = require('../src/routes/users');
const busRouter = require('../src/routes/bus');

app.use('/', indexRouter);
app.use('/', usersRouter);
app.use('/',busRouter);

let debug = require('debug')('nodetemplate:server');

/*
/!**
 * Event listener for HTTP server "error" event.
 *!/

function onError(error) {
    if (error.syscall !== 'listen') {
        throw error;
    }

    var bind = typeof port === 'string'
        ? 'Pipe ' + port
        : 'Port ' + port;

    // handle specific listen errors with friendly messages
    switch (error.code) {
        case 'EACCES':
            console.error(bind + ' requires elevated privileges');
            process.exit(1);
            break;
        case 'EADDRINUSE':
            console.error(bind + ' is already in use');
            process.exit(1);
            break;
        default:
            throw error;
    }
}

/!**
 * Event listener for HTTP server "listening" event.
 *!/

function onListening() {
    var addr = server.address();
    var bind = typeof addr === 'string'
        ? 'pipe ' + addr
        : 'port ' + addr.port;
    debug('Listening on ' + bind);
}*/

module.exports = app;
