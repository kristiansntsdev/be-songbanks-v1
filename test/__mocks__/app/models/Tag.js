import { vi } from "vitest";

const mockTag = {
  query: vi.fn(),
  create: vi.fn(),
  firstOrCreate: vi.fn(),
};

export default mockTag;