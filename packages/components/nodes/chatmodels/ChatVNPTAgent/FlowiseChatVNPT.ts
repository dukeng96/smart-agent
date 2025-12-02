import { ChatOpenAI } from '../ChatOpenAI/FlowiseChatOpenAI'
import { ChatOpenAIFields } from '@langchain/openai'
import { BaseMessage, AIMessageChunk } from '@langchain/core/messages'
import { CallbackManagerForLLMRun } from '@langchain/core/callbacks/manager'
import { ChatGenerationChunk } from '@langchain/core/outputs'

interface ToolCallPayload {
    name: string
    arguments?: any
}

export class FlowiseChatVNPT extends ChatOpenAI {
    constructor(id: string, fields: ChatOpenAIFields) {
        super(id, fields)
    }

    async *_streamResponseChunks(
        messages: BaseMessage[],
        options: this['ParsedCallOptions'],
        runManager?: CallbackManagerForLLMRun
    ): AsyncGenerator<ChatGenerationChunk> {
        const baseStream = super._streamResponseChunks(messages, options, undefined)
        let bufferedText = ''

        for await (const baseChunk of baseStream) {
            const messageChunk = baseChunk.message as AIMessageChunk

            if (typeof messageChunk.content !== 'string') {
                yield baseChunk
                continue
            }

            bufferedText += messageChunk.content
            const emittedChunks: ChatGenerationChunk[] = []

            while (true) {
                const startIndex = bufferedText.indexOf('<tool_call>')

                if (startIndex === -1) {
                    if (bufferedText) {
                        emittedChunks.push(this.createTextChunk(bufferedText, baseChunk, messageChunk))
                        bufferedText = ''
                    }
                    break
                }

                if (startIndex > 0) {
                    emittedChunks.push(
                        this.createTextChunk(bufferedText.slice(0, startIndex), baseChunk, messageChunk)
                    )
                }

                const endIndex = bufferedText.indexOf('</tool_call>', startIndex)
                if (endIndex === -1) {
                    bufferedText = bufferedText.slice(startIndex)
                    break
                }

                const toolPayload = bufferedText.slice(startIndex + '<tool_call>'.length, endIndex).trim()
                emittedChunks.push(this.createToolCallChunk(toolPayload, baseChunk))
                bufferedText = bufferedText.slice(endIndex + '</tool_call>'.length)
            }

            if (!emittedChunks.length) {
                yield baseChunk
                const newTokenIndices = {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    prompt: (baseChunk.generationInfo as any)?.prompt ?? 0,
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    completion: (baseChunk.generationInfo as any)?.completion ?? 0
                }
                await runManager?.handleLLMNewToken(baseChunk.text ?? '', newTokenIndices, undefined, undefined, undefined, {
                    chunk: baseChunk
                })
                continue
            }

            for (const chunk of emittedChunks) {
                yield chunk
                const newTokenIndices = {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    prompt: (chunk.generationInfo as any)?.prompt ?? 0,
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    completion: (chunk.generationInfo as any)?.completion ?? 0
                }
                await runManager?.handleLLMNewToken(chunk.text ?? '', newTokenIndices, undefined, undefined, undefined, {
                    chunk
                })
            }
        }

        if (bufferedText) {
            const trailingChunk = this.createTextChunk(bufferedText, undefined, undefined)
            yield trailingChunk
            await runManager?.handleLLMNewToken(
                trailingChunk.text ?? '',
                { prompt: 0, completion: 0 },
                undefined,
                undefined,
                undefined,
                {
                    chunk: trailingChunk
                }
            )
        }
    }

    private createTextChunk(text: string, baseChunk?: ChatGenerationChunk, sourceMessage?: AIMessageChunk) {
        const message = new AIMessageChunk({
            content: text,
            response_metadata: sourceMessage?.response_metadata,
            usage_metadata: sourceMessage?.usage_metadata
        })

        return new ChatGenerationChunk({
            message,
            text,
            generationInfo: baseChunk?.generationInfo
        })
    }

    private createToolCallChunk(toolPayload: string, baseChunk: ChatGenerationChunk) {
        let parsed: ToolCallPayload | undefined
        try {
            parsed = JSON.parse(toolPayload)
        } catch (error) {
            return this.createTextChunk(toolPayload, baseChunk)
        }

        if (!parsed?.name) {
            return this.createTextChunk(toolPayload, baseChunk)
        }

        const toolCallChunk = new AIMessageChunk({
            content: '',
            tool_calls: [
                {
                    id: `vnpt_tool_call_${Date.now().toString()}`,
                    type: 'tool_call',
                    name: parsed.name,
                    args: parsed.arguments ?? {}
                }
            ]
        })

        return new ChatGenerationChunk({
            message: toolCallChunk,
            text: '',
            generationInfo: baseChunk.generationInfo
        })
    }
}
