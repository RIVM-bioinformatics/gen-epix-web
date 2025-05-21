import type { ReactElement } from 'react';

import {
  withDialog,
  type WithDialogRefMethods,
  type WithDialogRenderProps,
} from '../../../hoc';
import { EpiStoreLoader } from '../EpiStoreLoader';

import { EpiCaseTypeInfoDialogContent } from './EpiCaseTypeInfoDialogContent';

export interface EpiCaseTypeInfoDialogWithLoaderOpenProps {
  caseTypeId: string;
}

export interface EpiCaseTypeInfoDialogWithLoaderProps extends WithDialogRenderProps<EpiCaseTypeInfoDialogWithLoaderOpenProps> {
  //
}

export type EpiCaseTypeInfoDialogWithLoaderRefMethods = WithDialogRefMethods<EpiCaseTypeInfoDialogWithLoaderProps, EpiCaseTypeInfoDialogWithLoaderOpenProps>;

export const EpiCaseTypeInfoDialogWithLoader = withDialog<EpiCaseTypeInfoDialogWithLoaderProps, EpiCaseTypeInfoDialogWithLoaderOpenProps>((
  {
    onTitleChange,
    openProps,
  }: EpiCaseTypeInfoDialogWithLoaderProps,
): ReactElement => {
  return (
    <EpiStoreLoader caseTypeId={openProps.caseTypeId}>
      <EpiCaseTypeInfoDialogContent onTitleChange={onTitleChange} />
    </EpiStoreLoader>
  );
}, {
  testId: 'EpiCaseTypeInfoDialogWithLoader',
  titleVariant: 'h2',
  fullWidth: true,
  maxWidth: 'xl',
});
