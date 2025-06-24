import { DefineType, Schema } from "deno-slack-sdk/mod.ts";

const TempoWorklogType = DefineType({
  name: "TempoWorklog",
  type: Schema.types.object,
  properties: {
    issueId: {
      type: Schema.types.number,
    },
    duration: {
      type: Schema.types.number,
    },
    description: {
      type: Schema.types.string,
    },
  },
  required: ["issueId", "duration", "description"],
});

export default TempoWorklogType;
