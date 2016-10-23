import * as React from "react"
import * as Redux from 'redux'
import { Quiz, QuizBoxState, AppState, ActionType } from '../Models'
import Config from '../Config'

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
  handleMasterReset(e: React.SyntheticEvent) {
    e.preventDefault();
    this.props.dispatch({
      type: ActionType.MasterOperation,
      payload: {
        type: 'reset'
      }
    })
  }
  handleMasterEnd(e: React.SyntheticEvent) {
    e.preventDefault();
    this.props.dispatch({
      type: ActionType.MasterOperation,
      payload: {
        type: 'end'
      }
    })
  }
  handleMasterQuestion(quiz: Quiz, e: React.SyntheticEvent) {
    e.preventDefault();
    this.props.dispatch({
      type: ActionType.MasterOperation,
      payload: {
        type: 'question',
        question: quiz.question,
        choices: quiz.choices,
        score: quiz.score
      }
    })
  }

  handleMasterChoice(rightChoice: number, e: React.SyntheticEvent) {
    e.preventDefault();
    this.props.dispatch({
      type: ActionType.MasterOperation,
      payload: {
        type: 'answer',
        answer: rightChoice
      }
    })
  }
  handleMasterHint(hint: string, score: number, e: React.SyntheticEvent) {
    e.preventDefault();
    this.props.dispatch({
      type: ActionType.MasterOperation,
      payload: {
        type: 'hint',
        hint: hint,
        score: score
      }
    })
  }

  render() {
    const state = this.props.state

    var topView: any
    var headerView: any

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
    switch (state.appState) {
      case AppState.InputName:
      case AppState.End:
        headerView = <header></header>
        break
      case AppState.StandBy:
      case AppState.Question:
      case AppState.Answered:
      case AppState.Result:
        headerView =
          <header>
            <p>Name: {state.myname}, Score: {state.cumulativeScore}</p>
          </header>
        break
      default:
        topView = <header></header>
    }

    var mainView: any

    if (state.masterMode) {
      mainView =
        <div id="masterMode">
          <h1>Master mode</h1>
          <p>
            <button onClick={this.handleMasterReset.bind(this)}>Reset</button>
            <button onClick={this.handleMasterEnd.bind(this)}>End</button>
          </p>
          {Config.quizzes.map((q, i) =>
            <div>
              <section>
                <h2>Question {i}:</h2>
                <button onClick={this.handleMasterQuestion.bind(this, q.quiz)}>
                  {q.quiz.question}
                </button>
                <p>Score: {q.quiz.score}</p>
              </section>
              <section>
                <h2>Hints:</h2>
                <ul>
                  {q.hints.map((hint, j) =>
                    <li>
                      <button onClick={this.handleMasterHint.bind(this, hint.hint, hint.score)}>
                        {hint.hint}(Score: {hint.score})
                    </button>
                    </li>
                  )}
                </ul>
              </section>
              <section>
                <h2>Answer</h2>
                <ul>
                  {q.quiz.choices.map((choice, c) =>
                    c == q.rightChoice ?
                      <li>
                        <button onClick={this.handleMasterChoice.bind(this, q.rightChoice)}>
                          {choice}
                        </button>
                      </li> :
                      <li>{choice}</li>
                  )}
                </ul>
              </section>
            </div>
          )}
        </div>
    } else {
      mainView =
        <div id="answererMode">
          {headerView}
          <section>
            {topView}
          </section>
        </div>
    }

    return (
      <div id="mainView">
        {mainView}
      </div>
    )
  }
}
