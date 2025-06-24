import { format } from "@formkit/tempo";
import { DefineFunction, Schema, SlackFunction } from "deno-slack-sdk/mod.ts";
// @deno-types="@types/humanize-duration"
import humanizeDuration from "humanize-duration";
import ky, { HTTPError } from "ky";

const LIMIT = 50;

const formatDuration = humanizeDuration.humanizer({
  language: "ja",
  delimiter: "",
  spacer: "",
});

interface ResourceResponse {
  id: string;
  name: string;
  url: string;
  scopes: string[];
  avatarUrl: string;
}

interface AccountResponse {
  accountId: string;
  avatarUrls: Record<"16x16" | "24x24" | "32x32" | "48x48", string>;
  displayName: string;
  emailAddress: string;
}

interface WorklogResultResponse {
  issue: {
    id: number;
  };
  timeSpentSeconds: number;
  description: string;
}

interface WorklogResponse {
  metadata: {
    count: number;
    previous?: string;
    next?: string;
  };
  results: WorklogResultResponse[];
}

interface IssueReponse {
  key: string;
  fields: {
    summary: string;
  };
}

export const GenerateDailyReportMessageDefinision = DefineFunction({
  callback_id: "generate_daily_report_message",
  title: "Generate Daily Report Message",
  source_file: "functions/generate-daily-report-message.ts",
  input_parameters: {
    properties: {
      interactivity: {
        type: Schema.slack.types.interactivity,
      },
      userId: {
        type: Schema.slack.types.user_id,
      },
      atlassianAccessTokenId: {
        type: Schema.slack.types.oauth2,
        oauth2_provider_key: "atlassian",
      },
      tempoAccessTokenId: {
        type: Schema.slack.types.oauth2,
        oauth2_provider_key: "tempo",
      },
      atlassianOrganizationName: {
        type: Schema.types.string,
      },
    },
    required: [
      "interactivity",
      "userId",
      "atlassianAccessTokenId",
      "tempoAccessTokenId",
      "atlassianOrganizationName",
    ],
  },
  output_parameters: {
    properties: {
      message: {
        type: Schema.slack.types.blocks,
      },
    },
    required: ["message"],
  },
});

export default SlackFunction(
  GenerateDailyReportMessageDefinision,
  async ({ inputs, client }) => {
    const atlassianToken = await client.apps.auth.external.get({
      external_token_id: inputs.atlassianAccessTokenId,
    });
    if (!atlassianToken.ok) {
      const error =
        `Failed to retrieve the external auth due to ${atlassianToken.error}`;
      return { error };
    }

    const resourceResponseResponse = await ky
      .get("https://api.atlassian.com/oauth/token/accessible-resources", {
        headers: {
          Authorization: `Bearer ${atlassianToken.external_token}`,
        },
      });

    const resourceResponse = await resourceResponseResponse.json<
      ResourceResponse[]
    >();

    const resource = resourceResponse
      .map(({ id, name, avatarUrl }) => ({
        id,
        name,
        avatarUrl,
      }))
      .find(({ name }) => name === inputs.atlassianOrganizationName);

    if (!resource) {
      const error =
        `Atlassian organization resource not found: ${inputs.atlassianOrganizationName}`;
      return { error };
    }

    const { accountId, avatarUrls, displayName, emailAddress } = await ky
      .get(
        `https://api.atlassian.com/ex/jira/${resource.id}/rest/api/3/myself`,
        {
          headers: {
            Authorization: `Bearer ${atlassianToken.external_token}`,
          },
        },
      )
      .json<AccountResponse>();

    const account = {
      id: accountId,
      name: displayName,
      email: emailAddress,
      avatarUrl: avatarUrls["48x48"],
    };

    const modalResult = await client.views.open({
      interactivity_pointer: inputs.interactivity.interactivity_pointer,
      view: {
        type: "modal",
        callback_id: "form",
        notify_on_close: true,
        title: { type: "plain_text", text: "Generate daily report" },
        submit: { type: "plain_text", text: "Next" },
        close: { type: "plain_text", text: "Cancel" },
        private_metadata: JSON.stringify({
          accountId: account.id,
          resourceId: resource.id,
          resourceName: resource.name,
        }),
        blocks: [
          {
            type: "input",
            block_id: "date",
            label: { type: "plain_text", text: "Date" },
            element: {
              type: "datepicker",
              action_id: "action",
              initial_date: format(new Date(), "YYYY-MM-DD"),
            },
          },
        ],
      },
    });
    if (modalResult.error) {
      const error = `Failed to open a modal (error: ${modalResult.error})`;
      return { error };
    }

    return {
      completed: false,
    };
  },
)
  .addViewSubmissionHandler("form", async ({ client, view, inputs }) => {
    const date = view.state.values.date.action.selected_date;

    if (!date) {
      return {
        response_action: "errors",
        errors: { date: "Required field" },
      };
    }

    const atlassianToken = await client.apps.auth.external.get({
      external_token_id: inputs.atlassianAccessTokenId,
    });
    if (!atlassianToken.ok) {
      const error =
        `Failed to retrieve the external auth due to ${atlassianToken.error}`;
      return { error };
    }

    const tempoToken = await client.apps.auth.external.get({
      external_token_id: inputs.tempoAccessTokenId,
    });
    if (!tempoToken.ok) {
      const error =
        `Failed to retrieve the external auth due to ${tempoToken.error}`;
      return { error };
    }

    const { accountId, resourceId, resourceName } = JSON.parse(
      view.private_metadata!,
    );

    const totalResults: WorklogResultResponse[] = [];

    let offset = 0;
    while (true) {
      const { metadata, results } = await ky
        .get(`https://api.tempo.io/4/worklogs/user/${accountId}`, {
          headers: {
            Authorization: `Bearer ${tempoToken.external_token}`,
          },
          searchParams: {
            from: date,
            to: date,
            limit: LIMIT,
            offset,
          },
        })
        .json<WorklogResponse>();

      totalResults.push(...results);

      if (!metadata.next) {
        break;
      }
      offset++;
    }

    const worklogs = await Promise.all(
      totalResults.map(async ({ issue, timeSpentSeconds, description }) => {
        let key = "-";
        let summary = "Not found";
        try {
          const res = await ky.get(
            `https://api.atlassian.com/ex/jira/${resourceId}/rest/api/3/issue/${issue.id}`,
            {
              headers: {
                Authorization: `Bearer ${atlassianToken.external_token}`,
              },
              searchParams: new URLSearchParams([
                ...["key", "summary"].map((v) => ["fields", v]),
              ]),
            },
          );
          if (res.status === 200) {
            const data = await res.json<IssueReponse>();
            key = data.key;
            summary = data.fields.summary;
          } else if (res.status === 404) {
            // Not found fallback
            key = issue.id.toString();
            summary = "Not found";
          } else {
            throw new Error(`Unexpected status: ${res.status}`);
          }
        } catch (e) {
          if (
            e instanceof HTTPError &&
            e.response?.status === 404
          ) {
            key = issue.id.toString();
            summary = "Not found";
          } else {
            throw e;
          }
        }
        return {
          issue: {
            key,
            url: `https://${resourceName}.atlassian.net/browse/${key}`,
            summary,
          },
          duration: timeSpentSeconds,
          description,
        };
      }),
    );

    const totalDuration = worklogs.reduce(
      (acc, { duration }) => acc + duration,
      0,
    );

    const worklogBlocks = worklogs.map(({ issue, duration, description }) => {
      const elements = [
        {
          type: "mrkdwn",
          text: `:ticket: <${issue.url}|${issue.key}>`,
        },
        {
          type: "mrkdwn",
          text: `:hourglass: ${formatDuration(duration * 1000)}`,
        },
      ];

      const hasDescription = Boolean(description);

      if (description) {
        elements.push({
          type: "mrkdwn",
          text: `:speech_balloon: ${description.replaceAll("\n", " ")}`,
        });
      }

      return {
        blocks: [
          { type: "divider" },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*${issue.summary}*`,
            },
          },
          {
            type: "context",
            elements,
          },
        ],
        hasDescription,
      };
    });

    const infoBlock = {
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: `:calendar: \`${date}\``,
        },
        {
          type: "mrkdwn",
          text: `:bust_in_silhouette: <@${inputs.userId}>`,
        },
        {
          type: "mrkdwn",
          text: `:hourglass: ${formatDuration(totalDuration * 1000)}`,
        },
      ],
    };

    const blocks = [
      infoBlock,
      ...worklogBlocks
        .flatMap(({ blocks, hasDescription }) => {
          if (!hasDescription) {
            return [
              ...blocks,
              {
                type: "context",
                elements: [
                  {
                    type: "mrkdwn",
                    text: ":warning: *You forgot to write worklog description*",
                  },
                ],
              },
            ];
          }
          return blocks;
        }),
    ];

    const message = [
      infoBlock,
      ...worklogBlocks
        .flatMap(({ blocks }) => blocks),
    ];

    return {
      response_action: "update",
      view: {
        type: "modal",
        callback_id: "review",
        notify_on_close: true,
        title: { type: "plain_text", text: "Review daily report" },
        submit: { type: "plain_text", text: "Submit" },
        close: { type: "plain_text", text: "Cancel" },
        private_metadata: JSON.stringify({ message }),
        blocks,
      },
    };
  })
  .addViewSubmissionHandler("review", async ({ body, client, view }) => {
    const { message } = JSON.parse(view.private_metadata!);

    await client.functions.completeSuccess({
      function_execution_id: body.function_data.execution_id,
      outputs: { message },
    });
  });
