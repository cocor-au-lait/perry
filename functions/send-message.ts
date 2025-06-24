import { DefineFunction, Schema, SlackFunction } from "deno-slack-sdk/mod.ts";

export const SendMessageDefinition = DefineFunction({
  callback_id: "send_message",
  title: "Send message",
  source_file: "functions/send-message.ts",
  input_parameters: {
    properties: {
      channelId: {
        type: Schema.slack.types.channel_id,
      },
      message: {
        type: Schema.slack.types.blocks,
      },
    },
    required: ["channelId", "message"],
  },
});

export default SlackFunction(
  SendMessageDefinition,
  async ({ inputs, client }) => {
    await client.chat.postMessage({
      channel: inputs.channelId,
      blocks: inputs.message,
    });

    return { outputs: {} };
  },
);
