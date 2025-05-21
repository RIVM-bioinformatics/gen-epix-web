import {
  Button,
  DialogContentText,
} from '@mui/material';
import {
  waitFor,
  act,
} from '@testing-library/react';
import type {
  ReactElement,
  RefObject,
} from 'react';
import {
  useEffect,
  useCallback,
  createRef,
} from 'react';

import { render } from '../../test/utils/TestingLibUtil';
import { TestIdUtil } from '../../utils/TestIdUtil';

import type {
  WithDialogRenderProps,
  WithDialogRefMethods,
  WithDialogOptions,
} from './withDialog';
import { withDialog } from './withDialog';

const MockDialogRender = ({ onClose, onTitleChange, onActionsChange }: WithDialogRenderProps): ReactElement => {
  const onCloseButtonClick = useCallback(() => {
    onClose();
  }, [onClose]);

  const onTitleChangeClick = useCallback(() => {
    onTitleChange('MockFromComponentTitle');
  }, [onTitleChange]);

  const ActionButtons = useCallback(() => {
    return (
      <Button>
        {'MockActionButton'}
      </Button>
    );
  }, []);

  useEffect(() => {
    onActionsChange([{
      label: 'MockActionButton',
    }]);
  }, [ActionButtons, onActionsChange]);

  return (
    <DialogContentText {...TestIdUtil.createAttributes('MockDialogRender-body')}>
      <Button onClick={onCloseButtonClick}>
        {'CloseButtonMock'}
      </Button>
      <Button onClick={onTitleChangeClick}>
        {'TitleChangeButtonMock'}
      </Button>
    </DialogContentText>
  );
};

const renderComponent = async (options: WithDialogOptions = {}, props: WithDialogRenderProps = {}) => {
  const ref: RefObject<WithDialogRefMethods<WithDialogRenderProps>> = createRef();
  const MockDialog = withDialog<WithDialogRenderProps>(MockDialogRender, Object.keys(options).length ? options : undefined);
  const renderResult = render(
    <MockDialog
      ref={ref}
      {...props}
    />,
  );

  act(() => {
    ref.current.open();
  });
  await waitFor(() => expect(renderResult.screen.getByTestId('MockDialogRender-body')).toBeVisible());

  return {
    ref,
    ...renderResult,
  };
};

describe('withDialog', () => {
  it('should open and close by ref methods', async () => {
    const { ref, screen } = await renderComponent();

    act(() => {
      ref.current.close();
    });
    await waitFor(() => expect(screen.queryByTestId('MockDialogRender-body')).not.toBeInTheDocument());
  });

  it('should close from inside the component', async () => {
    const { interaction, screen } = await renderComponent();
    await interaction.click(screen.getByText('CloseButtonMock'));
    expect(screen.queryByTestId('MockDialogRender-body')).not.toBeInTheDocument();
  });

  it('should add the display name', async () => {
    const { screen } = await renderComponent({
      testId: 'MockDialog',
    });
    expect(screen.getByTestId('MockDialog')).toBeVisible();
  });

  it('should add a default title', async () => {
    const { screen } = await renderComponent({
      testId: 'MockDialog',
      defaultTitle: 'MockDefaultTitle',
    });
    expect(screen.queryByText('MockDefaultTitle')).toBeVisible();
  });

  it('should add a default title and explicit title', async () => {
    const { screen } = await renderComponent({
      testId: 'MockDialog',
      defaultTitle: 'MockDefaultTitle',
    }, {
      title: 'MockExplicitTitle',
    });
    expect(screen.queryByText('MockExplicitTitle')).toBeVisible();
    expect(screen.queryByText('MockDefaultTitle')).not.toBeInTheDocument();
  });

  it('should change the title from within the component', async () => {
    const { interaction, screen } = await renderComponent({
      testId: 'MockDialog',
      defaultTitle: 'MockDefaultTitle',
    }, {
      title: 'MockExplicitTitle',
    });
    expect(screen.queryByText('MockExplicitTitle')).toBeVisible();
    await interaction.click(screen.getByText('TitleChangeButtonMock'));
    expect(screen.queryByText('MockFromComponentTitle')).toBeVisible();
  });

  it('should add action buttons', async () => {
    const { screen } = await renderComponent();
    expect(screen.queryByText('MockActionButton')).toBeVisible();
  });
});
