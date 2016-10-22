import fs = require('fs')
import url = require('url')
import path = require('path')
import http = require('http')

/**
 * HTTP Server
 */
const app = http.createServer((req: http.ServerRequest, res: http.ServerResponse) => {
  const pathName = url.parse(req.url).pathname
  if (pathName.indexOf('/public') == 0) {
    var contentType = 'text/html'
    switch (path.extname(pathName)) {
      case '.js':
      case '.map':
        contentType = 'text/javascript'
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
  } else {
    res.writeHead(200, { 'Content-Type': 'text/html' })
    res.end(fs.readFileSync('client/index.html'))
  }
}).listen(3001)

/**
 * Store of application server
 */
export class Answer {
  answer: number
  score: number
  constructor(answer: number, score: number) {
    this.answer = answer
    this.score = score
  }
}

export class Client {
  public answerer: string
  public socketId: string
  public cumulativeScore: number
  public answer: Answer
  constructor(answerer: string, socketId: string) {
    this.answerer = answerer
    this.socketId = socketId
    this.cumulativeScore = 0
    this.answer = null
  }
  public addScore(score: number) {
    this.cumulativeScore += score
    return this.cumulativeScore
  }
}

/**
 * One quiz
 */
export class Quiz {
  public question: string
  public choices: string[]
  public rightChoice: number
  public score: number
  public hints: string[]
  constructor(question: string, choices: string[], score: number) {
    this.question = question
    this.choices = choices
    this.rightChoice = -1
    this.score = 0
    this.hints = []
  }
  public showAnswer(): string {
    return this.choices[this.rightChoice]
  }
  public addHint(hint: string): void {
    this.hints.push(hint)
  }
  public isRight(answer: number): boolean {
    return this.rightChoice == answer
  }
}


/**
 * Global storage
 */
enum State {
  StandBy,
  Question,
  Answer,
  End
}

export class Store {
  state: State
  currentQuiz: Quiz
  clients: { [answerer: string]: Client }
  constructor() {
    this.state = State.StandBy
    this.currentQuiz = null
    this.clients = {}
  }
  public reset() {
    this.state = State.StandBy
    this.currentQuiz = null
    this.clients = {}
  }
  public getClientByName(name: string) {
    return this.clients[name];
  }
  public addClient(answerer: string, socketId: string) {
    var client: Client = this.clients[answerer]
    if (client) {
      client.socketId = socketId
    } else {
      client = new Client(answerer, socketId)
      this.clients[answerer] = client
    }
    return client
  }
}

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
            io.sockets.connected[socketId].emit('msg', {
              type: 'joined',
              answerer: client.answerer,
              state: 'standby'
            })
            break
          case State.Question:
            io.sockets.connected[socketId].emit('msg', {
              type: 'joined',
              answerer: client.answerer,
              state: 'question',
              quiz: store.currentQuiz
            })
            break
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
        var score: number = quiz.score
        var client: Client = store.getClientByName(answerer)
        client.answer = new Answer(answer, score)
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
        var choices: string[] = data.choices
        var score: number = data.score;
        if (!question || !choices || (!score && score != 0)) {
          console.error('bad data', data)
          break
        }
        var quiz: Quiz = new Quiz(question, choices, score)
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

        for (var answerer in store.clients) {
          var client = store.getClientByName(answerer)
          var a = client.answer
          if (!a) {
            console.log('not answered', client)
            continue;
          }
          var right = quiz.isRight(a.answer)
          var score = client.addScore(right ? a.score : 0)
          var socketId = client.socketId
          console.log('send result to', socketId)
          io.sockets.connected[socketId].emit('msg', {
            type: 'result',
            right: right,
            answer: quiz.showAnswer(),
            score: score
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