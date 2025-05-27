import { FilterAbstract } from '../abstracts';
import type { Filter } from '../../models';
import type { TypedRegexFilter } from '../../api';

export class TextFilter extends FilterAbstract<string> implements Filter<string, string> {
  public initialFilterValue: string = '';
  public filterValue: string = '';

  public matchRowValue(rowValue: string): boolean {
    if (!this.filterValue) {
      return true;
    }

    if (!rowValue) {
      return false;
    }
    return String(rowValue).toLocaleLowerCase().includes(String(this.filterValue).toLocaleLowerCase());
  }

  public getPresentationValue(value?: unknown): string {
    const usedValue = value as string ?? this.filterValue;
    return usedValue ?? '';
  }

  public toBackendFilter(): TypedRegexFilter {
    if (this.isInitialFilterValue()) {
      return;
    }

    return {
      type: 'REGEX',
      key: this.id,
      pattern: `.*${this.filterValue}.*`,
    };
  }
}
