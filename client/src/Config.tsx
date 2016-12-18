import { QuizAnswer } from './Models'

export default class Config {
  public static masterName: string = 'master'
  public static quizzes: QuizAnswer[] = [
    new QuizAnswer({
      quiz: {
        question: 'What has four legs and a back but no body?',
        score: 10,
        choiceType: 'text',
        choices: ['Door', 'Chair', 'Spoon'],
        hints: [
          { hint: 'Hint1', score: 5 },
          { hint: 'Hint2', score: 3 }
        ],
      },
      answer: {
        comment: 'Comment',
        rightChoice: 1
      }
    })
  ]
}
