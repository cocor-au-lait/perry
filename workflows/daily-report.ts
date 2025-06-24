import { DefineWorkflow, Schema } from "deno-slack-sdk/mod.ts";

import { GenerateDailyReportMessageDefinision } from "../functions/generate-daily-report-message.ts";
import { SendMessageDefinition } from "../functions/send-message.ts";

const Workflow = DefineWorkflow({
  callback_id: "daily_report",
  title: "Daily Report",
  input_parameters: {
    properties: {
      interactivity: {
        type: Schema.slack.types.interactivity,
      },
      channelId: {
        type: Schema.slack.types.channel_id,
      },
      userId: {
        type: Schema.slack.types.user_id,
      },
    },
    required: ["interactivity", "channelId", "userId"],
  },
});

const generateDailyReportMessageStep = Workflow.addStep(
  GenerateDailyReportMessageDefinision,
  {
    interactivity: Workflow.inputs.interactivity,
    userId: Workflow.inputs.userId,
    atlassianAccessTokenId: {
      credential_source: "END_USER",
      user_context_source: "LAST_INTERACTOR",
    },
    tempoAccessTokenId: {
      credential_source: "END_USER",
      user_context_source: "LAST_INTERACTOR",
    },
    atlassianOrganizationName: Deno.env.get("ATLASSIAN_ORGANIZATION_NAME"),
  },
);

Workflow.addStep(SendMessageDefinition, {
  channelId: Workflow.inputs.channelId,
  message: generateDailyReportMessageStep.outputs.message,
});

export default Workflow;
