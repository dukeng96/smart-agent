export const allowedChatModelNodes = ['chatOpenAI', 'chatAnthropic', 'chatMiniMax']

export const filterAllowedChatModels = (nodes) =>
    nodes.filter((nd) => nd.category !== 'Chat Models' || allowedChatModelNodes.includes(nd.name))
