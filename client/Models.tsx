import assign = require('object-assign')

/** Models **/
export class Quiz {
  public id: string
  public name: string
  constructor(data: any) {
    this.id = data['id']
    this.name = data['name']
  }
}

export enum Mode {
  InputName,
  Wait,
  AskQuestion,
}

/** State **/
export interface QuizBoxState {
  hello: string,
  username: string,
  mode: Mode
}

/** Actions **/
export interface Action<T> {
  type: ActionType
  payload: T
}

export enum ActionType {
  ChangeName,
  SubmitName,
  ChangeMode
}
