import * as io from "socket.io-client"
import * as React from "react"
import * as ReactDOM from "react-dom"
import * as Redux from "redux"
import thunk from 'redux-thunk'
import { Provider, connect } from 'react-redux'
import { Quiz, Result, MasterControlState, Action, ActionType } from './Models'
import { MasterControl } from './components/MasterControl'
import Config from './Config'

var socket: SocketIOClient.Socket = null

function render(root: Element, store: Redux.Store<MasterControlState>) {
  const App =
    connect((state: MasterControlState) => { return { state: state } })(MasterControl)

  ReactDOM.render(
    <Provider store={store}>
      <App />
    </Provider>,
    root
  )
}
(window as any).MasterApp = {
  init: (root: Element) => {
    const preloadedState: MasterControlState = {
    }
    const store: Redux.Store<MasterControlState> = Redux.createStore(
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
function listenSocket(store: Redux.Store<MasterControlState>) {
  socket = io.connect();

  socket.on('msg', (data: any) => {
    console.log('msg received:', data)
    switch (data.type) {
    }
  })
}
/**
 * QuizReducer
 */
import assign = require('object-assign')

export
  function reducer(state: MasterControlState, action: Action<any>): MasterControlState {
  switch (action.type) {
    case ActionType.MasterOperation:
      const msg = action.payload
      console.log('master operation', msg)
      socket.emit('msg', msg)
      return assign({}, state)
    default:
      return state
  }
}
