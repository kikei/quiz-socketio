import fs = require('fs')
import url = require('url')
import path = require('path')
import http = require('http')

import { Answer, Client, Quiz, State, Store } from './Models'
import * as View from './View'

/**
 * HTTP Server
 */
const port = process.env.PORT || 3001

const app = http.createServer((req: http.ServerRequest, res: http.ServerResponse) => {
    const pathName = url.parse(req.url).pathname
    if (pathName.indexOf('/public') == 0) {
        var contentType = 'text/html'
        switch (path.extname(pathName)) {
            case '.js':
            case '.map':
                contentType = 'text/javascript'
                break
            case '.css':
                contentType = 'text/css'
                break
        }
        fs.readFile('.' + pathName, (error, content) => {
            if (error) {
                res.writeHead(404)
                res.end()
            } else {
                res.writeHead(200, { 'Content-Type': contentType })
                res.end(content, 'utf-8')
            }
        })
    } else if (pathName.indexOf('/master') == 0) {
        res.writeHead(200, { 'Content-Type': 'text/html' })
        res.end(fs.readFileSync('client/master.html'))
    } else if (pathName.indexOf('/ranking') == 0) {
        const content = View.getRanking(store)
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify(content), 'utf-8')
    } else {
        res.writeHead(200, { 'Content-Type': 'text/html' })
        res.end(fs.readFileSync('client/index.html'))
    }
})
const server = app.listen(port, '0.0.0.0')

const store = new Store();

/**
 * Communication on socket
 */
// import * as sio from "socket.io"
import sio = require('socket.io')
var io = sio.listen(app)

io.sockets.on('connection', function (socket) {

    console.log('connected', socket.id)

    socket.on('msg', function (data: any) {
        console.log('received:', data)
        switch (data.type) {
            /**
             * Answerer messages
             */
            case 'join': {
                /* Add answerer */
                const answerer = data.answerer
                const socketId = socket.id
                if (!answerer) {
                    console.error('bad message', data)
                    break;
                }
                if (!socketId) {
                    console.error('failed to get socket id');
                    break;
                }
                console.log('joined', answerer, socketId);
                const client = store.addClient(answerer, socketId);
                const state = store.state
                switch (state) {
                    case State.StandBy:
                    case State.Answer: {
                        const socket = io.sockets.connected[socketId]
                        if (socket)
                            socket.emit('msg', {
                                type: 'joined',
                                answerer: client.answerer,
                                state: 'standby',
                                cumulativeScore: client.cumulativeScore
                            })
                        break
                    }
                    case State.Question: {
                        const socket = io.sockets.connected[socketId]
                        if (socket)
                            socket.emit('msg', {
                                type: 'joined',
                                answerer: client.answerer,
                                state: client.hasAnswer() ? 'answered' : 'question',
                                quiz: store.currentQuiz,
                                cumulativeScore: client.cumulativeScore,
                            })
                        break
                    }
                }
                break // case join
            }
            case 'myanswer': {
                /* Receive an answer */
                const answerer: string = data.answerer
                const answer: number = data.answer
                if (!answerer || (!answer && answer != 0)) {
                    console.error('bad data', data)
                    break
                }
                var quiz: Quiz = store.currentQuiz
                console.log('myanswer', quiz)
                var score: number = quiz.score
                var client: Client = store.getClientByName(answerer)
                client.answer = new Answer(answer, score, Date.now())
                break // case myanswer
            }
            /**
             * Master messages
             */
            case 'reset': {
                /* Reset all stores */
                store.reset()
                io.sockets.emit('msg', {
                    type: 'reset'
                })
                console.log('reseted')
                break // case reset
            }
            case 'question': {
                /* Ask a question */
                store.state = State.Question
                var question: string = data.question
                var choiceType: string = data.choiceType
                var choices: string[] = data.choices
                var score: number = data.score;
                if (!question || !choices || (!score && score != 0)) {
                    console.error('bad data', data)
                    break
                }
                var quiz: Quiz = new Quiz(question, choiceType, choices, score)
                store.currentQuiz = quiz
                io.sockets.emit('msg', {
                    type: 'question',
                    quiz: quiz
                })
                break // case question
            }
            case 'hint': {
                /* Add hint */
                var hint: string = data.hint;
                var newScore: number = data.score;
                if (!hint || (!newScore && newScore != 0)) {
                    console.error('bad data', data)
                    break
                }
                var quiz = store.currentQuiz
                if (!quiz) {
                    console.error('set quiz');
                    break
                }
                quiz.addHint(hint)
                quiz.score = newScore
                io.sockets.emit('msg', {
                    type: 'hint',
                    hint: hint,
                    score: score
                })
                break // case hint
            }
            case 'timeout': {
                /* Timeout */
                for (var answerer in store.clients) {
                    const client = store.getClientByName(answerer)
                    if (client.hasAnswer())
                        continue
                    const socketId = client.socketId
                    const socket = io.sockets.connected[socketId]
                    if (socket)
                        socket.emit('msg', {
                            type: 'timeout'
                        })
                }
                break
            }
            case 'answer': {
                /* Show answer */
                store.state = State.Answer
                var answer: number = data.answer
                if (!answer && answer != 0) {
                    console.error('bad data', answer)
                    break
                }
                var quiz = store.currentQuiz
                if (!quiz) {
                    console.error('set quiz')
                    break
                }
                quiz.rightChoice = answer

                const now: number = Date.now()

                /* For ranking by score */
                const ranks: {
                    client: Client
                    right: boolean
                    score: number
                    cumulativeScore: number
                    thinkedTime: number
                }[] = []

                for (var answerer in store.clients) {
                    const client = store.getClientByName(answerer)

                    var right: boolean = false
                    var score: number = 0
                    var delay: number = 0
                    if (client.hasAnswer()) {
                        const a = client.answer
                        right = quiz.isRight(a.answer)
                        score = right ? a.score : 0
                        delay = now - a.date
                    }
                    client.clearAnswer();
                    const cumulativeScore = client.addScore(score)
                    const thinkedTime = client.addThinkedTime(delay)
                    ranks.push({
                        client: client,
                        right: right,
                        score: score,
                        cumulativeScore: cumulativeScore,
                        thinkedTime: thinkedTime
                    })
                }
                ranks.sort((a, b) => {
                    if (a.cumulativeScore > b.cumulativeScore) return -1
                    if (a.cumulativeScore < b.cumulativeScore) return +1
                    return b.thinkedTime - a.thinkedTime
                })
                for (var i = 0; i < ranks.length; i++) {
                    const { client, right, score, cumulativeScore } = ranks[i]
                    const socketId = client.socketId
                    console.log('send result to', socketId, 'rank:', i)
                    const socket = io.sockets.connected[socketId]
                    if (socket)
                        socket.emit('msg', {
                            type: 'result',
                            right: right,
                            answer: quiz.showAnswer(),
                            score: score,
                            cumulativeScore: cumulativeScore,
                            rank: i
                        })
                }
                break // case answer
            }
            case 'end': {
                /* End game */
                store.state = State.End
                io.sockets.emit('msg', {
                    type: 'end'
                })
                break // case end
            }
        }
    })
})
