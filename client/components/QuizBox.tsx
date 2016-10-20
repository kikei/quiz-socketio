import * as React from "react"
import * as Redux from 'redux'
import { QuizBoxState, Mode, ActionType } from '../Models'


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
    e.preventDefault();
    this.props.dispatch({
      type: ActionType.SubmitName,
      payload: this.props.state.username
    })
  }
  render() {
    const state = this.props.state

    var topView: any
    switch (state.mode) {
      case Mode.InputName:
        topView =
          <div>
            <h1>{state.hello}</h1>
            <form>
              <input type="text" name="name" value={state.username}
                onChange={this.handleChangeName.bind(this)} />
              <button
                onClick={this.handleSubmitName.bind(this)}>
                Submit
              </button>
            </form>
          </div>
        break
      case Mode.InputName:
        topView =
          <div>
            <h1>{state.username}</h1>
          </div>
        break
      case Mode.Wait:
        topView =
          <div>
            <h1>Please wait...</h1>
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
