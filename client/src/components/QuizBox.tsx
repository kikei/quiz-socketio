import * as React from "react"
import * as Redux from 'redux'
import { Quiz, ChoiceType, QuizBoxState, AppState, ActionType } from '../Models'
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
        choiceType: quiz.getChoiceTypeAsString(),
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
  handleMasterTimeout(e: React.SyntheticEvent) {
    e.preventDefault()
    this.props.dispatch({
      type: ActionType.MasterOperation,
      payload: {
        type: 'timeout'
      }
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

    var mainView: any

    if (state.masterMode) {
      mainView =
        <div id="master-view" className="container">
          <h1>Master mode</h1>
          <p>
            <button onClick={this.handleMasterReset.bind(this)}>Reset</button>
            <button onClick={this.handleMasterEnd.bind(this)}>End</button>
          </p>
          {Config.quizzes.map((q, i) => {
            var choiceView: any
            switch (q.quiz.choiceType) {
              case ChoiceType.Text:
                choiceView =
                  <ul id="master-list-choices" className="row">
                    {q.quiz.choices.map((choice, c) => {
                      const className =
                        c == q.answer.rightChoice ? "button-primary" : ""
                      return <li key={c}>
                        <button onClick={this.handleMasterChoice.bind(this, c)}
                          className={className}>
                          {choice}
                        </button>
                      </li>
                    })}
                  </ul>
                break
              case ChoiceType.Image:
                choiceView =
                  <ul id="master-list-choices" className="row">
                    {q.quiz.choices.map((choice, c) => {
                      const className =
                        c == q.answer.rightChoice ? "button-primary" : ""
                      return <li key={c}>
                        <input type="image"
                          src={choice}
                          onClick={this.handleMasterChoice.bind(this, c)}
                          className={className} />
                      </li>
                    })}
                  </ul>
                break
            }
            var hintsView: any
            if (q.quiz.hints.length > 0) {
              hintsView =
                <section>
                  <h2>Hints</h2>
                  <ul id="master-list-hints" className="row">
                    {q.quiz.hints.map((hint, j) =>
                      <li className="row">
                        <button onClick={this.handleMasterHint.bind(this, hint.hint, hint.score)}>
                          {hint.hint}(Score: {hint.score})
                          </button>
                      </li>
                    )}
                  </ul>
                </section>
            } else {
              hintsView = <section></section>
            }

            return <div>
              <section>
                <h2>Question {i + 1}</h2>
                <button onClick={this.handleMasterQuestion.bind(this, q.quiz)}>
                  {q.quiz.question}
                </button>
                <p>Score: {q.quiz.score}</p>
              </section>
              {hintsView}
              <section>
                <h2>Timeout</h2>
                <ul id="master-list-timeout" className="row">
                  <li className="row">
                    <button onClick={this.handleMasterTimeout.bind(this)}
                      className="button-primary">
                      Timeout
                    </button>
                  </li>
                </ul>
              </section>
              <section>
                <h2>Answer</h2>
                {choiceView}
              </section>
            </div>
          })}
        </div>
    } else {
      mainView =
        <div id="answerer-view" className="container">
          {headerView}
          <div id="answerer-content">
            {topView}
          </div>
        </div>
    }

    return (
      <div id="main-view">
        {mainView}
      </div>
    )
  }
}
