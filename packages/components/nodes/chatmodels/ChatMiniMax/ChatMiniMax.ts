import { ChatOpenAI as LangchainChatOpenAI, ChatOpenAIFields } from '@langchain/openai'
import { BaseCache } from '@langchain/core/caches'
import { INode, INodeData, INodeParams } from '../../../src/Interface'
import { getBaseClasses } from '../../../src/utils'
import { ChatOpenAI } from '../ChatOpenAI/FlowiseChatOpenAI'
import { HttpsProxyAgent } from 'https-proxy-agent'

const DEFAULT_MINIMAX_BASE_PATH = 'https://api.minimax.io/v1'

class ChatMiniMax_ChatModels implements INode {
    label: string
    name: string
    version: number
    type: string
    icon: string
    category: string
    description: string
    baseClasses: string[]
    inputs: INodeParams[]

    constructor() {
        this.label = 'VNPTAI.IO'
        this.name = 'chatMiniMax'
        this.version = 1.0
        this.type = 'ChatMiniMax'
        this.icon = 'vnptai.svg'
        this.category = 'Chat Models'
        this.description = 'VNPTAI.IO Medium model (powered by MiniMax OpenAI-compatible API)'
        this.baseClasses = [this.type, ...getBaseClasses(LangchainChatOpenAI)]
        this.inputs = [
            {
                label: 'VNPTAI.IO API Key',
                name: 'minimaxApiKey',
                type: 'password'
            },
            {
                label: 'Cache',
                name: 'cache',
                type: 'BaseCache',
                optional: true
            },
            {
                label: 'Model Name',
                name: 'modelName',
                type: 'options',
                options: [{ label: 'VNPTAI.IO-Medium-v1', name: 'VNPTAI.IO-Medium-v1' }],
                default: 'VNPTAI.IO-Medium-v1'
            },
            {
                label: 'Temperature',
                name: 'temperature',
                type: 'number',
                step: 0.1,
                default: 0.9,
                optional: true
            },
            {
                label: 'Streaming',
                name: 'streaming',
                type: 'boolean',
                default: true,
                optional: true,
                additionalParams: true
            },
            {
                label: 'Max Tokens',
                name: 'maxTokens',
                type: 'number',
                step: 1,
                optional: true,
                additionalParams: true
            },
            {
                label: 'Top Probability',
                name: 'topP',
                type: 'number',
                step: 0.1,
                optional: true,
                additionalParams: true
            },
            {
                label: 'Frequency Penalty',
                name: 'frequencyPenalty',
                type: 'number',
                step: 0.1,
                optional: true,
                additionalParams: true
            },
            {
                label: 'Presence Penalty',
                name: 'presencePenalty',
                type: 'number',
                step: 0.1,
                optional: true,
                additionalParams: true
            },
            {
                label: 'Timeout',
                name: 'timeout',
                type: 'number',
                step: 1,
                optional: true,
                additionalParams: true
            },
            {
                label: 'Stop Sequence',
                name: 'stopSequence',
                type: 'string',
                rows: 4,
                optional: true,
                description: 'List of stop words to use when generating. Use comma to separate multiple stop words.',
                additionalParams: true
            },
            {
                label: 'BasePath',
                name: 'basepath',
                type: 'string',
                placeholder: DEFAULT_MINIMAX_BASE_PATH,
                optional: true,
                additionalParams: true
            },
            {
                label: 'Proxy Url',
                name: 'proxyUrl',
                type: 'string',
                optional: true,
                additionalParams: true
            },
            {
                label: 'BaseOptions',
                name: 'baseOptions',
                type: 'json',
                optional: true,
                additionalParams: true
            }
        ]
    }

    async init(nodeData: INodeData): Promise<any> {
        const minimaxApiKey = nodeData.inputs?.minimaxApiKey as string
        if (!minimaxApiKey) {
            throw new Error('VNPTAI.IO API Key is required')
        }

        const temperature = nodeData.inputs?.temperature as string
        const modelName = (nodeData.inputs?.modelName as string) || 'VNPTAI.IO-Medium-v1'
        const maxTokens = nodeData.inputs?.maxTokens as string
        const topP = nodeData.inputs?.topP as string
        const frequencyPenalty = nodeData.inputs?.frequencyPenalty as string
        const presencePenalty = nodeData.inputs?.presencePenalty as string
        const timeout = nodeData.inputs?.timeout as string
        const stopSequence = nodeData.inputs?.stopSequence as string
        const streaming = nodeData.inputs?.streaming as boolean
        const basePath = (nodeData.inputs?.basepath as string) || DEFAULT_MINIMAX_BASE_PATH
        const proxyUrl = nodeData.inputs?.proxyUrl as string
        const baseOptions = nodeData.inputs?.baseOptions
        const cache = nodeData.inputs?.cache as BaseCache

        const apiModelName = 'MiniMax-M2'

        const obj: ChatOpenAIFields = {
            temperature: parseFloat(temperature),
            modelName: apiModelName,
            openAIApiKey: minimaxApiKey,
            apiKey: minimaxApiKey,
            streaming: streaming ?? true
        }

        if (maxTokens) obj.maxTokens = parseInt(maxTokens, 10)
        if (topP) obj.topP = parseFloat(topP)
        if (frequencyPenalty) obj.frequencyPenalty = parseFloat(frequencyPenalty)
        if (presencePenalty) obj.presencePenalty = parseFloat(presencePenalty)
        if (timeout) obj.timeout = parseInt(timeout, 10)
        if (cache) obj.cache = cache
        if (stopSequence) {
            const stopSequenceArray = stopSequence.split(',').map((item) => item.trim())
            obj.stop = stopSequenceArray
        }

        let parsedBaseOptions: any | undefined = undefined

        if (baseOptions) {
            try {
                parsedBaseOptions = typeof baseOptions === 'object' ? baseOptions : JSON.parse(baseOptions)
            } catch (exception) {
                throw new Error('Invalid JSON in the VNPTAI.IO BaseOptions: ' + exception)
            }
        }

        const configuration: any = {
            baseURL: basePath || DEFAULT_MINIMAX_BASE_PATH,
            modelDisplayName: modelName
        }

        if (parsedBaseOptions) {
            configuration.defaultHeaders = parsedBaseOptions
        }

        if (proxyUrl) {
            configuration.httpAgent = new HttpsProxyAgent(proxyUrl)
        }

        obj.configuration = configuration

        const model = new ChatOpenAI(nodeData.id, obj)
        return model
    }
}

module.exports = { nodeClass: ChatMiniMax_ChatModels }
