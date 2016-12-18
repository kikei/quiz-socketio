"use strict";
var Ranking = (function () {
    function Ranking() {
    }
    return Ranking;
}());
function getRanking(store) {
    var ranks = Object.keys(store.clients)
        .map(function (answerer) { return store.getClientByName(answerer); });
    ranks.sort(function (a, b) {
        if (a.cumulativeScore > b.cumulativeScore)
            return -1;
        if (a.cumulativeScore < b.cumulativeScore)
            return +1;
        return b.thinkedTime - a.thinkedTime;
    });
    var result = [];
    for (var i = 0; i < ranks.length; i++) {
        var client = ranks[i];
        var rank = {
            'rank': i,
            'answerer': client.answerer,
            'score': client.cumulativeScore,
            'thinked_time': client.thinkedTime
        };
        result.push(rank);
    }
    return {
        'ranking': result
    };
}
exports.getRanking = getRanking;
//# sourceMappingURL=View.js.map