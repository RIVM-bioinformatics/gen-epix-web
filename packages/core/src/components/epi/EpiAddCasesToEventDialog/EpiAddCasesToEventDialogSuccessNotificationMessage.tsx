import { t } from 'i18next';
import {
  Box,
  Link,
} from '@mui/material';
import { useCallback } from 'react';

import type { CaseSet } from '@gen_epix/api';

import { EpiCaseSetUtil } from '../../../utils';
import { RouterManager } from '../../../classes';

export type EpiAddCasesToEventDialogSuccessNotificationMessageProps = {
  readonly caseSet: CaseSet;
  readonly numAddedCases: number;
};

export const EpiAddCasesToEventDialogSuccessNotificationMessage = ({ caseSet, numAddedCases }: EpiAddCasesToEventDialogSuccessNotificationMessageProps) => {

  const onLinkClick = useCallback(async () => {
    await RouterManager.instance.router.navigate({ pathname: EpiCaseSetUtil.createCaseSetLink(caseSet) });
  }, [caseSet]);

  return (
    <Box>
      <Box>
        {t('Successfully added {{numAddedCases}} case(s) to event: {{name}}', { numAddedCases, name: caseSet.name })}
      </Box>
      <Box marginY={2}>
        <Link
          href={'#'}
          onClick={onLinkClick}
        >
          {t('View event: {{name}}', { name: caseSet.name })}
        </Link>
      </Box>
    </Box>
  );
};
