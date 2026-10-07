import {
  readStorage,
  removeStorage,
  writeStorage,
} from "@/lib/storage/local-storage"
import { STORAGE_KEYS } from "@/lib/storage/storage-keys"

interface OnboardingRecord {
  version: 1
  complete: boolean
}

export interface OnboardingRepository {
  isComplete(): boolean
  complete(): void
  reset(): void
}

export const localOnboardingRepository: OnboardingRepository = {
  isComplete() {
    const value = readStorage<OnboardingRecord | null>(
      STORAGE_KEYS.onboarding,
      null,
    )
    return value?.version === 1 && value.complete === true
  },
  complete() {
    writeStorage<OnboardingRecord>(STORAGE_KEYS.onboarding, {
      version: 1,
      complete: true,
    })
  },
  reset() {
    removeStorage(STORAGE_KEYS.onboarding)
  },
}
