import type { BoxProps } from '@mui/material';
import {
  Box,
  Link,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import {
  useCallback,
  useContext,
  useMemo,
  useRef,
} from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from 'zustand';

import {
  EpiCaseTypeUtil,
  EpiCaseUtil,
} from '../../../utils';
import { EpiStoreContext } from '../../../stores';
import { GenericErrorMessage } from '../../ui';
import type { EpiContactDetailsDialogRefMethods } from '../EpiContactDetailsDialog';
import { EpiContactDetailsDialog } from '../EpiContactDetailsDialog';
import type { Case } from '../../../api';
import { ColType } from '../../../api';

export type EpiCaseContentProps = {
  readonly epiCase: Case;
} & BoxProps;

export const EpiCaseContent = ({ epiCase, ...boxProps }: EpiCaseContentProps) => {
  const [t] = useTranslation();
  const epiContactDetailsDialogRef = useRef<EpiContactDetailsDialogRefMethods>(null);
  const epiStore = useContext(EpiStoreContext);
  const completeCaseType = useStore(epiStore, (state) => state.completeCaseType);

  const caseTypeColumns = useMemo(() => EpiCaseTypeUtil.getCaseTypeColumns(completeCaseType), [completeCaseType]);

  const onOrganizationLinkClick = useCallback((contactId: string) => {
    epiContactDetailsDialogRef.current.open({
      contactId,
    });
  }, []);

  return (
    <Box {...boxProps}>
      <Typography variant={'h6'}>
        {t`Content`}
      </Typography>

      {!epiCase && (
        <GenericErrorMessage
          error={new Error('Case could not be found')}
        />
      )}
      {epiCase && (
        <Table size={'small'}>
          <TableHead>
            <TableRow>
              <TableCell sx={{
                width: 'calc(100% / 3)',
              }}
              >
                {t`Column`}
              </TableCell>
              <TableCell sx={{
                width: 'calc(100% / 3 * 2)',
              }}
              >
                {t`Value`}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {caseTypeColumns.map(caseTypeColumn => {
              const column = completeCaseType.cols[caseTypeColumn.col_id];
              const columnValue = EpiCaseUtil.getRowValue(epiCase, caseTypeColumn, completeCaseType).long;
              return (
                <TableRow key={caseTypeColumn.id}>
                  <TableCell sx={{
                    width: 'calc(100% / 3)',
                  }}
                  >
                    {caseTypeColumn.label}
                  </TableCell>
                  <TableCell sx={{
                    width: 'calc(100% / 3 * 2)',
                  }}
                  >
                    {column.col_type === ColType.ORGANIZATION && (
                      <Link
                        color={'primary'}
                        // eslint-disable-next-line react/jsx-no-bind
                        onClick={() => {
                          onOrganizationLinkClick(epiCase.content[caseTypeColumn.id]);
                        }}
                        sx={{
                          cursor: 'pointer',
                        }}
                      >
                        {columnValue}
                      </Link>
                    )}
                    {column.col_type !== ColType.ORGANIZATION && (
                      <>
                        {columnValue}
                      </>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
      <EpiContactDetailsDialog ref={epiContactDetailsDialogRef} />
    </Box>
  );
};
