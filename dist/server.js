"use strict";
var fs = require('fs');
var url = require('url');
var path = require('path');
var http = require('http');
var Models_1 = require('./Models');
/**
 * HTTP Server
 */
var port = process.env.PORT || 3001;
var app = http.createServer(function (req, res) {
    var pathName = url.parse(req.url).pathname;
    if (pathName.indexOf('/public') == 0) {
        var contentType = 'text/html';
        switch (path.extname(pathName)) {
            case '.js':
            case '.map':
                contentType = 'text/javascript';
                break;
            case '.css':
                contentType = 'text/css';
                break;
        }
        fs.readFile('.' + pathName, function (error, content) {
            if (error) {
                res.writeHead(404);
                res.end();
            }
            else {
                res.writeHead(200, { 'Content-Type': contentType });
                res.end(content, 'utf-8');
            }
        });
    }
    else {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(fs.readFileSync('client/index.html'));
    }
});
var server = app.listen(port, '0.0.0.0');
/**
 * Store of application server
 */
var Answer = (function () {
    function Answer(answer, score) {
        this.answer = answer;
        this.score = score;
    }
    return Answer;
}());
exports.Answer = Answer;
var Client = (function () {
    function Client(answerer, socketId) {
        this.answerer = answerer;
        this.socketId = socketId;
        this.cumulativeScore = 0;
        this.answer = null;
    }
    Client.prototype.addScore = function (score) {
        this.cumulativeScore += score;
        return this.cumulativeScore;
    };
    Client.prototype.hasAnswer = function () {
        return !!this.answer;
    };
    Client.prototype.clearAnswer = function () {
        this.answer = null;
    };
    return Client;
}());
exports.Client = Client;
/**
 * Global storage
 */
var State;
(function (State) {
    State[State["StandBy"] = 0] = "StandBy";
    State[State["Question"] = 1] = "Question";
    State[State["Answer"] = 2] = "Answer";
    State[State["End"] = 3] = "End";
})(State || (State = {}));
var Store = (function () {
    function Store() {
        this.state = State.StandBy;
        this.currentQuiz = null;
        this.clients = {};
    }
    Store.prototype.reset = function () {
        this.state = State.StandBy;
        this.currentQuiz = null;
        this.clients = {};
    };
    Store.prototype.getClientByName = function (name) {
        return this.clients[name];
    };
    Store.prototype.addClient = function (answerer, socketId) {
        var client = this.clients[answerer];
        if (client) {
            client.socketId = socketId;
        }
        else {
            client = new Client(answerer, socketId);
            this.clients[answerer] = client;
        }
        return client;
    };
    return Store;
}());
exports.Store = Store;
var store = new Store();
/**
 * Communication on socket
 */
// import * as sio from "socket.io"
var sio = require('socket.io');
var io = sio.listen(app);
io.sockets.on('connection', function (socket) {
    console.log('connected', socket.id);
    socket.on('msg', function (data) {
        console.log('received:', data);
        switch (data.type) {
            /**
             * Answerer messages
             */
            case 'join': {
                /* Add answerer */
                var answerer_1 = data.answerer;
                var socketId = socket.id;
                if (!answerer_1) {
                    console.error('bad message', data);
                    break;
                }
                if (!socketId) {
                    console.error('failed to get socket id');
                    break;
                }
                console.log('joined', answerer_1, socketId);
                var client_1 = store.addClient(answerer_1, socketId);
                var state = store.state;
                switch (state) {
                    case State.StandBy:
                    case State.Answer:
                        io.sockets.connected[socketId].emit('msg', {
                            type: 'joined',
                            answerer: client_1.answerer,
                            state: 'standby',
                            cumulativeScore: client_1.cumulativeScore
                        });
                        break;
                    case State.Question:
                        io.sockets.connected[socketId].emit('msg', {
                            type: 'joined',
                            answerer: client_1.answerer,
                            state: client_1.hasAnswer() ? 'answered' : 'question',
                            quiz: store.currentQuiz,
                            cumulativeScore: client_1.cumulativeScore,
                        });
                        break;
                }
                break; // case join
            }
            case 'myanswer': {
                /* Receive an answer */
                var answerer_2 = data.answerer;
                var answer_1 = data.answer;
                if (!answerer_2 || (!answer_1 && answer_1 != 0)) {
                    console.error('bad data', data);
                    break;
                }
                var quiz = store.currentQuiz;
                console.log('myanswer', quiz);
                var score = quiz.score;
                var client = store.getClientByName(answerer_2);
                client.answer = new Answer(answer_1, score);
                break; // case myanswer
            }
            /**
             * Master messages
             */
            case 'reset': {
                /* Reset all stores */
                store.reset();
                io.sockets.emit('msg', {
                    type: 'reset'
                });
                console.log('reseted');
                break; // case reset
            }
            case 'question': {
                /* Ask a question */
                store.state = State.Question;
                var question = data.question;
                var choiceType = data.choiceType;
                var choices = data.choices;
                var score = data.score;
                if (!question || !choices || (!score && score != 0)) {
                    console.error('bad data', data);
                    break;
                }
                var quiz = new Models_1.Quiz(question, choiceType, choices, score);
                store.currentQuiz = quiz;
                io.sockets.emit('msg', {
                    type: 'question',
                    quiz: quiz
                });
                break; // case question
            }
            case 'hint': {
                /* Add hint */
                var hint = data.hint;
                var newScore = data.score;
                if (!hint || (!newScore && newScore != 0)) {
                    console.error('bad data', data);
                    break;
                }
                var quiz = store.currentQuiz;
                if (!quiz) {
                    console.error('set quiz');
                    break;
                }
                quiz.addHint(hint);
                quiz.score = newScore;
                io.sockets.emit('msg', {
                    type: 'hint',
                    hint: hint,
                    score: score
                });
                break; // case hint
            }
            case 'timeout': {
                /* Timeout */
                for (var answerer in store.clients) {
                    var client_2 = store.getClientByName(answerer);
                    if (client_2.hasAnswer())
                        continue;
                    var socketId = client_2.socketId;
                    io.sockets.connected[socketId].emit('msg', {
                        type: 'timeout'
                    });
                }
                break;
            }
            case 'answer': {
                /* Show answer */
                store.state = State.Answer;
                var answer = data.answer;
                if (!answer && answer != 0) {
                    console.error('bad data', answer);
                    break;
                }
                var quiz = store.currentQuiz;
                if (!quiz) {
                    console.error('set quiz');
                    break;
                }
                quiz.rightChoice = answer;
                for (var answerer in store.clients) {
                    var client_3 = store.getClientByName(answerer);
                    var right = false;
                    var score = 0;
                    if (client_3.hasAnswer()) {
                        var a = client_3.answer;
                        right = quiz.isRight(a.answer);
                        score = right ? a.score : 0;
                    }
                    client_3.clearAnswer();
                    var cumulativeScore = client_3.addScore(score);
                    var socketId = client_3.socketId;
                    console.log('send result to', socketId);
                    io.sockets.connected[socketId].emit('msg', {
                        type: 'result',
                        right: right,
                        answer: quiz.showAnswer(),
                        score: score,
                        cumulativeScore: cumulativeScore
                    });
                }
                break; // case answer
            }
            case 'end': {
                /* End game */
                store.state = State.End;
                io.sockets.emit('msg', {
                    type: 'end'
                });
                break; // case end
            }
        }
    });
});
//# sourceMappingURL=server.js.map