/**
 * Store of application server
 */
export class Answer {
    answer: number
    score: number
    date: number
    constructor(answer: number, score: number, date: number) {
        this.answer = answer
        this.score = score
        this.date = date
    }
}

export class Client {
    public answerer: string
    public socketId: string
    public cumulativeScore: number
    public thinkedTime: number
    public answer: Answer
    constructor(answerer: string, socketId: string) {
        this.answerer = answerer
        this.socketId = socketId
        this.cumulativeScore = 0
        this.thinkedTime = 0
        this.answer = null
    }
    public addScore(score: number) {
        this.cumulativeScore += score
        return this.cumulativeScore
    }
    public addThinkedTime(millis: number) {
        this.thinkedTime += millis
        return this.thinkedTime
    }
    public hasAnswer() {
        return !!this.answer
    }
    public clearAnswer() {
        this.answer = null
    }
}

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

export enum State {
    StandBy,
    Question,
    Answer,
    Timeout,
    End
}

/**
 * Global storage
 */
export class Store {
    state: State
    currentQuiz: Quiz
    clients: { [answerer: string]: Client }
    constructor() {
        this.state = State.StandBy
        this.currentQuiz = null
        this.clients = {}
    }
    public reset() {
        this.state = State.StandBy
        this.currentQuiz = null
        this.clients = {}
    }
    public getClientByName(name: string) {
        return this.clients[name];
    }
    public addClient(answerer: string, socketId: string) {
        var client: Client = this.clients[answerer]
        if (client) {
            client.socketId = socketId
        } else {
            client = new Client(answerer, socketId)
            this.clients[answerer] = client
        }
        return client
    }
}

