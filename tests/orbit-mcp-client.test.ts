import { afterEach, describe, expect, it, vi } from "vitest";
import { callOrbitReadTool } from "../lib/orbit-mcp-client";

describe("Orbit MCP client boundary", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("rejects write-capable tools before making a request", () => {
    expect(() => callOrbitReadTool("create_lead", {})).toThrow("not permitted");
  });
});
