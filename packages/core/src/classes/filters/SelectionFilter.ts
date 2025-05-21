import { t } from 'i18next';

import type {
  FiltersInner,
  Case,
} from '@gen_epix/api';


import { FilterAbstract } from '../abstracts';
import type { Filter } from '../../models';

export class SelectionFilter extends FilterAbstract<string[]> implements Filter<string[], string> {
  public initialFilterValue: string[] = [];
  public filterValue: string[] = [];

  public matchRowValue(_rowValue: unknown, row: Case): boolean {
    return !this.filterValue.length || this.filterValue.includes(row.id);
  }

  public getPresentationValue(): string {
    return t('{{numCases}} case(s)', { numCases: this.filterValue.length });
  }

  public toBackendFilter(): FiltersInner {
    return undefined;
  }
}
