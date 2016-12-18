# quiz-socketio

An quiz game application using Socket.io .

## How to start

```
$ cd quiz-socketio
$ node dist/server.js
```

Then, open http://127.0.0.1:3001 in your web browser.

## How to build

```
$ npm init
$ npm install --save socket.io
$ npm install --save socket.io-client
    
$ npm install --save typescript typings webpack
$ npm install --save react react-dom redux react-redux redux-thunk object-assign
$ npm install --save-dev ts-loader source-map-loader
$ npm install --save-dev webpack-node-externals
    
$ npm link typescript

$ typings install
$ tsc

$ cd ../client
$ typings install
$ webpack
```

## Typings

```
$ typings install --global --save dt~socket.io
$ typings install --global --save dt~node

$ typings install --global --save dt~react
$ typings install --global --save dt~react-dom
$ typings install --global --save dt~redux
$ typings install --global --save dt~react-redux
$ typings install --global --save dt~redux-thunk
$ typings install --global --save dt~object-assign
```

## TODO

- use History API
- support to change name
