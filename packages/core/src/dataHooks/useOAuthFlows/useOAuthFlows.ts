import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { translateOptions } from '../../hooks';
import type {
  UseOptions,
  OptionBase,
} from '../../models';
import { OauthFlowType } from '../../api';

export const oAuthFlowPresentationValues: Record<OauthFlowType, string> = {
  [OauthFlowType.AUTHORIZATION_CODE]: 'Authorization Code',
  [OauthFlowType.CLIENT_CREDENTIALS]: 'Client Credentials',
  [OauthFlowType.RESOURCE_OWNER]: 'Resource Owner',
  [OauthFlowType.HYBRID]: 'Hybrid',
  [OauthFlowType.DEVICE_AUTHORIZATION]: 'Device Authorization',
  [OauthFlowType.PKCE]: 'PCKE',
};

export const useOAuthFlowOptions = (): UseOptions<string> => {
  const [t] = useTranslation();
  return useMemo(() => {
    const options: OptionBase<string>[] = Object.entries(oAuthFlowPresentationValues).map(([value, label]) => ({ value, label }));
    return {
      isLoading: false,
      options: translateOptions(options, t),
      error: null as UseOptions<string>,
    };
  }, [t]);
};
