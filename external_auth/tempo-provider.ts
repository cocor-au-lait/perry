import { DefineOAuth2Provider, Schema } from "deno-slack-sdk/mod.ts";

import "std/dotenv/load.ts";

const TempoProvider = DefineOAuth2Provider({
  provider_key: "tempo",
  provider_type: Schema.providers.oauth2.CUSTOM,
  options: {
    provider_name: "Tempo",
    authorization_url: `https://${Deno.env.get(
      "ATLASSIAN_ORGANIZATION_NAME",
    )!}.atlassian.net/plugins/servlet/ac/io.tempo.jira/oauth-authorize`,
    token_url: "https://api.tempo.io/oauth/token",
    client_id: Deno.env.get("TEMPO_CLIENT_ID")!,
    scope: [],
    identity_config: {
      url: "https://postman-echo.com/get",
      account_identifier: "$.headers.user-agent",
    },
  },
});

export default TempoProvider;
