import test from "node:test";
import assert from "node:assert/strict";
import AlohaSamplePlugin from "../src/index.esm.js";
import { PluginContext, Plugin } from 'aloha-sdk'

class PluginContextMock extends PluginContext {
  async renderUrl(_url: string): Promise<string> {
    return ""
  }
}

test("validate-export", async () => {
  const plugin = new AlohaSamplePlugin(new PluginContextMock());
  assert.strict(plugin instanceof Plugin);
  assert.strict((await plugin.toolCall("tellTime", { format: "iso" })).startsWith(`The current time in \`iso\` is **`));
});

