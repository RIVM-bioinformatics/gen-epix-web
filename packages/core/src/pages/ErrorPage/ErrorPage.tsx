import { useTranslation } from 'react-i18next';

import {
  GenericErrorMessage,
  PageContainer,
} from '../../components';
import { TestIdUtil } from '../../utils';

export type ErrorPageProps = {
  readonly error?: unknown;
};

export const ErrorPage = ({ error }: ErrorPageProps) => {
  const [t] = useTranslation();

  return (
    <PageContainer
      singleAction
      testIdAttributes={TestIdUtil.createAttributes('ErrorPage')}
      title={t`Error`}
    >
      <GenericErrorMessage
        error={error}
      />
    </PageContainer>
  );
};
