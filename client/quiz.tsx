import * as io from "socket.io-client"
import * as React from "react"
import * as ReactDOM from "react-dom"
import * as Redux from "redux"
import thunk from 'redux-thunk'
import { Provider, connect } from 'react-redux'
import { Quiz, QuizBoxState, Mode, Action, ActionType } from './Models'
import { QuizBox } from './components/QuizBox'

var socket: SocketIOClient.Socket = null

function render(root: Element, store: Redux.Store<QuizBoxState>) {
  const App = 
    connect((state: QuizBoxState) => { return { state: state } })(QuizBox)

  ReactDOM.render(
    <Provider store={store}>
      <App />
    </Provider>,
    root
  )
}
(window as any).QuizApp = {
  init: (root: Element) => {
    const preloadedState: QuizBoxState = {
      hello: 'Hello!',
      username: '',
      mode: Mode.InputName
    }
    const store: Redux.Store<QuizBoxState> = Redux.createStore(
      reducer,
      preloadedState,
      Redux.applyMiddleware(thunk)
    )

    listenSocket(store)
    
    render(root, store)
  }
}

/**
 * socket listener
 */
function listenSocket(store: Redux.Store<QuizBoxState>) {
  socket = io.connect();

  socket.on('msg', (data: any) => {
    console.log('msg received:', data)
    switch (data.type) {
      case 'register-user':
        const username = data.username
        console.log('usename is ' + username)
        store.dispatch({
          type: ActionType.ChangeMode,
          payload: Mode.Wait
        })
        break
    }
  })
}
/**
 * QuizReducer
 */
import assign = require('object-assign')

export
function reducer(state: QuizBoxState, action: Action<any>): QuizBoxState {
  switch (action.type) {
    case ActionType.ChangeName:
      return assign({}, state, {
        username: (action as Action<string>).payload
      })
    case ActionType.SubmitName:
      const username = (action as Action<string>).payload
      socket.emit('msg', { type: 'register-user', username: username })
      return assign({}, state)
    case ActionType.ChangeMode:
      const nextmode = (action as Action<string>).payload
      console.log('change mode:', nextmode)
      return assign({}, state, { mode: nextmode })
    default:
      return state
  }
}
