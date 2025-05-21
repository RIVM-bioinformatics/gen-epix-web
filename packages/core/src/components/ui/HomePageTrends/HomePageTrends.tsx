import {
  Typography,
  Button,
  Box,
  Skeleton,
} from '@mui/material';
import {
  useCallback,
  useMemo,
} from 'react';
import { useTranslation } from 'react-i18next';
import round from 'lodash/round';
import { useQuery } from '@tanstack/react-query';

import type {
  CaseTypeStat,
  RetrieveCaseTypeStatsCommand,
  TypedDatetimeRangeFilter,
} from '@gen_epix/api';
import {
  CaseApi,
  TypedDatetimeRangeFilterType,
} from '@gen_epix/api';

import {
  RouterManager,
  ConfigManager,
} from '../../../classes';
import {
  useCaseTypeStats,
  useCaseTypeMap,
  useCaseSets,
} from '../../../dataHooks';
import { ResponseHandler } from '../ResponseHandler';
import { QUERY_KEY } from '../../../models';
import {
  QueryUtil,
  EpiCaseTypeUtil,
} from '../../../utils';

import { HomagePageTrendCard } from './HomagePageTrendCard';

type Statistic = {
  header: string;
  value: number;
  diffPercentage: number;
  callback?: () => void;
  callbackLabel?: string;
};

type CaseTypeStatWithDiff = CaseTypeStat & {
  diffPercentage: number;
};

export const HomePageTrends = () => {
  const [t] = useTranslation();

  const dateTimeRangeFilter = useMemo<TypedDatetimeRangeFilter>(() => ({
    type: TypedDatetimeRangeFilterType.DATETIME_RANGE,
    upper_bound: ConfigManager.instance.config.trends.homePage.getSinceDate(),
    lower_bound_censor: '>=',
    upper_bound_censor: '<=',
  }), []);
  const caseSetQueryFilter = useMemo<TypedDatetimeRangeFilter>(() => ({
    ...dateTimeRangeFilter,
    key: 'created_at',
  }), [dateTimeRangeFilter]);

  const retrieveCaseTypeStatsCommand = useMemo<RetrieveCaseTypeStatsCommand>(() => ({
    datetime_range_filter: dateTimeRangeFilter,
  }), [dateTimeRangeFilter]);

  const caseTypeStatsNow = useCaseTypeStats();
  const caseTypeStatsThen = useCaseTypeStats(retrieveCaseTypeStatsCommand);
  const caseSetStatsNow = useCaseSets();
  const caseTypeMap = useCaseTypeMap();

  const { data: caseSetsThenData, ...caseSetsThenQuery } = useQuery({
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.CASE_SETS, caseSetQueryFilter),
    queryFn: async ({ signal }) => {
      const response = await CaseApi.getInstance().caseSetsPostQuery(caseSetQueryFilter, { signal });
      return response.data;
    },
  });

  const loadables = useMemo(() => [
    caseTypeStatsNow,
    caseTypeStatsThen,
    caseTypeMap,
    caseSetStatsNow,
    caseSetsThenQuery,
  ], [caseTypeStatsNow, caseTypeStatsThen, caseTypeMap, caseSetStatsNow, caseSetsThenQuery]);

  const statistics = useMemo<Statistic[]>(() => {
    const s: Statistic[] = [];

    if (loadables.some(loadable => loadable.isLoading)) {
      return s;
    }

    const nowTotalCases = caseTypeStatsNow.data?.reduce((acc, stat) => acc + stat.n_cases, 0) ?? 0;
    const thenTotalCases = caseTypeStatsThen.data?.reduce((acc, stat) => acc + stat.n_cases, 0) ?? 0;

    s.push(
      {
        header: 'Cases',
        value: nowTotalCases,
        diffPercentage: round((nowTotalCases - thenTotalCases) / (thenTotalCases || 1) * 100, 2),
        callbackLabel: t`View all cases`,
        callback: async () => {
          await RouterManager.instance.router.navigate('/cases');
        },
      },
    );

    const numberOfCaseSetsNow = caseSetStatsNow.data.length;
    const numberOfCaseSetsThen = caseSetsThenData.length;
    s.push(
      {
        header: 'Events',
        value: numberOfCaseSetsNow,
        diffPercentage: round((numberOfCaseSetsNow - numberOfCaseSetsThen) / (numberOfCaseSetsThen || 1) * 100, 2),
        callbackLabel: t`View all events`,
        callback: async () => {
          await RouterManager.instance.router.navigate('/events');
        },
      },
    );

    const caseTypeStatsThenByCaseTypeId = new Map<string, CaseTypeStat>(caseTypeStatsThen.data?.map(stat => [stat.case_type_id, stat]));
    const sortedStats = caseTypeStatsNow?.data?.map<CaseTypeStatWithDiff>(stat => {
      const thenStat = caseTypeStatsThenByCaseTypeId.get(stat.case_type_id);
      const diff = stat.n_cases - (thenStat?.n_cases ?? 0);
      const diffPercentage = round((diff / (thenStat?.n_cases ?? 1)) * 100, 2);
      return ({
        ...stat,
        diffPercentage,
      });
    }).sort((a, b) => b.diffPercentage - a.diffPercentage);

    for (let i = 0; i < 6; i += 1) {
      if (sortedStats?.[i]) {
        const caseType = caseTypeMap.map?.get(sortedStats?.[i].case_type_id ?? '');
        const caseTypeName = caseType?.name;
        if (caseTypeName) {
          s.push(
            {
              header: t('{{caseTypeName}} cases', { number: i + 1, caseTypeName }),
              value: sortedStats[i].n_cases,
              diffPercentage: sortedStats[i].diffPercentage,
              callbackLabel: t`View cases`,
              callback: async () => {
                await RouterManager.instance.router.navigate(EpiCaseTypeUtil.createCaseTypeLink(caseType));
              },
            },
          );
        }
      }
    }

    return s;
  }, [caseSetStatsNow.data?.length, caseSetsThenData?.length, caseTypeMap.map, caseTypeStatsNow.data, caseTypeStatsThen.data, loadables, t]);

  const onViewMoreTrendsButtonClick = useCallback(async () => {
    await RouterManager.instance.router.navigate('/trends');
  }, []);

  return (

    <Box>
      <Box marginBottom={1}>
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
        >
          <Box>
            <Typography
              variant={'h2'}
            >
              {t`Trends summary`}
            </Typography>
          </Box>
          <Box>
            <Button
              color={'primary'}
              disabled
              onClick={onViewMoreTrendsButtonClick}
              variant={'outlined'}
            >
              {t`View more trends`}
            </Button>
          </Box>
        </Box>
      </Box>
      <ResponseHandler
        inlineSpinner
        loadables={loadables}
        loadingContent={(
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 2,
            marginBottom: 2,
          }}
          >
            {[...Array<string>(8)].map((_, index) => (
              <Box
                // eslint-disable-next-line react/no-array-index-key
                key={index}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: 165.75,
                }}
              >
                <Skeleton
                  animation="pulse"
                  height={'100%'}
                  variant="rounded"
                  width={'100%'}
                />
              </Box>
            ))}
          </Box>
        )}
        shouldHideActionButtons
      >
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 2,
          marginBottom: 2,
        }}
        >
          {statistics.map(statistic => (
            <HomagePageTrendCard
              callback={statistic.callback}
              callbackLabel={statistic.callbackLabel}
              diffPercentage={statistic.diffPercentage}
              header={statistic.header}
              key={statistic.header}
              sinceLabel={ConfigManager.instance.config.trends.homePage.getSinceLabel(t)}
              value={statistic.value}
            />
          ))}
        </Box>
      </ResponseHandler>
    </Box>
  );
};
