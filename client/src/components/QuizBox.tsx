import * as React from "react"
import * as Redux from 'redux'
import { Quiz, ChoiceType, QuizBoxState, AppState, ActionType } from '../Models'

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
  makeChoiceView(quiz: Quiz): any {
    switch (quiz.choiceType) {
      case ChoiceType.Text:
        return <ul id="list-choices">
          {quiz.choices.map((choice, i) =>
            <li key={i}>
              <button onClick={this.handleChoice.bind(this, i)}>
                {choice}
              </button>
            </li>
          )}
        </ul>
      case ChoiceType.Image:
        return <ul id="list-choices">
          {quiz.choices.map((choice, i) =>
            <li key={i} className="row">
              <input type="image" src={choice}
                onClick={this.handleChoice.bind(this, i)}
                className="one-half" />
            </li>
          )}
        </ul>
    }
  }

  render() {
    const state = this.props.state

    var topView: any
    var headerView: any

    switch (state.appState) {
      case AppState.Initial:
        topView =
          <div className="app-loading" />
        break
      case AppState.InputName:
        topView =
          <div>
            <header className="row" >
              <h1>Welcome!!</h1>
            </header >
            <form>
              <div className="row">
                <label htmlFor="fieldInputName">
                  Input your name:
                </label>
                <input type="text" name="name" id="fieldInputName"
                  value={state.myname}
                  onChange={this.handleChangeName.bind(this)} />
              </div>
              <div className="row">
                <button
                  onClick={this.handleSubmitName.bind(this)}
                  className="button-primary">
                  Submit
                </button>
              </div>
            </form>
          </div >
        break
      case AppState.StandBy:
        topView =
          <div>
            <h1>Please wait...</h1>
          </div>
        break
      case AppState.Question:
        const choiceView = this.makeChoiceView(state.quiz)
        topView =
          <div>
            <h1>{state.quiz.question}</h1>
            {choiceView}
            <ul id="list-hints" className="row">
              {state.quiz.hints.map((hint, i) =>
                <li key={i} className="six columns">{hint}</li>
              )}
            </ul>
          </div>
        break
      case AppState.Answered:
        topView =
          <div>
            <h1>Answered!!</h1>
            <p>Please wait a result.</p>
          </div>
        break
      case AppState.Timeout:
        topView =
          <div>
            <h1>Timeout!!</h1>
            <p>Please wait a result.</p>
          </div>
        break
      case AppState.Result:
        var messageView: any
        if (state.result.right) {
          messageView = <span className="result-yes">Yes!</span>
        } else {
          messageView = <span className="result-no">No!</span>
        }
        var rankText: string = null
        var rankClass: string = null
        if (state.result.rank == 0) {
          rankText = "1st"
          rankClass = "rank-1st"
        } else if (state.result.rank == 1) {
          rankText = "2nd"
          rankClass = "rank-2nd"
        } else if (state.result.rank == 2) {
          rankText = "3rd"
          rankClass = "rank-3rd"
        } else if (state.result.rank < 10) {
          rankText = "top 10"
          rankClass = "rank-top10"
        }
        console.log(rankText)
        var rankView: any =
          rankText == null ? <p /> :
            <p className="result-rank">
              Your rank: <span className={rankClass}>{rankText}</span>
            </p>
        var answerView: any;
        switch (state.quiz.choiceType) {
          case ChoiceType.Text:
            answerView = <p>{state.result.answer}</p>
            break
          case ChoiceType.Image:
            answerView = <p><img src={state.result.answer} /></p>
            break
          default:
            console.error('invalid choice type')
        }
        topView =
          <div>
            <h1>{messageView}</h1>
            <p className="result-question">Q. {state.quiz.question}</p>
            <p className="result-answer">A. {answerView}</p>
            {rankView}
          </div>
        break
      case AppState.End:
        topView =
          <div>
            <h1>Game over</h1>
          </div>
        break
      default:
        console.error('unknown mode')
        topView =
          <div>
            <h1>Unknown mode</h1>
          </div>
    }
    switch (state.appState) {
      case AppState.Initial:
      case AppState.InputName:
      case AppState.End:
        headerView = <nav></nav>
        break
      case AppState.StandBy:
      case AppState.Question:
      case AppState.Answered:
      case AppState.Timeout:
      case AppState.Result:
        headerView =
          <nav id="navbar-answerer">
            <p>Player Name: {state.myname}, Score: {state.cumulativeScore}</p>
          </nav>
        break
      default:
        topView = <nav></nav>
    }

    return (
      <div id="main-view">
        <div id="answerer-view" className="container">
          {headerView}
          <div id="answerer-content">
            {topView}
          </div>
        </div>
      </div>
    )
  }
}
