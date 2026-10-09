import type { FontName } from "./font.model"

export interface FontRepository {
  load(): FontName
  save(font: FontName): void
  reset(): void
}
