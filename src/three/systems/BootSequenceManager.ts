/**
 * BootSequenceManager — manages the pre-flight boot animation and initial takeoff.
 *
 * Extracted from ArchipelagoEngine to isolate the startup side-effect logic.
 */
import { useLabStore } from '../../store/useLabStore';
import {
  BOOT_COMPLETE_DELAY_MS,
  BOOT_PROGRESS_STEP,
  BOOT_TAKEOFF_DELAY_MS,
  BOOT_TICK_INTERVAL_MS,
} from '../../constants/gameplay';

export class BootSequenceManager {
  private intervalId: ReturnType<typeof setInterval> | null = null;

  constructor(private readonly onBootComplete: () => void) {}

  start(): void {
    let progress = 0;

    this.intervalId = setInterval(() => {
      progress += BOOT_PROGRESS_STEP;

      if (progress >= 100) {
        clearInterval(this.intervalId!);
        this.intervalId = null;

        useLabStore.getState().setBootState(100);

        setTimeout(() => {
          useLabStore.getState().setBootState(100, true);
          setTimeout(() => this.onBootComplete(), BOOT_TAKEOFF_DELAY_MS);
        }, BOOT_COMPLETE_DELAY_MS);
      } else {
        useLabStore.getState().setBootState(progress);
      }
    }, BOOT_TICK_INTERVAL_MS);
  }

  dispose(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}
