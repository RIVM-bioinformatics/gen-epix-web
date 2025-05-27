import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { translateOptions } from '../../hooks';
import type {
  UseOptions,
  OptionBase,
} from '../../models';
import { TreeAlgorithmType } from '../../api';

export const treeAlgorithmCodeValues: Record<TreeAlgorithmType, string> = {
  [TreeAlgorithmType.SLINK]: 'SLINK',
  [TreeAlgorithmType.CLINK]: 'CLINK',
  [TreeAlgorithmType.UPGMA]: 'UPGMA',
  [TreeAlgorithmType.WPGMA]: 'WPGMA',
  [TreeAlgorithmType.UPGMC]: 'UPGMC',
  [TreeAlgorithmType.WPGMC]: 'WPGMC',
  [TreeAlgorithmType.VERSATILE]: 'VERSATILE',
  [TreeAlgorithmType.MISSQ]: 'MISSQ',
  [TreeAlgorithmType.MNSSQ]: 'MNSSQ',
  [TreeAlgorithmType.MIVAR]: 'MIVAR',
  [TreeAlgorithmType.MNVAR]: 'MNVAR',
  [TreeAlgorithmType.MINI_MAX]: 'MINI_MAX',
  [TreeAlgorithmType.HAUSDORFF]: 'HAUSDORFF',
  [TreeAlgorithmType.MIN_SUM_MEDOID]: 'MIN_SUM_MEDOID',
  [TreeAlgorithmType.MIN_SUM_INCREASE_MEDOID]: 'MIN_SUM_INCREASE_MEDOID',
  [TreeAlgorithmType.MEDOID]: 'MEDOID',
  [TreeAlgorithmType.MIN_ENERGY]: 'MIN_ENERGY',
  [TreeAlgorithmType.FITCH_MARGOLIASH]: 'FITCH_MARGOLIASH',
  [TreeAlgorithmType.MAX_PARSIMONY]: 'MAX_PARSIMONY',
  [TreeAlgorithmType.ML]: 'ML',
  [TreeAlgorithmType.BAYESIAN_INFERENCE]: 'BAYESIAN_INFERENCE',
  [TreeAlgorithmType.MIN_SPANNING]: 'MIN_SPANNING',
  [TreeAlgorithmType.NJ]: 'NJ',
};

export const useTreeAlgorithmCodeOptions = (): UseOptions<string> => {
  const [t] = useTranslation();
  return useMemo(() => {
    const options: OptionBase<string>[] = Object.entries(treeAlgorithmCodeValues).map(([value, label]) => ({ value, label }));
    return {
      isLoading: false,
      options: translateOptions(options, t),
      error: null as UseOptions<string>,
    };
  }, [t]);
};
