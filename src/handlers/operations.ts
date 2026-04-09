import type { EntityDefinition } from "../catalog/types.js";
import type { ODataParams } from "../client/url-builder.js";
import { BCClient } from "../client/bc-client.js";

const client = new BCClient();

const ODATA_KEYS = new Set(["filter", "orderby", "select", "top", "skip"]);

function getKeyFields(entity: EntityDefinition): string[] {
  switch (entity.keyStrategy.kind) {
    case "uuid":
      return [entity.keyStrategy.field ?? "id"];
    case "composite":
      return entity.keyStrategy.fields;
    case "integer":
      return [entity.keyStrategy.field];
  }
}

function separateArgs(
  entity: EntityDefinition,
  args: Record<string, unknown>
): {
  keys: Record<string, string | number>;
  odata: ODataParams;
  body: Record<string, unknown>;
  etag?: string;
  parentId?: string;
} {
  const keys: Record<string, string | number> = {};
  const odata: ODataParams = {};
  const body: Record<string, unknown> = {};
  let etag: string | undefined;
  let parentId: string | undefined;

  const keyFields = new Set(getKeyFields(entity));
  const parentKeyParam = entity.subEntityOf?.parentKeyParam;

  for (const [k, v] of Object.entries(args)) {
    if (k === "If-Match") {
      etag = v as string;
    } else if (parentKeyParam && k === parentKeyParam) {
      parentId = v as string;
    } else if (keyFields.has(k)) {
      keys[k] = v as string | number;
    } else if (ODATA_KEYS.has(k)) {
      (odata as Record<string, unknown>)[k] = v;
    } else {
      body[k] = v;
    }
  }

  return { keys, odata, body, etag, parentId };
}

function formatResult(data: unknown): { content: Array<{ type: string; text: string }> } {
  return {
    content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
  };
}

function formatError(err: unknown): { content: Array<{ type: string; text: string }>; isError: true } {
  const message = err instanceof Error ? err.message : String(err);
  return {
    content: [{ type: "text", text: `Error: ${message}` }],
    isError: true,
  };
}

export async function handleList(
  entity: EntityDefinition,
  args: Record<string, unknown>
) {
  try {
    const { odata, parentId } = separateArgs(entity, args);
    const result = await client.list(entity, { ...odata, parentId });
    return formatResult(result);
  } catch (err) {
    return formatError(err);
  }
}

export async function handleCreate(
  entity: EntityDefinition,
  args: Record<string, unknown>
) {
  try {
    const { body, parentId } = separateArgs(entity, args);
    // Remove 'select' from body — it's an OData param, not entity data
    delete body["select"];
    const result = await client.create(entity, body, parentId);
    return formatResult(result);
  } catch (err) {
    return formatError(err);
  }
}

export async function handleModify(
  entity: EntityDefinition,
  args: Record<string, unknown>
) {
  try {
    const { keys, body, etag, parentId } = separateArgs(entity, args);
    if (!etag) {
      return formatError(
        new Error(
          "If-Match (etag) is required for Modify operations. Fetch the record first to get the @odata.etag value."
        )
      );
    }
    delete body["select"];
    const result = await client.modify(entity, keys, body, etag, parentId);
    return formatResult(result);
  } catch (err) {
    return formatError(err);
  }
}

export async function handleDelete(
  entity: EntityDefinition,
  args: Record<string, unknown>
) {
  try {
    const { keys, parentId } = separateArgs(entity, args);
    const result = await client.delete(entity, keys, parentId);
    return formatResult(result);
  } catch (err) {
    return formatError(err);
  }
}

export async function handleAction(
  entity: EntityDefinition,
  actionName: string,
  args: Record<string, unknown>
) {
  try {
    const { keys } = separateArgs(entity, args);
    const result = await client.action(entity, keys, actionName);
    return formatResult(result);
  } catch (err) {
    return formatError(err);
  }
}
