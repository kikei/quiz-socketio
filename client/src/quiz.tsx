import * as io from "socket.io-client"
import * as React from "react"
import * as ReactDOM from "react-dom"
import * as Redux from "redux"
import thunk from 'redux-thunk'
import { Provider, connect } from 'react-redux'
import { Quiz, Result, QuizBoxState, AppState, Action, ActionType } from './Models'
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
      myname: '',
      appState: AppState.Initial,
      quiz: null,
      result: null,
      cumulativeScore: 0,
    }
    const store: Redux.Store<QuizBoxState> = Redux.createStore(
      reducer,
      preloadedState,
      Redux.applyMiddleware(thunk)
    )

    listenSocket(store)

    render(root, store)

    initialize(store)
  }
}

/**
 * join automatically when name has been saved
 */
function initialize(store: Redux.Store<QuizBoxState>) {
  var answerer: string = null
  if (window.localStorage) {
    answerer = localStorage.getItem('answerer')
    console.log('saved name:', answerer)
  }

  if (!answerer) {
    store.dispatch({
      type: ActionType.ChangeAppState,
      payload: AppState.InputName
    })
  } else {
    store.dispatch({
      type: ActionType.ChangeName,
      payload: answerer
    })
    store.dispatch({
      type: ActionType.SubmitName,
      payload: answerer
    })
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

        if (window.localStorage) {
          // save name and use it when app reopened
          console.log('save name:', answerer)
          localStorage.setItem('answerer', answerer)
        }

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
      case 'timeout':
        store.dispatch({
          type: ActionType.ChangeAppState,
          payload: AppState.Timeout
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
      socket.emit('msg', {
        type: 'join',
        answerer: answerer
      })
      return assign({}, state)
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
      console.log('received hint', data.hint, data.score)
      return assign({}, state, {
        quiz: assign({}, state.quiz, {
          hints: [data].concat(state.quiz.hints),
        })
      })
    case ActionType.Result:
      const result = (action as Action<Result>).payload
      console.log('received result', result)
      return assign({}, state, {
        result: assign({}, result),
        cumulativeScore: result.cumulativeScore
      })
    default:
      return state
  }
}
