import { useQuery } from '@tanstack/react-query';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
  type PropsWithChildren,
} from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from 'zustand';
import {
  Box,
  Button,
} from '@mui/material';

import { ResponseHandler } from '../ResponseHandler';
import { PageContainer } from '../PageContainer';
import { outagesStore } from '../../../stores';
import {
  OutageUtil,
  QueryUtil,
  TestIdUtil,
} from '../../../utils';
import { OutageList } from '../OutageList';
import { QUERY_KEY } from '../../../models';
import { WindowManager } from '../../../classes';
import { SystemApi } from '../../../api';

export const OutageWrapper = ({ children }: PropsWithChildren): ReactNode => {
  const [t] = useTranslation();

  const setCategorizedOutages = useStore(outagesStore, (state) => state.setCategorizedOutages);
  const [shouldContinue, setShouldContinue] = useState(false);
  const [buttonsEnabled, setButtonsEnabled] = useState(false);

  const { isPending: isOutagesPending, error: outagesError, data: outages } = useQuery({
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.OUTAGES),
    queryFn: async ({ signal }) => (await SystemApi.getInstance().retrieveOutages({ signal })).data,
    gcTime: Infinity,
    staleTime: Infinity,
    refetchInterval: 5 * 60 * 1000,
  });

  const categorizedOutages = useMemo(() => {
    return OutageUtil.getCategorizedOutages(outages ?? []);
  }, [outages]);

  const onContinuButtonClick = useCallback(() => {
    setShouldContinue(true);
  }, []);

  const onRetryButtonClick = useCallback(() => {
    WindowManager.instance.window.location.reload();
  }, []);

  useEffect(() => {
    if (categorizedOutages) {
      setCategorizedOutages(categorizedOutages);
    }

    const timeout = WindowManager.instance.window.setTimeout(() => {
      setButtonsEnabled(true);
    }, 5000);

    return () => {
      WindowManager.instance.window.clearTimeout(timeout);
    };
  }, [categorizedOutages, setCategorizedOutages]);

  if (!isOutagesPending && !outagesError && categorizedOutages.activeOutages?.length === 0) {
    return children;
  }

  if (!shouldContinue && !isOutagesPending && !outagesError && categorizedOutages.activeOutages.length > 0) {
    return (
      <PageContainer
        singleAction
        testIdAttributes={TestIdUtil.createAttributes('OutagePage')}
        title={t`Outages`}
      >
        <OutageList
          activeOutages={categorizedOutages.activeOutages}
          soonActiveOutages={categorizedOutages.soonActiveOutages}
          visibleOutages={categorizedOutages.visibleOutages}
        />
        <Box sx={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 1,
        }}
        >
          <Button
            disabled={!buttonsEnabled}
            onClick={onContinuButtonClick}
            variant={'outlined'}
          >
            {t`Continue anyway`}
          </Button>
          <Button
            disabled={!buttonsEnabled}
            onClick={onRetryButtonClick}
            variant={'contained'}
          >
            {t`Retry`}
          </Button>
        </Box>
      </PageContainer>
    );
  }

  if (shouldContinue) {
    return children;
  }

  return (
    <PageContainer
      ignorePageEvent
      singleAction
      testIdAttributes={TestIdUtil.createAttributes('OutagesLoadingPage')}
      title={t`Outages`}
    >
      <ResponseHandler
        error={outagesError}
        isPending={isOutagesPending}
        loadingMessage={t`Loading`}
      >
        {children}
      </ResponseHandler>
    </PageContainer>
  );

};
