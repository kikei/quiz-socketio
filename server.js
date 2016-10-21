var fs = require('fs');
var url = require('url');
var path = require('path');

/**
 * HTTP Server
*/
var app = require('http').createServer(function(req, res) {
  var pathName = url.parse(req.url).pathname;
  if (pathName.indexOf('/public') == 0) {
    var contentType = 'text/html';
    switch (path.extname(pathName)) {
    case '.js':
    case '.map':
      contentType = 'text/javascript';
    }
    fs.readFile('.' + pathName, function(error, content) {
      if (error) {
        res.writeHead(404);
        res.end();
      } else {
        res.writeHead(200, {'Content-Type': contentType});
        res.end(content, 'utf-8');
      }
    });
  } else {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end(fs.readFileSync('client/index.html'));
  }
}).listen(3001);

/**
 * Store of application server
 */
var Client = function(name, socketId) {
  this.name = name;
  this.socketId = socketId;
  this.score = 0;
  this.answer = null;
};
Client.prototype.getSocketId = function() {
  return this.socketId;
};
Client.prototype.setSocketId = function(socketId) {
  this.socketId = socketId;
};
Client.prototype.getScore = function() {
  return this.score;
};
Client.prototype.setScore = function(score) {
  this.score = score;
};
Client.prototype.addScore = function(score) {
  this.score += score;
  return this.score;
};
Client.prototype.getAnswer = function() {
  return this.answer;
};
Client.prototype.setAnswer = function(answer, score) {
  this.answer = { answer: answer, score: score };
};

/**
 * One quiz
 */ 
var Quiz = function(question, choices, score) {
  this.question = question;
  this.choices = choices;
  this.answer = null;
  this.hints = [];
  this.score = 0;
};
Quiz.prototype.setAnswer = function(answer) {
  this.answer = answer;
};
Quiz.prototype.addHint = function(hint) {
  this.hints.push(hint);
};
Quiz.prototype.getScore = function() {
  return this.score;
};
Quiz.prototype.setScore = function(score) {
  this.score = score;
};
Quiz.prototype.isRight = function(answer) {
  return this.answer == answer;
};

/**
 * Global storage
 */
var Store = function() {
  this.state = 'standby';
  this.quiz = {};
  this.clients = {};
};
Store.prototype.reset = function() {
  this.state = 'standby';
  this.quiz = {};
  this.clients = {};
};
Store.prototype.getState = function() {
  return this.state;
};
Store.prototype.setState = function(state) {
  this.state = state;
};
Store.prototype.getCurrentQuiz = function() {
  return this.quiz;
};
Store.prototype.addQuiz = function(quiz) {
  this.quiz = quiz;
};
Store.prototype.getClients = function(name) {
  return this.clients;
};
Store.prototype.getClient = function(name) {
  return this.clients[name];
};
Store.prototype.setClient = function(name, socketId) {
  var client = this.clients[name];
  if (client) {
    client.setSocketId(socketId);
  } else {
    client = new Client(name, socketId);
    this.clients[name] = client;
  }
  return client;
};
  
var store = new Store();

/**
 * Communication on socket
 */
var io = require('socket.io').listen(app);
io.sockets.on('connection', function(socket) {
  socket.on('msg', function(data) {
    console.log('received:', data);
    switch (data.type) {
    case 'register-user':
      var username = data.username
      io.sockets.emit('msg', {
        type: 'register-user',
        username: username,
      })
      break;

    /**
     * Answerer messages
     */
    case 'join':
      /* Add answerer */
      var answerer = data.answerer;
      var socketId = socket.id;
      if (!answerer) {
        console.error('bad message', data);
        break;
      }
      if (!socketId) {
        console.error('failed to get socket id');
        break;
      }
      var anserer = store.setClient(answerer, socketId);
      var state = store.getState();
      switch (state) {
      case 'standby':
        io.sockets.emit('msg', {
          type: 'joined',
          answerer: answerer,
          state: state
        });
        break;
      case 'answer':
        io.sockets.emit('msg', {
          type: 'joined',
          answerer: answerer,
          state: state,
          quiz: store.getCurrentQuiz()
        });
        break;
      }
      break; // case join
    case 'myanswer':
      /* Receive an answer */
      var answerer = data.anserer;
      var answer = data.answer;
      if (!answerer || (!answer && answer != 0)) {
        console.error('bad data', answer);
        break;
      }
      var score = quiz.getScore();
      var client = store.getClient(answerer);
      client.setAnswer(answer, score);
      break; // case myanswer

    /**
     * Master messages
     */
    case 'reset':
      /* Reset all stores */
      store.reset();
      break; // case reset
      
    case 'question':
      /* Ask a question */
      store.setState('question');
      var question = data.question;
      var choices = data.choices;
      var score = data.score;
      if (!question || !choices || (!score && score != 0)) {
        console.error('bad data', data);
        break;
      }
      store.addQuiz(new Quiz(question, choices, score));
      io.sockets.emit('msg', {
        type: 'question',
        quiz: { 'question': question }
      });
      break; // case question
      
    case 'hint':
      /* Add hint */
      var hint = data.hint;
      var score = data.score;
      if (!hint || (!score && score != 0)) {
        console.error('bad data', data);
        break;
      }
      var quiz = store.getCurrentQuiz();
      if (!quiz) {
        console.error('set quiz');
        break;
      }
      quiz.addHint(hint);
      io.sockets.emit('msg', {
        type: 'hint',
        hint: hint
      });
      break; // case hint
      
    case 'answer':
      /* Show answer */
      store.setState('answer');
      var answer = data.answer;
      if (!answer && answer != 0) {
        console.error('bad data', answer);
        break;
      }
      var quiz = store.getCurrentQuiz();
      if (!quiz) {
        console.error('set quiz');
        break;
      }
      quiz.setAnswer(answer);

      for (var answerer in store.getClients()) {
        var client = store.getClient(answerer);
        var a = client.getAnswer();
        if (!a) continue;
        var right = quiz.isRight(a.answer);
        var score = client.addScore(right ? a.score : 0);
        var scoketId = client.getSocketId();
        io.sockets.socket(socketId).emit('msg', {
          type: 'result',
          result: right,
          score: score
        });
      }
      break; // case answer
      
    case 'end':
      /* End game */
      store.setState('end');
      io.sockets.emit('msg', {
        type: 'end'
      })
    }
  });
});
