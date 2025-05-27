import { t } from 'i18next';

import { FilterAbstract } from '../abstracts';
import type { Filter } from '../../models';
import type { FiltersInner } from '../../api';

export class TreeFilter extends FilterAbstract<string> implements Filter<string, string> {
  public initialFilterValue: string = null;
  public filterValue: string = null;

  public matchRowValue(): boolean {
    return true;
  }

  public getPresentationValue(): string {
    return t('Selected tree node ({{nodeName}})', { nodeName: this.filterValue });
  }

  public toBackendFilter(): FiltersInner {
    return undefined;
  }
}
