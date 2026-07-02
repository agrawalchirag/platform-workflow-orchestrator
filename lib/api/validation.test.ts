import { describe, expect, it } from "vitest";
import { ValidationError } from "@/lib/api/errors";
import {
  validateCreateWorkflowBody,
  validateWorkflowStatusFilter,
} from "@/lib/api/validation";

describe("validateCreateWorkflowBody", () => {
  it("accepts a valid payload", () => {
    expect(
      validateCreateWorkflowBody({
        applicationName: "payment-api",
        environment: "STAGING",
        version: "1.2.3",
      }),
    ).toEqual({
      applicationName: "payment-api",
      environment: "STAGING",
      version: "1.2.3",
    });
  });

  it("rejects invalid environment values", () => {
    expect(() =>
      validateCreateWorkflowBody({
        applicationName: "payment-api",
        environment: "QA",
        version: "1.2.3",
      }),
    ).toThrow(ValidationError);
  });

  it("rejects missing applicationName", () => {
    expect(() =>
      validateCreateWorkflowBody({
        environment: "STAGING",
        version: "1.2.3",
      }),
    ).toThrow(ValidationError);
  });
});

describe("validateWorkflowStatusFilter", () => {
  it("returns undefined when status is omitted", () => {
    expect(validateWorkflowStatusFilter(null)).toBeUndefined();
  });

  it("accepts valid workflow statuses", () => {
    expect(validateWorkflowStatusFilter("FAILED")).toBe("FAILED");
  });

  it("rejects invalid workflow statuses", () => {
    expect(() => validateWorkflowStatusFilter("RUNNING")).toThrow(
      ValidationError,
    );
  });
});
