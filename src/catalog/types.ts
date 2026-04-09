export interface PropertyDef {
  name: string;
  type: "string" | "number" | "integer" | "boolean";
  format?: "uuid" | "date" | "date-time" | "decimal" | "int32";
  description: string;
  enum?: string[];
  readOnly?: boolean;
}

export type KeyStrategy =
  | { kind: "uuid"; field?: string }    // defaults to "id"; use "systemId" for custom entities
  | { kind: "composite"; fields: string[] }
  | { kind: "integer"; field: string };

export interface SubEntityRelation {
  parentEntitySetName: string;
  parentKeyParam: string;
  parentDescription: string;
  parentListTool: string;
}

export interface ActionDef {
  name: string;
  description: string;
}

export interface EntityDefinition {
  entityName: string;
  entitySetName: string;
  pageId: string;
  apiBase: "standard" | "custom";
  description: string;
  properties: PropertyDef[];
  keyStrategy: KeyStrategy;
  operations: { list: boolean; create: boolean; modify: boolean; delete: boolean };
  subEntityOf?: SubEntityRelation;
  actions?: ActionDef[];
}
