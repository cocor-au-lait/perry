import { DefineType, Schema } from "deno-slack-sdk/mod.ts";

const AtlassianResourceType = DefineType({
  name: "AtlassianResource",
  type: Schema.types.object,
  properties: {
    id: {
      type: Schema.types.string,
    },
    name: {
      type: Schema.types.string,
    },
    avatarUrl: {
      type: Schema.types.string,
    },
  },
  required: ["id", "name", "avatarUrl"],
});

export default AtlassianResourceType;
