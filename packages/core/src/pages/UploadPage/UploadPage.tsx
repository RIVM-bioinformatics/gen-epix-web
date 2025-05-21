import { useTranslation } from 'react-i18next';

import { PageContainer } from '../../components';
import { TestIdUtil } from '../../utils';

export const UploadPage = () => {
  const [t] = useTranslation();

  return (
    <PageContainer
      testIdAttributes={TestIdUtil.createAttributes('UploadPage')}
      title={t`Upload`}
    >
      {t`Upload`}
    </PageContainer>
  );
};
