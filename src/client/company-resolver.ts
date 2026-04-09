import { CONFIG } from "../config.js";

export class CompanyResolver {
  private companyId: string | null = null;

  async resolve(
    requestFn: (url: string) => Promise<{ value: Array<{ id: string }> }>
  ): Promise<string> {
    if (this.companyId) return this.companyId;

    const url = `${CONFIG.standardBase}/companies?$filter=name eq '${CONFIG.company}'`;
    const result = await requestFn(url);

    if (!result.value || result.value.length === 0) {
      throw new Error(
        `Company '${CONFIG.company}' not found. Verify the company name and environment.`
      );
    }

    this.companyId = result.value[0].id;
    return this.companyId;
  }
}
