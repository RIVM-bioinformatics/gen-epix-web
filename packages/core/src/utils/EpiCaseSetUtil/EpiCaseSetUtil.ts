import { StringUtil } from '../StringUtil';
import { WindowManager } from '../../classes';
import type { CaseSet } from '../../api';

export class EpiCaseSetUtil {
  public static createCaseSetLink(caseSet: CaseSet, full?: boolean): string {
    const path = `/events/${StringUtil.createSlug(caseSet.name)}/${caseSet.id}`;
    if (full) {
      return `${WindowManager.instance.window.location.origin}${path}`;
    }
    return path;
  }
}
