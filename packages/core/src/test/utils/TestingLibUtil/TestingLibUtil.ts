import type {
  Screen as OriginalScreen,
  RenderResult,
} from '@testing-library/react';
import {
  act,
  screen,
  within,
  render as testingLibraryRender,
} from '@testing-library/react';
import type * as baseQueries from '@testing-library/dom/types/queries';
import {
  userEvent as testingLibraryUserEvent,
  type UserEvent,
} from '@testing-library/user-event';
import {
  type JSXElementConstructor,
  type ReactElement,
} from 'react';

import * as queries from './queries';

type Queries = typeof queries & typeof baseQueries;

export type Screen = OriginalScreen<Queries>;

export class Interaction {
  private readonly userEvent: UserEvent;
  private readonly renderResult: RenderResult;
  public constructor(userEvent: UserEvent, renderResult: RenderResult) {
    this.userEvent = userEvent;
    this.renderResult = renderResult;
  }

  public static async waitWithDelay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  public get screen(): Screen {
    return { ...screen, ...within(document.body, queries as Queries) } as Screen;
  }

  public async click(element: Element): Promise<void> {
    await act(async () => {
      await this.userEvent.click(element);
    });
  }

  public async clickOutside(): Promise<void> {
    await this.click(this.renderResult.baseElement);
  }
}

export const render = (jsx: ReactElement<unknown, string | JSXElementConstructor<unknown>>) => {
  const userEvent = testingLibraryUserEvent.setup({
    delay: null,
    pointerEventsCheck: 0,
  });
  const result = testingLibraryRender(jsx);
  const interaction = new Interaction(userEvent, result);
  return {
    userEvent,
    interaction,
    result,
    screen: interaction.screen,
  };
};
