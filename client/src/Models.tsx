import assign = require('object-assign')

/** Models **/
export enum ChoiceType {
  Text, Image
}

export class Quiz {
  public question: string
  public choiceType: ChoiceType
  public choices: string[]
  public hints: { hint: string, score: number }[]
  public score: number
  constructor(data: any) {
    this.question = data['question'] || ''
    this.choiceType = this.choiceTypeFromString(data['choiceType'])
    this.choices = data['choices'] || []
    this.hints = data['hints'] || []
    this.score = data['score'] || 0
  }

  public choiceTypeFromString(choiceType: string): ChoiceType {
    switch (choiceType) {
      case 'text':
        return ChoiceType.Text
      case 'image':
        return ChoiceType.Image
      default:
        console.error('invalid choice type:', choiceType)
        return null
    }
  }

  public getChoiceTypeAsString(): string {
    switch (this.choiceType) {
      case ChoiceType.Text:
        return 'text'
      case ChoiceType.Image:
        return 'image'
    }
  }
}

export class Answer {
  public comment: string
  public rightChoice: number
  constructor(data: any) {
    this.comment = data.comment
    this.rightChoice = data.rightChoice
  }
}

export class QuizAnswer {
  public quiz: Quiz
  public answer: Answer
  constructor(data: any) {
    this.quiz = new Quiz(data.quiz)
    this.answer = new Answer(data.answer)
  }
}

export class Result {
  public right: boolean
  public answer: string
  public score: number
  public cumulativeScore: number
  public rank: number
  constructor(data: any) {
    this.right = data.right
    this.answer = data.answer
    this.score = data.score
    this.cumulativeScore = data.cumulativeScore
    this.rank = data.rank
  }
}

export enum AppState {
  InputName,
  StandBy,
  Question,
  Answered,
  Timeout,
  Result,
  End
}

/** State **/
export interface QuizBoxState {
  myname: string,
  appState: AppState,
  quiz: Quiz,
  result: Result,
  cumulativeScore: number,
}

export interface MasterControlState {
  quizSheet: string,
  quizzes: QuizAnswer[]
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

  SetCumulativeScore,
  SetQuiz,
  AddHint,
  Result,

  ChangeQuizSheet,
  SubmitQuizSheet,
  MasterOperation
}
