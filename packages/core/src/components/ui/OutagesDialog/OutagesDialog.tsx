import { useTranslation } from 'react-i18next';
import type { ReactElement } from 'react';
import { useEffect } from 'react';
import { useStore } from 'zustand';

import {
  withDialog,
  type WithDialogRefMethods,
  type WithDialogRenderProps,
} from '../../../hoc';
import { TestIdUtil } from '../../../utils';
import { outagesStore } from '../../../stores';
import { OutageList } from '../OutageList/OutageList';

export interface OutagesDialogOpenProps {
  //
}

export interface OutagesDialogProps extends WithDialogRenderProps<OutagesDialogOpenProps> {
  //
}

export type OutagesDialogRefMethods = WithDialogRefMethods<OutagesDialogProps, OutagesDialogOpenProps>;


export const OutagesDialog = withDialog<OutagesDialogProps, OutagesDialogOpenProps>((
  {
    onTitleChange,
    onActionsChange,
    onClose,
  }: OutagesDialogProps,
): ReactElement => {
  const [t] = useTranslation();
  const visibleOutages = useStore(outagesStore, (state) => state.visibleOutages);
  const activeOutages = useStore(outagesStore, (state) => state.activeOutages);
  const soonActiveOutages = useStore(outagesStore, (state) => state.soonActiveOutages);

  useEffect(() => {
    onTitleChange(t`Outages`);
  }, [onTitleChange, t]);

  useEffect(() => {
    onActionsChange(
      [
        {
          ...TestIdUtil.createAttributes('OutagesDialog-close'),
          color: 'primary',
          autoFocus: true,
          onClick: onClose,
          variant: 'outlined',
          label: t`Close`,
        },
      ],
    );
  }, [onActionsChange, onClose, t]);

  return (
    <OutageList
      activeOutages={activeOutages}
      soonActiveOutages={soonActiveOutages}
      visibleOutages={visibleOutages}
    />
  );
}, {
  testId: 'OutagesDialog',
  maxWidth: 'md',
  fullWidth: true,
  defaultTitle: '',
  noCloseButton: false,
  disableBackdropClick: false,
});
