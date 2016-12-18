/**
 * One quiz
 */
export class Quiz {
    public question: string
    public choices: string[]
    public choiceType: string
    public rightChoice: number
    public score: number
    public hints: string[]
    constructor(question: string, choiceType: string,
        choices: string[], score: number) {
        this.question = question
        this.choices = choices
        this.rightChoice = -1
        this.choiceType = choiceType
        this.score = score
        this.hints = []
    }
    public showAnswer(): string {
        return this.choices[this.rightChoice]
    }
    public addHint(hint: string): void {
        this.hints.push(hint)
    }
    public isRight(answer: number): boolean {
        return this.rightChoice == answer
    }
}
