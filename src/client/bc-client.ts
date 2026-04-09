import type { EntityDefinition } from "../catalog/types.js";
import type { ODataParams } from "./url-builder.js";
import { AuthProvider } from "./auth.js";
import { CompanyResolver } from "./company-resolver.js";
import {
  buildListUrl,
  buildCreateUrl,
  buildSingleUrl,
  buildActionUrl,
} from "./url-builder.js";

export class BCApiError extends Error {
  constructor(
    public statusCode: number,
    public bcErrorCode: string,
    public bcMessage: string
  ) {
    super(`BC API ${statusCode}: ${bcMessage} [${bcErrorCode}]`);
    this.name = "BCApiError";
  }
}

export class BCClient {
  private auth = new AuthProvider();
  private companyResolver = new CompanyResolver();

  private async getCompanyId(): Promise<string> {
    return this.companyResolver.resolve(async (url) => {
      const token = await this.auth.getToken();
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        throw new Error(
          `Failed to resolve company: ${res.status} ${await res.text()}`
        );
      }
      return res.json() as Promise<{ value: Array<{ id: string }> }>;
    });
  }

  private async request(
    method: string,
    url: string,
    options?: {
      body?: Record<string, unknown>;
      etag?: string;
    }
  ): Promise<unknown> {
    const token = await this.auth.getToken();
    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    if (options?.etag) {
      headers["If-Match"] = options.etag;
    }

    const res = await fetch(url, {
      method,
      headers,
      body: options?.body ? JSON.stringify(options.body) : undefined,
    });

    if (!res.ok) {
      let bcCode = "Unknown";
      let bcMsg = `HTTP ${res.status}`;

      try {
        const errBody = (await res.json()) as {
          error?: { code?: string; message?: string };
        };
        if (errBody.error) {
          bcCode = errBody.error.code ?? bcCode;
          bcMsg = errBody.error.message ?? bcMsg;
        }
      } catch {
        bcMsg = await res.text().catch(() => bcMsg);
      }

      // Enhance common error messages
      if (res.status === 401 || res.status === 403) {
        bcMsg =
          "Authentication failed. Please run 'az login' in your terminal and try again.";
      } else if (res.status === 404) {
        bcMsg = `Record not found. Verify the key values are correct. (${bcMsg})`;
      } else if (res.status === 412) {
        bcMsg = `Precondition failed — re-fetch the record to get the current @odata.etag. (${bcMsg})`;
      } else if (res.status === 409) {
        bcMsg = `Conflict — the record was modified by another user. (${bcMsg})`;
      }

      throw new BCApiError(res.status, bcCode, bcMsg);
    }

    // DELETE returns 204 No Content
    if (res.status === 204) return { success: true };

    return res.json();
  }

  async list(
    entity: EntityDefinition,
    params: ODataParams & { parentId?: string }
  ): Promise<unknown> {
    const companyId = await this.getCompanyId();
    const url = buildListUrl(entity, companyId, params);
    return this.request("GET", url);
  }

  async create(
    entity: EntityDefinition,
    data: Record<string, unknown>,
    parentId?: string
  ): Promise<unknown> {
    const companyId = await this.getCompanyId();
    const url = buildCreateUrl(entity, companyId, parentId);
    return this.request("POST", url, { body: data });
  }

  async modify(
    entity: EntityDefinition,
    keys: Record<string, string | number>,
    data: Record<string, unknown>,
    etag: string,
    parentId?: string
  ): Promise<unknown> {
    const companyId = await this.getCompanyId();
    const url = buildSingleUrl(entity, companyId, keys, parentId);
    return this.request("PATCH", url, { body: data, etag });
  }

  async delete(
    entity: EntityDefinition,
    keys: Record<string, string | number>,
    parentId?: string
  ): Promise<unknown> {
    const companyId = await this.getCompanyId();
    const url = buildSingleUrl(entity, companyId, keys, parentId);
    return this.request("DELETE", url);
  }

  async action(
    entity: EntityDefinition,
    keys: Record<string, string | number>,
    actionName: string
  ): Promise<unknown> {
    const companyId = await this.getCompanyId();
    const url = buildActionUrl(entity, companyId, keys, actionName);
    return this.request("POST", url);
  }
}
