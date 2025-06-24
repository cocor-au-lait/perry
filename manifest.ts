import { Manifest } from "deno-slack-sdk/mod.ts";

import AtlassianProvider from "./external_auth/atlassian-provider.ts";
import DailyReportWorkflow from "./workflows/daily-report.ts";
import AtlassianResourceType from "./types/atlassian-resource.ts";
import TempoWorklogType from "./types/tempo-worklog.ts";
import TempoProvider from "./external_auth/tempo-provider.ts";
import AtlassianAccountType from "./types/atlassian-account.ts";

export default Manifest({
  name: "Perry",
  description: "🚢",
  icon: "assets/icon.png",
  types: [AtlassianResourceType, AtlassianAccountType, TempoWorklogType],
  externalAuthProviders: [AtlassianProvider, TempoProvider],
  workflows: [DailyReportWorkflow],
  botScopes: ["commands", "chat:write", "chat:write.public"],
  outgoingDomains: ["api.atlassian.com", "api.tempo.io"],
});
