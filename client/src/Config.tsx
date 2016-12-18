import { QuizAnswer } from './Models'

export default class Config {
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
    }),
    new QuizAnswer({
      quiz: {
        question: 'Whice is green?',
        score: 10,
        choiceType: 'image',
        choices: [
          '/public/choice1.png', '/public/choice2.png',
          '/public/choice3.png', '/public/choice4.png'],
      },
      answer: {
        comment: 'Comment',
        rightChoice: 3
      }
    })
  ]
}
