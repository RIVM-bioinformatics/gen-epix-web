import { useTranslation } from 'react-i18next';
import { useCallback } from 'react';

import {
  ApplicationFooterLink,
  ApplicationFooterLinkSection,
} from '@gen_epix/core';

export const ApplicationFooter = () => {
  const [t, i18n] = useTranslation();

  const onEnglishClick = useCallback(async () => {
    await i18n.changeLanguage('en');
  }, [i18n]);

  const onDutchClick = useCallback(async () => {
    await i18n.changeLanguage('nl');
  }, [i18n]);

  return (
    <>
      <ApplicationFooterLinkSection header={t`Contact`}>
        <ApplicationFooterLink href={'https://www.lipsum.com/'}>
          {t`Information for the press`}
        </ApplicationFooterLink>
      </ApplicationFooterLinkSection>
      <ApplicationFooterLinkSection header={t`About`}>
        <ApplicationFooterLink href={'https://www.lipsum.com/'}>
          {t`Copyright`}
        </ApplicationFooterLink>
      </ApplicationFooterLinkSection>
      <ApplicationFooterLinkSection header={t`Languages`}>
        <ApplicationFooterLink onClick={onEnglishClick}>
          {t`English`}
        </ApplicationFooterLink>
        <ApplicationFooterLink onClick={onDutchClick}>
          {t`Dutch`}
        </ApplicationFooterLink>
      </ApplicationFooterLinkSection>
      <ApplicationFooterLinkSection header={t`Other`}>
        <ApplicationFooterLink>
          {t`Alpha`}
        </ApplicationFooterLink>
        <ApplicationFooterLink>
          {t`Beta`}
        </ApplicationFooterLink>
        <ApplicationFooterLink>
          {t`Charlie`}
        </ApplicationFooterLink>
      </ApplicationFooterLinkSection>
    </>
  );
};
