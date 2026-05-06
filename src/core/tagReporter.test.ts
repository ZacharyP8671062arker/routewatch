import { generateTagReport, formatTagReportText, hasTaggedEndpoints } from "./tagReporter";
import { addTag, clearTags } from "./endpointTagManager";

beforeEach(() => {
  clearTags();
});

describe("generateTagReport", () => {
  it("returns zero count when no tags exist", () => {
    const report = generateTagReport();
    expect(report.totalTaggedEndpoints).toBe(0);
    expect(report.tagIndex).toEqual({});
    expect(report.endpointIndex).toEqual({});
  });

  it("correctly indexes endpoints by tag", () => {
    addTag("GET", "/users", "public");
    addTag("POST", "/users", "auth");
    addTag("GET", "/health", "public");

    const report = generateTagReport();
    expect(report.totalTaggedEndpoints).toBe(3);
    expect(report.tagIndex["public"]).toContain("GET:/users");
    expect(report.tagIndex["public"]).toContain("GET:/health");
    expect(report.tagIndex["auth"]).toContain("POST:/users");
  });

  it("correctly indexes tags by endpoint", () => {
    addTag("GET", "/items", "public");
    addTag("GET", "/items", "internal");

    const report = generateTagReport();
    expect(report.endpointIndex["GET:/items"]).toContain("public");
    expect(report.endpointIndex["GET:/items"]).toContain("internal");
  });
});

describe("formatTagReportText", () => {
  it("returns no-tags message when empty", () => {
    const report = generateTagReport();
    const text = formatTagReportText(report);
    expect(text).toContain("No tags registered.");
  });

  it("includes tag names and endpoints in output", () => {
    addTag("DELETE", "/admin", "internal");
    const report = generateTagReport();
    const text = formatTagReportText(report);
    expect(text).toContain("[internal]");
    expect(text).toContain("DELETE:/admin");
  });

  it("includes total count in header", () => {
    addTag("GET", "/ping", "public");
    const report = generateTagReport();
    const text = formatTagReportText(report);
    expect(text).toContain("Total tagged endpoints: 1");
  });
});

describe("hasTaggedEndpoints", () => {
  it("returns false when no tags exist", () => {
    expect(hasTaggedEndpoints()).toBe(false);
  });

  it("returns true after tagging an endpoint", () => {
    addTag("GET", "/something", "misc");
    expect(hasTaggedEndpoints()).toBe(true);
  });
});
