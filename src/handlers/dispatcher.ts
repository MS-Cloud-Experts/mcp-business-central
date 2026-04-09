import type { EntityDefinition } from "../catalog/types.js";
import { allEntities } from "../catalog/index.js";
import { generateTools, type ToolDef } from "../factory/tool-generator.js";
import {
  handleList,
  handleCreate,
  handleModify,
  handleDelete,
  handleAction,
} from "./operations.js";

interface ToolRoute {
  entity: EntityDefinition;
  operation: "list" | "create" | "modify" | "delete" | "action";
  actionName?: string;
}

// Build the tool registry at import time
const toolRoutes = new Map<string, ToolRoute>();
const allTools: ToolDef[] = generateTools(allEntities);

// Parse tool names to build route map
for (const entity of allEntities) {
  const page = entity.pageId;
  const pascal = entity.entitySetName.charAt(0).toUpperCase() + entity.entitySetName.slice(1);
  const pascalSingular = entity.entityName.charAt(0).toUpperCase() + entity.entityName.slice(1);

  if (entity.operations.list) {
    toolRoutes.set(`List${pascal}_${page}`, {
      entity,
      operation: "list",
    });
  }
  if (entity.operations.create) {
    toolRoutes.set(`Create${pascalSingular}_${page}`, {
      entity,
      operation: "create",
    });
  }
  if (entity.operations.modify) {
    toolRoutes.set(`Modify${pascalSingular}_${page}`, {
      entity,
      operation: "modify",
    });
  }
  if (entity.operations.delete) {
    toolRoutes.set(`Delete${pascalSingular}_${page}`, {
      entity,
      operation: "delete",
    });
  }
  if (entity.actions) {
    for (const action of entity.actions) {
      toolRoutes.set(`${action.name}_${page}`, {
        entity,
        operation: "action",
        actionName: action.name,
      });
    }
  }
}

export function getTools(): ToolDef[] {
  return allTools;
}

export async function dispatch(
  toolName: string,
  args: Record<string, unknown> = {}
) {
  const route = toolRoutes.get(toolName);
  if (!route) {
    return {
      content: [{ type: "text", text: `Error: Unknown tool '${toolName}'` }],
      isError: true,
    };
  }

  switch (route.operation) {
    case "list":
      return handleList(route.entity, args);
    case "create":
      return handleCreate(route.entity, args);
    case "modify":
      return handleModify(route.entity, args);
    case "delete":
      return handleDelete(route.entity, args);
    case "action":
      return handleAction(route.entity, route.actionName!, args);
  }
}
