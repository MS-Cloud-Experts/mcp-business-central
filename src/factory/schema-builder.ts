import type { PropertyDef, EntityDefinition } from "../catalog/types.js";
import {
  buildFilterDescription,
  buildOrderbyDescription,
  buildSelectDescription,
} from "./description-builder.js";

interface JsonSchemaProperty {
  type: string;
  description: string;
  format?: string;
  enum?: string[];
}

interface InputSchema {
  type: "object";
  properties: Record<string, JsonSchemaProperty>;
  required?: string[];
}

function propToSchema(p: PropertyDef): JsonSchemaProperty {
  const s: JsonSchemaProperty = {
    type: p.type,
    description: p.description,
  };
  if (p.format) s.format = p.format;
  if (p.enum) s.enum = p.enum;
  return s;
}

function addKeyFields(
  entity: EntityDefinition,
  props: Record<string, JsonSchemaProperty>,
  required: string[]
): void {
  switch (entity.keyStrategy.kind) {
    case "uuid": {
      const f = entity.keyStrategy.field ?? "id";
      const def = entity.properties.find((p) => p.name === f);
      props[f] = def
        ? propToSchema(def)
        : { type: "string", format: "uuid", description: "Id" };
      required.push(f);
      break;
    }
    case "composite":
      for (const f of entity.keyStrategy.fields) {
        const def = entity.properties.find((p) => p.name === f);
        props[f] = def
          ? propToSchema(def)
          : { type: "string", description: f };
        required.push(f);
      }
      break;
    case "integer": {
      const f = entity.keyStrategy.field;
      const def = entity.properties.find((p) => p.name === f);
      props[f] = def
        ? propToSchema(def)
        : { type: "integer", description: f };
      required.push(f);
      break;
    }
  }
}

function odataListProps(
  entity: EntityDefinition
): Record<string, JsonSchemaProperty> {
  return {
    filter: {
      type: "string",
      description: buildFilterDescription(entity.properties),
    },
    orderby: {
      type: "string",
      description: buildOrderbyDescription(entity.properties),
    },
    select: {
      type: "string",
      description: buildSelectDescription(entity.properties),
    },
    top: {
      type: "number",
      description:
        "Maximum records to return (default/recommended: 10). Use with $skip for pagination.",
    },
    skip: {
      type: "number",
      description:
        "Number of records to skip before returning results. Use with $top for pagination.",
    },
  };
}

export function buildListSchema(entity: EntityDefinition): InputSchema {
  const props: Record<string, JsonSchemaProperty> = {};
  const required: string[] = [];

  if (entity.subEntityOf) {
    props[entity.subEntityOf.parentKeyParam] = {
      type: "string",
      format: "uuid",
      description: `Parent entity ${entity.subEntityOf.parentEntitySetName} id. Required to identify the sub entity.`,
    };
    required.push(entity.subEntityOf.parentKeyParam);
  }

  Object.assign(props, odataListProps(entity));

  return { type: "object", properties: props, ...(required.length ? { required } : {}) };
}

export function buildCreateSchema(entity: EntityDefinition): InputSchema {
  const props: Record<string, JsonSchemaProperty> = {};
  const required: string[] = [];

  if (entity.subEntityOf) {
    props[entity.subEntityOf.parentKeyParam] = {
      type: "string",
      format: "uuid",
      description: `Parent entity ${entity.subEntityOf.parentEntitySetName} id. Required to identify the sub entity.`,
    };
    required.push(entity.subEntityOf.parentKeyParam);
  }

  for (const p of entity.properties) {
    if (p.readOnly) continue;
    // Skip the auto-generated key for UUID-keyed entities on create
    const uuidKeyField = entity.keyStrategy.kind === "uuid" ? (entity.keyStrategy.field ?? "id") : null;
    if (uuidKeyField && p.name === uuidKeyField) continue;
    props[p.name] = propToSchema(p);
  }

  // For composite keys, the key fields are required on create
  if (entity.keyStrategy.kind === "composite") {
    for (const f of entity.keyStrategy.fields) {
      if (!required.includes(f)) required.push(f);
    }
  }

  props["select"] = {
    type: "string",
    description: buildSelectDescription(entity.properties),
  };

  return { type: "object", properties: props, ...(required.length ? { required } : {}) };
}

export function buildModifySchema(entity: EntityDefinition): InputSchema {
  const props: Record<string, JsonSchemaProperty> = {};
  const required: string[] = ["If-Match"];

  props["If-Match"] = {
    type: "string",
    description:
      'HTTP header for optimistic concurrency control when updating resources. Provide the "@odata.etag" value from a previous response to ensure the record hasn\'t changed since retrieval. Required for Modify operations to prevent overwriting concurrent changes.',
  };

  if (entity.subEntityOf) {
    props[entity.subEntityOf.parentKeyParam] = {
      type: "string",
      format: "uuid",
      description: `Parent entity ${entity.subEntityOf.parentEntitySetName} id. Required to identify the sub entity.`,
    };
    required.push(entity.subEntityOf.parentKeyParam);
  }

  // Add key fields as required
  addKeyFields(entity, props, required);

  // Add writable properties
  for (const p of entity.properties) {
    if (p.readOnly) continue;
    if (props[p.name]) continue; // already added as key
    props[p.name] = propToSchema(p);
  }

  props["select"] = {
    type: "string",
    description: buildSelectDescription(entity.properties),
  };

  return { type: "object", properties: props, required };
}

export function buildDeleteSchema(entity: EntityDefinition): InputSchema {
  const props: Record<string, JsonSchemaProperty> = {};
  const required: string[] = [];

  if (entity.subEntityOf) {
    props[entity.subEntityOf.parentKeyParam] = {
      type: "string",
      format: "uuid",
      description: `Parent entity ${entity.subEntityOf.parentEntitySetName} id. Required to identify the sub entity.`,
    };
    required.push(entity.subEntityOf.parentKeyParam);
  }

  // Key fields are required for delete
  addKeyFields(entity, props, required);

  // Include all properties (matching official connector pattern)
  for (const p of entity.properties) {
    if (props[p.name]) continue;
    props[p.name] = propToSchema(p);
  }

  props["select"] = {
    type: "string",
    description: buildSelectDescription(entity.properties),
  };

  return { type: "object", properties: props, required };
}

export function buildActionSchema(entity: EntityDefinition): InputSchema {
  const props: Record<string, JsonSchemaProperty> = {};
  const required: string[] = [];

  // Key fields required
  addKeyFields(entity, props, required);

  props["select"] = {
    type: "string",
    description: buildSelectDescription(entity.properties),
  };

  return { type: "object", properties: props, required };
}
