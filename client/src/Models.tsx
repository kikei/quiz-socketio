import assign = require('object-assign')

/** Models **/
export class Quiz {
  public question: string
  public choices: string[]
  public hints: string[]
  public score: number
  constructor(data: any) {
    this.question = data['question'] || ''
    this.choices = data['choices'] || []
    this.hints = data['hints'] || []
    this.score = data['score'] || 0
  }
}

export class Result {
  public right: boolean
  public answer: string
  public score: number
  constructor(data: any) {
    this.right = data.right
    this.answer = data.answer
    this.score = data.score
  }
}

export enum AppState {
  InputName,
  StandBy,
  Question,
  Answered,
  Result,
  End
}

/** State **/
export interface QuizBoxState {
  myname: string,
  appState: AppState,
  quiz: Quiz,
  result: Result,
}

/** Actions **/
export interface Action<T> {
  type: ActionType
  payload: T
}

export enum ActionType {
  ChangeAppState,

  ChangeName,
  SubmitName,
  SubmitAnswer,

  SetQuiz,
  AddHint,
  Result,
}