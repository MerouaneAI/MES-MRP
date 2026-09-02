import { describe, it, expect } from "vitest"
import { requirementFor, addQty, subtractQty, compareQty, minQty } from "@/lib/quantity"

describe("quantity math (BigInt, no float drift)", () => {
  it("requirementFor multiplies per-unit (4dp) by planned (3dp), rounded to 3dp", () => {
    expect(requirementFor("0.2500", "1000.000")).toBe("250.000")
    expect(requirementFor("0.3000", "1000.000")).toBe("300.000")
    expect(requirementFor("0.3333", "3.000")).toBe("1.000") // 0.9999 -> rounds to 1.000
  })
  it("addQty / subtractQty keep 3dp precision", () => {
    expect(addQty("1.500", "2.250", "0.250")).toBe("4.000")
    expect(subtractQty("10.000", "3.750")).toBe("6.250")
  })
  it("compareQty / minQty compare numerically, not lexically", () => {
    expect(compareQty("9.000", "10.000")).toBe(-1) // "9" > "10" as text, but 9 < 10
    expect(compareQty("5.000", "5.000")).toBe(0)
    expect(minQty("2.500", "2.250")).toBe("2.250")
  })
})
