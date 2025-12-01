export const allowedChatModelNodes = ['chatOpenAI', 'chatAnthropic', 'chatVNPT']

export const filterAllowedChatModels = (nodes) =>
    nodes.filter((nd) => nd.category !== 'Chat Models' || allowedChatModelNodes.includes(nd.name))
