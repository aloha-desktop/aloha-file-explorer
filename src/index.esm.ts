import { Plugin, PluginContext } from 'aloha-sdk'

export default class AlohaFileExplorerPlugin extends Plugin {
  constructor(context: PluginContext) {
    super(context)
  }

  async toolCall(toolName: string, _toolArgs: Record<string, any>): Promise<string> {
    throw new Error(`Tool ${toolName} is not available`)
  }
}