"use strict";
var fs = require('fs');
var url = require('url');
var path = require('path');
var http = require('http');
var Models_1 = require('./Models');
var View = require('./View');
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
    else if (pathName.indexOf('/master') == 0) {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(fs.readFileSync('client/master.html'));
    }
    else if (pathName.indexOf('/ranking') == 0) {
        var content = View.getRanking(store);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(content), 'utf-8');
    }
    else {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(fs.readFileSync('client/index.html'));
    }
});
var server = app.listen(port, '0.0.0.0');
var store = new Models_1.Store();
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
                    case Models_1.State.StandBy:
                    case Models_1.State.Answer:
                    case Models_1.State.Timeout: {
                        var socket_1 = io.sockets.connected[socketId];
                        if (socket_1)
                            socket_1.emit('msg', {
                                type: 'joined',
                                answerer: client_1.answerer,
                                state: 'standby',
                                cumulativeScore: client_1.cumulativeScore
                            });
                        break;
                    }
                    case Models_1.State.Question: {
                        var socket_2 = io.sockets.connected[socketId];
                        if (socket_2)
                            socket_2.emit('msg', {
                                type: 'joined',
                                answerer: client_1.answerer,
                                state: client_1.hasAnswer() ? 'answered' : 'question',
                                quiz: store.currentQuiz,
                                cumulativeScore: client_1.cumulativeScore,
                            });
                        break;
                    }
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
                client.answer = new Models_1.Answer(answer_1, score, Date.now());
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
                store.state = Models_1.State.Question;
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
                store.state = Models_1.State.Timeout;
                for (var answerer in store.clients) {
                    var client_2 = store.getClientByName(answerer);
                    if (client_2.hasAnswer())
                        continue;
                    var socketId = client_2.socketId;
                    var socket_3 = io.sockets.connected[socketId];
                    if (socket_3)
                        socket_3.emit('msg', {
                            type: 'timeout'
                        });
                }
                break;
            }
            case 'answer': {
                /* Show answer */
                store.state = Models_1.State.Answer;
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
                var now = Date.now();
                /* For ranking by score */
                var ranks = [];
                for (var answerer in store.clients) {
                    var client_3 = store.getClientByName(answerer);
                    var right = false;
                    var score = 0;
                    var delay = 0;
                    if (client_3.hasAnswer()) {
                        var a = client_3.answer;
                        right = quiz.isRight(a.answer);
                        score = right ? a.score : 0;
                        delay = now - a.date;
                    }
                    client_3.clearAnswer();
                    var cumulativeScore = client_3.addScore(score);
                    var thinkedTime = client_3.addThinkedTime(delay);
                    ranks.push({
                        client: client_3,
                        right: right,
                        score: score,
                        cumulativeScore: cumulativeScore,
                        thinkedTime: thinkedTime
                    });
                }
                ranks.sort(function (a, b) {
                    if (a.cumulativeScore > b.cumulativeScore)
                        return -1;
                    if (a.cumulativeScore < b.cumulativeScore)
                        return +1;
                    return b.thinkedTime - a.thinkedTime;
                });
                for (var i = 0; i < ranks.length; i++) {
                    var _a = ranks[i], client_4 = _a.client, right_1 = _a.right, score_1 = _a.score, cumulativeScore = _a.cumulativeScore;
                    var socketId = client_4.socketId;
                    console.log('send result to', socketId, 'rank:', i);
                    var socket_4 = io.sockets.connected[socketId];
                    if (socket_4)
                        socket_4.emit('msg', {
                            type: 'result',
                            right: right_1,
                            answer: quiz.showAnswer(),
                            score: score_1,
                            cumulativeScore: cumulativeScore,
                            rank: i
                        });
                }
                break; // case answer
            }
            case 'end': {
                /* End game */
                store.state = Models_1.State.End;
                io.sockets.emit('msg', {
                    type: 'end'
                });
                break; // case end
            }
        }
    });
});
//# sourceMappingURL=server.js.map