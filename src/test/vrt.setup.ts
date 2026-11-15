import { vi } from 'vitest'

// Runs before every VRT file's imports. Freezes Date so time-dependent UI
// (e.g. the © year in Footer, computed at module load) renders the same on every run.
vi.setSystemTime(new Date('2026-06-15T12:00:00Z'))
