import { ChatOpenAI as LangchainChatOpenAI, ChatOpenAIFields } from '@langchain/openai'
import { BaseCache } from '@langchain/core/caches'
import { INode, INodeData, INodeParams } from '../../../src/Interface'
import { getBaseClasses } from '../../../src/utils'
import { ChatOpenAI } from '../ChatOpenAI/FlowiseChatOpenAI'
import { HttpsProxyAgent } from 'https-proxy-agent'

const DEFAULT_VNPT_BASE_PATH = 'https://assistant-stream.vnpt.vn/v1/'

class ChatVNPT_ChatModels implements INode {
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
        this.label = 'VNPT LLM'
        this.name = 'chatVNPT'
        this.version = 1.0
        this.type = 'ChatVNPT'
        this.icon = 'vnptai.svg'
        this.category = 'Chat Models'
        this.description = 'VNPT LLM models via OpenAI-compatible API'
        this.baseClasses = [this.type, ...getBaseClasses(LangchainChatOpenAI)]
        this.inputs = [
            {
                label: 'VNPT Access Token',
                name: 'vnptApiKey',
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
                options: [
                    { label: 'llm-small-v4', name: 'llm-small-v4' },
                    { label: 'llm-medium-v4', name: 'llm-medium-v4' },
                    { label: 'llm-large-v4', name: 'llm-large-v4' }
                ],
                default: 'llm-medium-v4'
            },
            {
                label: 'Temperature',
                name: 'temperature',
                type: 'number',
                step: 0.1,
                default: 0.8,
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
                label: 'Timeout',
                name: 'timeout',
                type: 'number',
                step: 1,
                optional: true,
                additionalParams: true
            },
            {
                label: 'BasePath',
                name: 'basepath',
                type: 'string',
                placeholder: DEFAULT_VNPT_BASE_PATH,
                optional: true,
                additionalParams: true
            },
            {
                label: 'Proxy Url',
                name: 'proxyUrl',
                type: 'string',
                optional: true,
                additionalParams: true
            }
        ]
    }

    async init(nodeData: INodeData): Promise<any> {
        const apiKey = nodeData.inputs?.vnptApiKey as string
        if (!apiKey) throw new Error('VNPT Access Token is required')

        const temperature = nodeData.inputs?.temperature as string
        const modelName = nodeData.inputs?.modelName as string
        const maxTokens = nodeData.inputs?.maxTokens as string
        const topP = nodeData.inputs?.topP as string
        const timeout = nodeData.inputs?.timeout as string
        const streaming = nodeData.inputs?.streaming as boolean
        const basePath = (nodeData.inputs?.basepath as string) || DEFAULT_VNPT_BASE_PATH
        const proxyUrl = nodeData.inputs?.proxyUrl as string
        const cache = nodeData.inputs?.cache as BaseCache

        const obj: ChatOpenAIFields = {
            temperature: temperature ? parseFloat(temperature) : 0.8,
            modelName,
            openAIApiKey: apiKey,
            apiKey,
            streaming: streaming ?? true
        }

        if (maxTokens) obj.maxTokens = parseInt(maxTokens, 10)
        if (topP) obj.topP = parseFloat(topP)
        if (timeout) obj.timeout = parseInt(timeout, 10)
        if (cache) obj.cache = cache

        const configuration: any = {
            baseURL: basePath || DEFAULT_VNPT_BASE_PATH
        }

        if (proxyUrl) {
            configuration.httpAgent = new HttpsProxyAgent(proxyUrl)
        }

        obj.configuration = configuration

        const model = new ChatOpenAI(nodeData.id, obj)
        return model
    }
}

module.exports = { nodeClass: ChatVNPT_ChatModels }
