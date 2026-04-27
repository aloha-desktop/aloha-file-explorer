import { PathName, Plugin, PluginContext } from 'aloha-sdk'
import fs from 'fs/promises'
import path from 'path'

export default class AlohaFileExplorerPlugin extends Plugin {
  constructor(context: PluginContext) {
    super(context)
  }

  async toolCall(toolName: string, toolArgs: Record<string, any>): Promise<string> {
    const includeHidden = toolArgs.includeHidden ?? false
    if (toolName === "searchFile") {
      return await this.searchFile(toolArgs.keywords, toolArgs.directory, includeHidden)
    }
    if (toolName === "searchDirectory") {
      return await this.searchDirectory(toolArgs.keywords, toolArgs.directory, includeHidden)
    }
    throw new Error(`Tool ${toolName} is not available`)
  }

  computeScore(filename: string, keywordsList: string[]): number {
    let score = 0
    const lowerFilename = filename.toLowerCase()
    for (const keyword of keywordsList) {
      if (keyword && lowerFilename.includes(keyword.toLowerCase())) {
        score++
      }
    }
    return score
  }

  async searchFile(keywords: string, directoryType: PathName, includeHidden: boolean): Promise<string> {
    const directory = this.getContext().getPath(directoryType)

    const keywordsList = keywords.split(/\s+/) // split by one or more whitespace characters
    const results = new Map<string, number>()

    const searchDir = async (dir: string) => {
      const files = await fs.readdir(dir, { withFileTypes: true })
      for (const file of files) {
        if (!includeHidden && file.name.startsWith('.')) continue
        const fullPath = path.join(dir, file.name)
        if (file.isDirectory()) {
          await searchDir(fullPath).catch(() => { })
        } else {
          const score = this.computeScore(file.name, keywordsList)
          if (score > 0) {
            results.set(fullPath, score)
          }
        }
      }
    }

    try {
      await searchDir(directory)
    } catch (e) {
      return `Error searching directory: ${(e as Error).message}`
    }

    if (results.size === 0) {
      return `No files found in ${directoryType} folder matching the keywords \`${keywords}\`.`
    }

    const sortedResults = Array.from(results.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(entry => entry[0])

    return `Found ${results.size === 1 ? '1 file' : `${results.size} files`} in ${directoryType} folder matching the keywords \`${keywords}\`:
      \n${sortedResults.map((r, i) => `${i + 1}. ${this.formatFilePath(directory, r)}`).join('\n')}
      \nClick on the link to show the file in the enclosing folder.
    `
  }

  async searchDirectory(keywords: string, directoryType: PathName, includeHidden: boolean): Promise<string> {
    const directory = this.getContext().getPath(directoryType)

    const keywordsList = keywords.split(/\s+/) // split by one or more whitespace characters
    const results = new Map<string, number>()

    const searchDir = async (dir: string) => {
      const files = await fs.readdir(dir, { withFileTypes: true })
      for (const file of files) {
        if (!includeHidden && file.name.startsWith('.')) continue
        const fullPath = path.join(dir, file.name)
        if (file.isDirectory()) {
          const score = this.computeScore(file.name, keywordsList)
          if (score > 0) {
            results.set(fullPath, score)
          }
          await searchDir(fullPath).catch(() => { })
        }
      }
    }

    try {
      await searchDir(directory)
    } catch (e) {
      return `Error searching directory: ${(e as Error).message}`
    }

    if (results.size === 0) {
      return `No directories found in ${directoryType} folder matching the keywords \`${keywords}\`.`
    }

    const sortedResults = Array.from(results.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(entry => entry[0])

    return `Found ${results.size === 1 ? '1 directory' : `${results.size} directories`} in ${directoryType} folder matching the keywords \`${keywords}\`:
      \n${sortedResults.map((r, i) => `${i + 1}. ${this.formatFilePath(directory, r)}`).join('\n')}
      \nClick on the link to show the directory in the enclosing folder.
    `
  }

  formatFilePath(directoryPrefix: string, filePath: string): string {
    const directoryLessPath = filePath.replace(new RegExp(`^${directoryPrefix}\/?`), '')
    const url = encodeURI(`file://${filePath}`) // url need to be encoded for special characters, otherwise it won't be rendered as link
    return `[${directoryLessPath}](${url})`
  }
}