import { DefineOAuth2Provider, Schema } from "deno-slack-sdk/mod.ts";
import "std/dotenv/load.ts";

const AtlassianProvider = DefineOAuth2Provider({
  provider_key: "atlassian",
  provider_type: Schema.providers.oauth2.CUSTOM,
  options: {
    provider_name: "Atlassian",
    authorization_url: "https://auth.atlassian.com/authorize",
    token_url: "https://auth.atlassian.com/oauth/token",
    client_id: Deno.env.get("ATLASSIAN_CLIENT_ID")!,
    scope: ["read:me", "read:jira-user", "read:jira-work"],
    identity_config: {
      url: "https://id.atlassian.com/gateway/api/me",
      account_identifier: "$.email",
    },
  },
});

export default AtlassianProvider;
