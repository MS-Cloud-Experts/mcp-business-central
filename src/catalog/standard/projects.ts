import type { EntityDefinition } from "../types.js";
import { str, uuid, date, datetime, decimal, bool, ro } from "../helpers.js";

const fullCrud = { list: true, create: true, modify: true, delete: true };

export const projects: EntityDefinition = {
  entityName: "project",
  entitySetName: "projects",
  pageId: "PAG30050",
  apiBase: "standard",
  description:
    "Manages project (job) records including customer assignment, dates, status, and financial totals for project-based billing and tracking.",
  keyStrategy: { kind: "uuid" },
  operations: fullCrud,
  properties: [
    uuid("id", "Id"),
    str("number", "Number"),
    str("displayName", "Display Name"),
    str("customerNumber", "Customer Number"),
    str("customerName", "Customer Name"),
    str("type", "Type"),
    str("status", "Status"),
    str("projectManager", "Project Manager"),
    date("startingDate", "Starting Date"),
    date("endingDate", "Ending Date"),
    str("currencyCode", "Currency Code"),
    bool("blocked", "Blocked"),
    ro(datetime("lastModifiedDateTime", "Last Modified Date-Time")),
  ],
};

export const projectEntities: EntityDefinition[] = [projects];
