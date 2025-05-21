import { withDialog } from '../../../hoc';

import type { ConfirmationProps } from './ConfirmationRender';
import { ConfirmationRender } from './ConfirmationRender';

export const Confirmation = withDialog<ConfirmationProps, unknown>(ConfirmationRender, {
  testId: 'Confirmation',
  fullWidth: true,
  maxWidth: 'sm',
});
