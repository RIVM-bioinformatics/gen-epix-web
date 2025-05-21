import type { CaseSet } from '@gen_epix/api';

import { StringUtil } from '../StringUtil';
import { WindowManager } from '../../classes';

export class EpiCaseSetUtil {
  public static createCaseSetLink(caseSet: CaseSet, full?: boolean): string {
    const path = `/events/${StringUtil.createSlug(caseSet.name)}/${caseSet.id}`;
    if (full) {
      return `${WindowManager.instance.window.location.origin}${path}`;
    }
    return path;
  }
}
