import { Answer, Client, Quiz, State, Store } from './Models'

class Ranking {
    rank: number
    answerer: string
    score: number
    thinked_time: number
}

export function getRanking(store: Store): { ranking: Ranking[] } {
    const ranks: Client[] =
        Object.keys(store.clients)
            .map((answerer) => store.getClientByName(answerer))
    ranks.sort((a, b) => {
        if (a.cumulativeScore > b.cumulativeScore) return -1
        if (a.cumulativeScore < b.cumulativeScore) return +1
        return b.thinkedTime - a.thinkedTime
    })
    const result: Ranking[] = []
    for (var i = 0; i < ranks.length; i++) {
        const client = ranks[i]
        const rank = {
            'rank': i,
            'answerer': client.answerer,
            'score': client.cumulativeScore,
            'thinked_time': client.thinkedTime
        }
        result.push(rank)
    }
    return {
        'ranking': result
    }
}
