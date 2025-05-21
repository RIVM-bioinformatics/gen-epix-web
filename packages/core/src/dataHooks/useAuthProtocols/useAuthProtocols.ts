import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { AuthProtocol } from '@gen_epix/api';

import { translateOptions } from '../../hooks';
import type {
  UseOptions,
  OptionBase,
} from '../../models';

export const authProtocolPresentationValues: Record<AuthProtocol, string> = {
  [AuthProtocol.OAUTH2]: 'OAUTH2',
  [AuthProtocol.OIDC]: 'OIDC',
};

export const useAuthProtocolOptions = (): UseOptions<string> => {
  const [t] = useTranslation();
  return useMemo(() => {
    const options: OptionBase<string>[] = Object.entries(authProtocolPresentationValues).map(([value, label]) => ({ value, label }));
    return {
      isLoading: false,
      options: translateOptions(options, t),
      error: null,
    } as UseOptions<string>;
  }, [t]);
};
