// @vitest-environment jsdom

import {
  waitFor,
  act,
} from '@testing-library/react';
import type { RefObject } from 'react';

import { render } from '../../../test/utils/TestingLibUtil';

import type {
  ConfirmationRefMethods,
  ConfirmationProps,
} from './ConfirmationRender';
import { Confirmation } from './Confirmation';

const renderComponent = (props: ConfirmationProps) => {
  const ref = {
    current: {},
  } as RefObject<ConfirmationRefMethods>;

  const renderResult = render(
    <Confirmation
      ref={ref}
      {...props}
    />,
  );

  return {
    ref,
    ...renderResult,
  };
};

describe('Confirmation', () => {
  it('should be able to confirm and close', async () => {
    let onCloseCounter = 0;
    const { ref, interaction, screen } = renderComponent({
      onConfirm: () => {
        ref.current.close();
      },
      onClose: () => {
        onCloseCounter++;
      },
      confirmLabel: 'OK',
    });
    act(() => {
      ref.current.open();
    });
    await screen.findByTestId('Confirmation');
    await act(async () => {
      await interaction.click(screen.getByTestId('Confirmation-confirmButton'));
    });
    await waitFor(() => expect(screen.queryByTestId('Confirmation')).not.toBeInTheDocument());
    expect(onCloseCounter).toBe(1);
  });

  it('should be able to cancel and close', async () => {
    let onCloseCounter = 0;
    const { ref, interaction, screen } = renderComponent({
      onConfirm: () => {
        //
      },
      onClose: () => {
        onCloseCounter++;
      },
      onCancel: () => {
        ref.current.close();
      },
      confirmLabel: 'OK',
      cancelLabel: 'Cancel',
    });

    act(() => {
      ref.current.open();
    });
    await screen.findByTestId('Confirmation');
    await act(async () => {
      await interaction.click(screen.getByTestId('Confirmation-cancelButton'));
    });
    await waitFor(() => expect(screen.queryByTestId('Confirmation')).not.toBeInTheDocument());
    expect(onCloseCounter).toBe(1);
  });

  it('should render a body', async () => {
    const { ref, screen } = renderComponent({
      onConfirm: () => {
        //
      },
      confirmLabel: 'OK',
      body: 'MOCK_BODY',
    });

    act(() => {
      ref.current.open();
    });
    await waitFor(() => expect(screen.getByTestId('Confirmation-content')).toHaveTextContent('MOCK_BODY'));
  });
});
