import type { Highlighting } from '../../../models';
import { userProfileStore } from '../../../stores';
import { SubscribableAbstract } from '../../abstracts';
import { Subject } from '../../Subject';

export class HighlightingManager extends SubscribableAbstract<Highlighting> {
  private static __instance: HighlightingManager;

  protected constructor() {
    super(new Subject({
      caseIds: [],
      origin: null,
    }));
  }

  public static get instance(): HighlightingManager {
    HighlightingManager.__instance = HighlightingManager.__instance || new HighlightingManager();
    return HighlightingManager.__instance;
  }

  public highlight(highlighting: Highlighting): void {
    if (userProfileStore.getState().epiDashboardGeneralSettings.isHighlightingEnabled) {
      this.subject.next(highlighting);
    }
  }

  public reset(): void {
    this.subject.next({
      caseIds: [],
      origin: null,
    });
  }
}
