// components/ui/badge.test.ts
import { describe, it, expect } from "vitest"
import { statusTone } from "@/components/ui/badge"

describe("statusTone", () => {
  it("maps domain statuses to the reference colors", () => {
    expect(statusTone("in progress")).toBe("gold")
    expect(statusTone("released")).toBe("gold")
    expect(statusTone("completed")).toBe("green")
    expect(statusTone("received")).toBe("green")
    expect(statusTone("issue")).toBe("red")
    expect(statusTone("closed")).toBe("gray")
    expect(statusTone("whatever")).toBe("gray") // unknown -> gray
  })
})