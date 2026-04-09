import { CONFIG } from "../config.js";
import type { EntityDefinition, KeyStrategy } from "../catalog/types.js";

export interface ODataParams {
  filter?: string;
  orderby?: string;
  select?: string;
  top?: number;
  skip?: number;
}

function getBase(apiBase: "standard" | "custom"): string {
  return apiBase === "standard" ? CONFIG.standardBase : CONFIG.customBase;
}

function appendODataParams(url: string, params: ODataParams): string {
  const qs = new URLSearchParams();
  if (params.filter) qs.append("$filter", params.filter);
  if (params.orderby) qs.append("$orderby", params.orderby);
  if (params.select) qs.append("$select", params.select);
  if (params.top != null) qs.append("$top", params.top.toString());
  if (params.skip != null) qs.append("$skip", params.skip.toString());
  const str = qs.toString();
  return str ? `${url}?${str}` : url;
}

function buildKeySegment(
  keyStrategy: KeyStrategy,
  keys: Record<string, string | number>
): string {
  switch (keyStrategy.kind) {
    case "uuid": {
      const field = keyStrategy.field ?? "id";
      return `(${keys[field]})`;
    }
    case "composite":
      // Named key-value pairs: (jobNo='J001',jobTaskNo='100')
      return (
        "(" +
        keyStrategy.fields
          .map((f) => {
            const v = keys[f];
            return typeof v === "string" ? `${f}='${v}'` : `${f}=${v}`;
          })
          .join(",") +
        ")"
      );
    case "integer":
      return `(${keys[keyStrategy.field]})`;
  }
}

export function buildListUrl(
  entity: EntityDefinition,
  companyId: string,
  params: ODataParams & { parentId?: string }
): string {
  const base = getBase(entity.apiBase);
  let url: string;

  if (entity.subEntityOf && params.parentId) {
    url = `${base}/companies(${companyId})/${entity.subEntityOf.parentEntitySetName}(${params.parentId})/${entity.entitySetName}`;
  } else {
    url = `${base}/companies(${companyId})/${entity.entitySetName}`;
  }

  return appendODataParams(url, params);
}

export function buildCreateUrl(
  entity: EntityDefinition,
  companyId: string,
  parentId?: string
): string {
  const base = getBase(entity.apiBase);
  if (entity.subEntityOf && parentId) {
    return `${base}/companies(${companyId})/${entity.subEntityOf.parentEntitySetName}(${parentId})/${entity.entitySetName}`;
  }
  return `${base}/companies(${companyId})/${entity.entitySetName}`;
}

export function buildSingleUrl(
  entity: EntityDefinition,
  companyId: string,
  keys: Record<string, string | number>,
  parentId?: string
): string {
  const base = getBase(entity.apiBase);
  const keySegment = buildKeySegment(entity.keyStrategy, keys);

  if (entity.subEntityOf && parentId) {
    return `${base}/companies(${companyId})/${entity.subEntityOf.parentEntitySetName}(${parentId})/${entity.entitySetName}${keySegment}`;
  }
  return `${base}/companies(${companyId})/${entity.entitySetName}${keySegment}`;
}

export function buildActionUrl(
  entity: EntityDefinition,
  companyId: string,
  keys: Record<string, string | number>,
  actionName: string
): string {
  const base = getBase(entity.apiBase);
  const keySegment = buildKeySegment(entity.keyStrategy, keys);
  return `${base}/companies(${companyId})/${entity.entitySetName}${keySegment}/Microsoft.NAV.${actionName}`;
}
