import { DefineType, Schema } from "deno-slack-sdk/mod.ts";

const AtlassianAccountType = DefineType({
  name: "AtlassianAccount",
  type: Schema.types.object,
  properties: {
    id: {
      type: Schema.types.string,
    },
    name: {
      type: Schema.types.string,
    },
    email: {
      type: Schema.types.string,
    },
    avatarUrl: {
      type: Schema.types.string,
    },
  },
  required: ["id", "name", "email", "avatarUrl"],
});

export default AtlassianAccountType;
