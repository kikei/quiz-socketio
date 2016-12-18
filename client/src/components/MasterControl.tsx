import * as React from "react"
import * as Redux from 'redux'
import { Quiz, QuizAnswer, ChoiceType, MasterControlState, ActionType } from '../Models'
import Config from '../Config'

export interface MasterControlProps {
  state: MasterControlState
  dispatch: Redux.Dispatch<any>
}

export class MasterControl extends React.Component<MasterControlProps, any> {
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
  handleChangeQuizSheet(e: any) {
    this.props.dispatch({
      type: ActionType.ChangeQuizSheet,
      payload: e.target.value
    })
  }
  handleClearQuizSheet(e: any) {
    this.props.dispatch({
      type: ActionType.ChangeQuizSheet,
      payload: ''
    })
  }
  handleDefaultQuizSheet(e: any) {
    this.props.dispatch({
      type: ActionType.ChangeQuizSheet,
      payload: JSON.stringify(Config.defaultQuizSheet, null, '  ')
    })
  }
  handleSubmitQuizSheet(e: React.SyntheticEvent) {
    e.preventDefault()
    const sheet = this.props.state.quizSheet
    console.log('sheet', sheet)
    var quizzes: QuizAnswer[] = []
    try {
      const array = JSON.parse(sheet)
      quizzes = array.map((obj: any) => new QuizAnswer(obj))
    } catch (e) {
      console.error('failed to parse json', e)
      return
    }
    if (quizzes.length == 0) {
      console.error('failed to load sheet')
      return
    }

    this.props.dispatch({
      type: ActionType.SubmitQuizSheet,
      payload: quizzes
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
  makeMasterView(): any {
    const state = this.props.state

    const quizSheetHeight =
      state.quizzes.length > 0 ? '10em' : '20em'
    const quizSheetView =
      <div id="master-quiz-sheet">
        <div className="row">
          <textarea cols="80" rows="10"
            value={state.quizSheet}
            style={{ height: quizSheetHeight, 'font-family': 'monospace' }}
            onChange={this.handleChangeQuizSheet.bind(this)} />
        </div>
        <div className="row">
          <button onClick={this.handleClearQuizSheet.bind(this)}>Clear</button>
          <button onClick={this.handleSubmitQuizSheet.bind(this)}>Send</button>
          <button onClick={this.handleDefaultQuizSheet.bind(this)}>Default</button>
        </div >
      </div >

    return <div id="master-view" className="container" >
      <h1>Master mode</h1>
      <p>
        <button onClick={this.handleMasterReset.bind(this)}>Reset</button>
        <button onClick={this.handleMasterEnd.bind(this)}>End</button>
      </p>
      {quizSheetView}
      {state.quizzes.map((q, i) => {
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
        if (q.quiz.hints && q.quiz.hints.length > 0) {
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
      })
      }
    </div >
  }

  render() {
    const state = this.props.state
    const mainView = this.makeMasterView()

    return (
      <div id="main-view">
        {mainView}
      </div>
    )
  }
}
