"use strict";
var fs = require('fs');
var url = require('url');
var path = require('path');
var http = require('http');
/**
 * HTTP Server
 */
var app = http.createServer(function (req, res) {
    var pathName = url.parse(req.url).pathname;
    if (pathName.indexOf('/public') == 0) {
        var contentType = 'text/html';
        switch (path.extname(pathName)) {
            case '.js':
            case '.map':
                contentType = 'text/javascript';
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
}).listen(3001);
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
    return Client;
}());
exports.Client = Client;
/**
 * One quiz
 */
var Quiz = (function () {
    function Quiz(question, choices, score) {
        this.question = question;
        this.choices = choices;
        this.rightChoice = -1;
        this.score = 0;
        this.hints = [];
    }
    Quiz.prototype.showAnswer = function () {
        return this.choices[this.rightChoice];
    };
    Quiz.prototype.addHint = function (hint) {
        this.hints.push(hint);
    };
    Quiz.prototype.isRight = function (answer) {
        return this.rightChoice == answer;
    };
    return Quiz;
}());
exports.Quiz = Quiz;
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
                var socketId_1 = socket.id;
                if (!answerer_1) {
                    console.error('bad message', data);
                    break;
                }
                if (!socketId_1) {
                    console.error('failed to get socket id');
                    break;
                }
                console.log('joined', answerer_1, socketId_1);
                var client_1 = store.addClient(answerer_1, socketId_1);
                var state = store.state;
                switch (state) {
                    case State.StandBy:
                        io.sockets.connected[socketId_1].emit('msg', {
                            type: 'joined',
                            answerer: client_1.answerer,
                            state: 'standby'
                        });
                        break;
                    case State.Question:
                        io.sockets.connected[socketId_1].emit('msg', {
                            type: 'joined',
                            answerer: client_1.answerer,
                            state: 'question',
                            quiz: store.currentQuiz
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
                var choices = data.choices;
                var score = data.score;
                if (!question || !choices || (!score && score != 0)) {
                    console.error('bad data', data);
                    break;
                }
                var quiz = new Quiz(question, choices, score);
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
                    var client = store.getClientByName(answerer);
                    var a = client.answer;
                    if (!a) {
                        console.log('not answered', client);
                        continue;
                    }
                    var right = quiz.isRight(a.answer);
                    var score = client.addScore(right ? a.score : 0);
                    var socketId = client.socketId;
                    console.log('send result to', socketId);
                    io.sockets.connected[socketId].emit('msg', {
                        type: 'result',
                        right: right,
                        answer: quiz.showAnswer(),
                        score: score
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