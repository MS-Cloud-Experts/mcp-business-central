import type { PropertyDef } from "../catalog/types.js";

function propTag(p: PropertyDef): string {
  let tag = p.name;
  const parts: string[] = [p.type];
  if (p.format) parts.push(p.format);
  tag += ` [${parts.join("/")}]`;
  return tag;
}

export function buildFilterDescription(properties: PropertyDef[]): string {
  const list = properties.map(propTag).join(", ");
  return (
    `OData V4.0 filter syntax. For strings, use contains(property,'text') for partial matches or eq for exact. ` +
    `Other operators: ne, gt, lt, and, not. ` +
    `Examples: "contains(name,'John')", "status eq 'Active'". ` +
    `Available properties: ${list}`
  );
}

export function buildOrderbyDescription(properties: PropertyDef[]): string {
  const list = properties.map((p) => p.name).join(", ");
  return `OData V4.0 orderby (e.g. 'property asc', 'property1 desc, property2'). Available properties: ${list}`;
}

export function buildSelectDescription(properties: PropertyDef[]): string {
  const list = properties.map((p) => p.name).join(", ");
  return `Comma-separated list of properties to include in the response, e.g., "select=name,id". Returns all if not specified. Available properties: ${list}`;
}
