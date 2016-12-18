"use strict";
/**
 * Store of application server
 */
var Answer = (function () {
    function Answer(answer, score, date) {
        this.answer = answer;
        this.score = score;
        this.date = date;
    }
    return Answer;
}());
exports.Answer = Answer;
var Client = (function () {
    function Client(answerer, socketId) {
        this.answerer = answerer;
        this.socketId = socketId;
        this.cumulativeScore = 0;
        this.thinkedTime = 0;
        this.answer = null;
    }
    Client.prototype.addScore = function (score) {
        this.cumulativeScore += score;
        return this.cumulativeScore;
    };
    Client.prototype.addThinkedTime = function (millis) {
        this.thinkedTime += millis;
        return this.thinkedTime;
    };
    Client.prototype.hasAnswer = function () {
        return !!this.answer;
    };
    Client.prototype.clearAnswer = function () {
        this.answer = null;
    };
    return Client;
}());
exports.Client = Client;
/**
 * One quiz
 */
var Quiz = (function () {
    function Quiz(question, choiceType, choices, score) {
        this.question = question;
        this.choices = choices;
        this.rightChoice = -1;
        this.choiceType = choiceType;
        this.score = score;
        this.hints = [];
    }
    Quiz.prototype.showAnswer = function () {
        return this.choices[this.rightChoice];
    };
    Quiz.prototype.addHint = function (hint) {
        this.hints.push(hint);
    };
    Quiz.prototype.isRight = function (answer) {
        return this.rightChoice == answer;
    };
    return Quiz;
}());
exports.Quiz = Quiz;
(function (State) {
    State[State["StandBy"] = 0] = "StandBy";
    State[State["Question"] = 1] = "Question";
    State[State["Answer"] = 2] = "Answer";
    State[State["Timeout"] = 3] = "Timeout";
    State[State["End"] = 4] = "End";
})(exports.State || (exports.State = {}));
var State = exports.State;
/**
 * Global storage
 */
var Store = (function () {
    function Store() {
        this.state = State.StandBy;
        this.currentQuiz = null;
        this.clients = {};
    }
    Store.prototype.reset = function () {
        this.state = State.StandBy;
        this.currentQuiz = null;
        this.clients = {};
    };
    Store.prototype.getClientByName = function (name) {
        return this.clients[name];
    };
    Store.prototype.addClient = function (answerer, socketId) {
        var client = this.clients[answerer];
        if (client) {
            client.socketId = socketId;
        }
        else {
            client = new Client(answerer, socketId);
            this.clients[answerer] = client;
        }
        return client;
    };
    return Store;
}());
exports.Store = Store;
//# sourceMappingURL=Models.js.map