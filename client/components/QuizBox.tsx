import * as React from "react"
import * as Redux from 'redux'
import { QuizBoxState, AppState, ActionType } from '../Models'


export interface QuizBoxProps {
  state: QuizBoxState
  dispatch: Redux.Dispatch<any>
}

export class QuizBox extends React.Component<QuizBoxProps, any> {
  handleChangeName(e: any) {
    console.log(e.target.value)
    this.props.dispatch({
      type: ActionType.ChangeName,
      payload: e.target.value
    })
  }
  handleSubmitName(e: React.SyntheticEvent) {
    e.preventDefault()
    this.props.dispatch({
      type: ActionType.SubmitName,
      payload: this.props.state.myname
    })
  }
  handleChoice(choice: number, e: React.SyntheticEvent) {
    e.preventDefault()
    this.props.dispatch({
      type: ActionType.SubmitAnswer,
      payload: choice
    })
    this.props.dispatch({
      type: ActionType.ChangeAppState,
      payload: AppState.Answered
    })
  }
  render() {
    const state = this.props.state

    var topView: any
    switch (state.appState) {
      case AppState.InputName:
        topView =
          <div>
            <h1>Welcome!!</h1>
            <form>
              <input type="text" name="name" value={state.myname}
                onChange={this.handleChangeName.bind(this)} />
              <button
                onClick={this.handleSubmitName.bind(this)}>
                Submit
              </button>
            </form>
          </div>
        break
      case AppState.StandBy:
        topView =
          <div>
            <h1>Please wait...</h1>
          </div>
        break
      case AppState.Question:
        topView =
          <div>
            <h1>{state.quiz.question}</h1>
            <ol>
              {state.quiz.choices.map((choice, i) =>
                <li key={i}>
                  <button onClick={this.handleChoice.bind(this, i)}>
                    {choice}
                  </button>
                </li>
              )}
            </ol>
            <ol>
              {state.quiz.hints.map((hint, i) =>
                <li key={i}>{hint}</li>
              )}
            </ol>
          </div>
        break
      case AppState.Answered:
        topView =
          <div>
            <h1>Answered!!</h1>
            <p>Please wait a result.</p>
          </div>
        break
      case AppState.Result:
        const message = state.result.right ? 'Yes!' : 'No!'
        topView =
          <div>
            <h1>{message}</h1>
            <h2>{state.quiz.question}</h2>
            <p>{state.result.answer}</p>
          </div>
        break
      case AppState.End:
        topView =
          <div>
            <h1>Game over</h1>
          </div>
        break
      default:
        topView =
          <div>
            <h1>Unknown mode</h1>
          </div>
    }
    return (
      <div>
        {topView}
      </div>
    )
  }
}
