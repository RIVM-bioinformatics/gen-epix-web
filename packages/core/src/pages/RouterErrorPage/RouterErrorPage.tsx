import { useRouteError } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import {
  GenericErrorMessage,
  PageContainer,
} from '../../components';
import { TestIdUtil } from '../../utils';

export const RouterErrorPage = () => {
  const error = useRouteError();
  const [t] = useTranslation();

  return (
    <PageContainer
      singleAction
      testIdAttributes={TestIdUtil.createAttributes('RouterErrorPage')}
      title={t`Error`}
    >
      <GenericErrorMessage
        error={error}
      />
    </PageContainer>
  );
};
