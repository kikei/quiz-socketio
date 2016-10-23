import { Quiz } from './Models'

class QuizAnswer {
  public quiz: { question: string, choices: string[], score: number }
  public hints: { hint: string, score: number }[]
  public rightChoice: number
  constructor(data: any) {
    this.quiz = data.quiz
    this.hints = data.hints
    this.rightChoice = data.rightChoice
  }
}

export default class Config {
  public static masterName: string = 'master'
  public static quizzes: QuizAnswer[] = [
    new QuizAnswer({
      quiz: {
        question: 'What has four legs and a back but no body?',
        choices: ['Door', 'Chair', 'Spoon'],
        score: 10
      },
      hints: [
        { hint: 'Hint1', score: 5 },
        { hint: 'Hint2', score: 3 }
      ],
      rightChoice: 1
    })
  ]
}
