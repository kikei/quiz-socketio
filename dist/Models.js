"use strict";
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
//# sourceMappingURL=Models.js.map