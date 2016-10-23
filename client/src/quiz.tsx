import * as io from "socket.io-client"
import * as React from "react"
import * as ReactDOM from "react-dom"
import * as Redux from "redux"
import thunk from 'redux-thunk'
import { Provider, connect } from 'react-redux'
import { Quiz, Result, QuizBoxState, AppState, Action, ActionType } from './Models'
import { QuizBox } from './components/QuizBox'
import Config from './Config'

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
      myname: '',
      appState: AppState.InputName,
      quiz: null,
      result: null,
      cumulativeScore: 0,
      masterMode: false
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
      case 'reset':
        store.dispatch({
          type: ActionType.ChangeAppState,
          payload: AppState.InputName
        })
        break;
      case 'joined':
        const answerer = data.answerer
        const state = data.state
        switch (state) {
          case 'standby':
            store.dispatch({
              type: ActionType.SetCumulativeScore,
              payload: data.cumulativeScore
            })
            store.dispatch({
              type: ActionType.ChangeAppState,
              payload: AppState.StandBy
            })
            break;
          case 'question':
          case 'answered':
            const quiz = new Quiz(data.quiz)
            store.dispatch({
              type: ActionType.SetCumulativeScore,
              payload: data.cumulativeScore
            })
            store.dispatch({
              type: ActionType.SetQuiz,
              payload: quiz
            })
            store.dispatch({
              type: ActionType.ChangeAppState,
              payload: state == 'question' ?
                AppState.Question : AppState.Answered
            })
            break
        }
        break // case joined
      case 'question':
        const quiz = new Quiz(data.quiz)
        store.dispatch({
          type: ActionType.SetQuiz,
          payload: quiz
        })
        store.dispatch({
          type: ActionType.ChangeAppState,
          payload: AppState.Question
        })
        break // case question
      case 'hint':
        const hint = data.hint
        const score = data.score
        store.dispatch({
          type: ActionType.AddHint,
          payload: { hint: hint, score: score }
        })
        break
      case 'result':
        store.dispatch({
          type: ActionType.Result,
          payload: new Result(data)
        })
        store.dispatch({
          type: ActionType.ChangeAppState,
          payload: AppState.Result
        })
        break
      case 'end':
        store.dispatch({
          type: ActionType.ChangeAppState,
          payload: AppState.End
        })
        break
      default:
        console.debug('unknown message', data.type)
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
    case ActionType.ChangeAppState:
      const next = (action as Action<string>).payload
      console.log('change app state:', next)
      return assign({}, state, { appState: next })
    case ActionType.ChangeName:
      return assign({}, state, {
        myname: (action as Action<string>).payload
      })
    case ActionType.SubmitName:
      const answerer = (action as Action<string>).payload
      const masterMode: boolean = answerer == Config.masterName
      socket.emit('msg', {
        type: 'join',
        answerer: answerer
      })
      return assign({}, state, {
        masterMode: masterMode
      })
    case ActionType.SubmitAnswer:
      const answer = (action as Action<string>).payload
      socket.emit('msg', {
        type: 'myanswer',
        answerer: state.myname,
        answer: answer
      })
      return assign({}, state)

    case ActionType.SetCumulativeScore:
      const cumulativeScore = (action as Action<number>).payload
      console.log('set cumulative score', cumulativeScore)
      return assign({}, state, { cumulativeScore: cumulativeScore })
    case ActionType.SetQuiz:
      const quiz = (action as Action<Quiz>).payload
      console.log('received quiz')
      return assign({}, state, { quiz: quiz })
    case ActionType.AddHint:
      const data = (action as Action<{ hint: string, score: number }>).payload
      const hint = data.hint
      const score = data.score
      console.log('received hint', hint, score)
      return assign({}, state, {
        quiz: assign({}, state.quiz, {
          hints: state.quiz.hints.concat(hint),
        })
      })
    case ActionType.Result:
      const result = (action as Action<Result>).payload
      console.log('received result', result)
      return assign({}, state, {
        result: assign({}, result),
        cumulativeScore: result.cumulativeScore
      })
    case ActionType.MasterOperation:
      const msg = action.payload
      console.log('master operation', msg)
      socket.emit('msg', msg)
      return assign({}, state)
    default:
      return state
  }
}
