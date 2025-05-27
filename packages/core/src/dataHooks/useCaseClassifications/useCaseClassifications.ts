import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { translateOptions } from '../../hooks';
import type {
  UseOptions,
  OptionBase,
} from '../../models';
import { CaseClassification } from '../../api';

export const caseClassificationPresentationValues: Record<CaseClassification, string> = {
  [CaseClassification.POSSIBLE]: 'Possible',
  [CaseClassification.PROBABLE]: 'Probable',
  [CaseClassification.CONFIRMED]: 'Confirmed',
};

export const useCaseClassificationOptions = (): UseOptions<string> => {
  const [t] = useTranslation();
  return useMemo(() => {
    const options: OptionBase<string>[] = Object.entries(caseClassificationPresentationValues).map(([value, label]) => ({ value, label }));
    return {
      isLoading: false,
      options: translateOptions(options, t),
      error: null,
    } as UseOptions<string>;
  }, [t]);
};
