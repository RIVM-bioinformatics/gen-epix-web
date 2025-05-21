import type { DialogProps as MuiDialogProps } from '@mui/material';
import type {
  ComponentClass,
  ComponentType,
} from 'react';
import { Component } from 'react';

import {
  Dialog,
  type DialogAction,
  type DialogProps,
} from '../../components';

export interface WithDialogState<TOpenProps> {
  isOpen: boolean;
  title: string;
  permalink: string;
  actions: DialogAction[];
  openProps: TOpenProps;
}

export interface WithDialogRefMethods<TProps extends WithDialogRenderProps<TOpenProps>, TOpenProps = never> extends Component<TProps, WithDialogState<TOpenProps>> {
  open: (props?: TOpenProps) => void;
  close: () => void;
}

export type WithDialogRenderProps<TOpenProps = never> = {
  maxWidth?: MuiDialogProps['maxWidth'];
  onActionsChange?: (config: DialogAction[]) => void;
  onClose?: () => void;
  onTitleChange?: (title: string) => void;
  title?: string;
  permalink?: string;
  onPermalinkChange?: (permalink: string) => void;
  openProps?: TOpenProps;
};

export type WithDialogOptions = {
  defaultTitle?: string;
  noCloseButton?: boolean;
  disableBackdropClick?: boolean;
  noTitle?: boolean;
  testId?: string;
} & Pick<DialogProps, 'maxWidth' | 'fullWidth' | 'noPadding' | 'fullScreen' | 'titleVariant'>;

export const withDialog = <TProps extends WithDialogRenderProps<TOpenProps>, TOpenProps = never>(Content: ComponentType<TProps>, withDialogOptions: WithDialogOptions = {}): ComponentClass<TProps, WithDialogState<TOpenProps>> => {
  return class WithDialog extends Component<TProps, WithDialogState<TOpenProps>> implements WithDialogRefMethods<TProps, TOpenProps> {
    public constructor(props: TProps) {
      super(props);
      this.state = {
        isOpen: false,
        title: props.title || withDialogOptions?.defaultTitle,
        permalink: props.permalink,
        actions: null,
        openProps: undefined,
      };
      this.onClose = this.onClose.bind(this);
      this.onPermalinkChange = this.onPermalinkChange.bind(this);
      this.onTitleChange = this.onTitleChange.bind(this);
      this.onActionsChange = this.onActionsChange.bind(this);
    }

    private onPermalinkChange(permalink: string): void {
      this.setState({ permalink });
    }

    private onTitleChange(title: string): void {
      this.setState({ title });
    }

    private onActionsChange(actions: DialogAction[]): void {
      this.setState({ actions });
    }

    private onClose(): void {
      this.close();

      this.props.onClose?.();
    }

    public render() {
      const { isOpen } = this.state;
      if (!isOpen) {
        return null;
      }

      return (
        <Dialog
          actions={this.state.actions}
          disableBackdropClick={withDialogOptions?.disableBackdropClick}
          fullScreen={withDialogOptions.fullScreen}
          fullWidth={withDialogOptions.fullWidth}
          maxWidth={withDialogOptions.maxWidth}
          noCloseButton={withDialogOptions?.noCloseButton}
          noPadding={withDialogOptions.noPadding}
          noTitle={withDialogOptions?.noTitle}
          onClose={this.onClose}
          permalink={this.state.permalink}
          testId={withDialogOptions?.testId}
          title={this.state.title}
          titleVariant={withDialogOptions?.titleVariant}
        >
          <Content
            {...this.props as TProps}
            onActionsChange={this.onActionsChange}
            onClose={this.onClose}
            onPermalinkChange={this.onPermalinkChange}
            onTitleChange={this.onTitleChange}
            openProps={this.state.openProps}
          />
        </Dialog>
      );
    }

    public open(openProps: TOpenProps): void {
      this.setState({ isOpen: true, openProps });
    }

    public close(): void {
      this.setState({ isOpen: false });
    }
  };
};
