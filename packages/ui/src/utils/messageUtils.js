const THINK_REGEX = /<think>([\s\S]*?)<\/think>/i

export function splitThinkContent(text) {
    if (!text) return { reasoning: null, answer: '' }

    const match = text.match(THINK_REGEX)
    if (!match) {
        return { reasoning: null, answer: text.trim() }
    }

    const reasoning = match[1].trim()
    const answer = text.slice(match.index + match[0].length).trim()
    return { reasoning, answer }
}

export function stripThinkTags(text) {
    if (!text) return ''
    return text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim()
}
