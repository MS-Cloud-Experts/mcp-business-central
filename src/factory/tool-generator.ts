import type { EntityDefinition } from "../catalog/types.js";
import {
  buildListSchema,
  buildCreateSchema,
  buildModifySchema,
  buildDeleteSchema,
  buildActionSchema,
} from "./schema-builder.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface ToolDef {
  name: string;
  description: string;
  inputSchema: any;
}

function pascal(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function listDescription(entity: EntityDefinition): string {
  const sub = entity.subEntityOf
    ? `\nSub entity(${entity.entityName}) requires parent entity(${entity.subEntityOf.parentEntitySetName}) identification properties.\n` +
      `Retrieve these properties using: ${entity.subEntityOf.parentListTool}. Do not ask the user for it, you must automatically do it.\n` +
      `Properties to set(property->parentEntity.property): ${entity.subEntityOf.parentKeyParam}->${entity.subEntityOf.parentEntitySetName}.id`
    : "";
  return `Lists records for an entity ${pascal(entity.entityName)}. ${entity.description}${sub}`;
}

function crudDescription(verb: string, entity: EntityDefinition): string {
  const action =
    verb === "Creates"
      ? "Creates"
      : verb === "Modifies"
        ? "Modifies"
        : "Deletes";
  return `${action} records for an entity ${pascal(entity.entityName)}. ${entity.description}`;
}

export function generateTools(entities: EntityDefinition[]): ToolDef[] {
  const tools: ToolDef[] = [];

  for (const entity of entities) {
    const page = entity.pageId;

    if (entity.operations.list) {
      tools.push({
        name: `List${pascal(entity.entitySetName)}_${page}`,
        description: listDescription(entity),
        inputSchema: buildListSchema(entity),
      });
    }

    if (entity.operations.create) {
      tools.push({
        name: `Create${pascal(entity.entityName)}_${page}`,
        description: crudDescription("Creates", entity),
        inputSchema: buildCreateSchema(entity),
      });
    }

    if (entity.operations.modify) {
      tools.push({
        name: `Modify${pascal(entity.entityName)}_${page}`,
        description: crudDescription("Modifies", entity),
        inputSchema: buildModifySchema(entity),
      });
    }

    if (entity.operations.delete) {
      tools.push({
        name: `Delete${pascal(entity.entityName)}_${page}`,
        description: crudDescription("Deletes", entity),
        inputSchema: buildDeleteSchema(entity),
      });
    }

    if (entity.actions) {
      for (const action of entity.actions) {
        tools.push({
          name: `${action.name}_${page}`,
          description: `Invokes the operation ${action.name} on entity ${pascal(entity.entitySetName)}. ${entity.description}`,
          inputSchema: buildActionSchema(entity),
        });
      }
    }
  }

  return tools;
}
