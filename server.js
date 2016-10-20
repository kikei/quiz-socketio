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
 * Communication
 */
var io = require('socket.io').listen(app);
io.sockets.on('connection', function(socket) {
  socket.on('msg', function(data) {
    console.log('receive:', data);
    switch (data.type) {
    case 'register-user':
      var username = data.username
      io.sockets.emit('msg', { 'type': 'register-user',
                               'username': username,
                             })
      break;
    }
  });
});
