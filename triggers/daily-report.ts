import { Trigger } from "deno-slack-api/types.ts";
import { TriggerContextData } from "deno-slack-api/mod.ts";

import Workflow from "../workflows/daily-report.ts";

const trigger: Trigger<typeof Workflow.definition> = {
  type: "shortcut",
  name: "Generate Daily Report",
  workflow: `#/workflows/${Workflow.definition.callback_id}`,
  inputs: {
    interactivity: {
      value: TriggerContextData.Shortcut.interactivity,
    },
    channelId: {
      value: TriggerContextData.Shortcut.channel_id,
    },
    userId: {
      value: TriggerContextData.Shortcut.user_id,
    },
  },
};

export default trigger;
