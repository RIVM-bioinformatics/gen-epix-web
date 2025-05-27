import { EventBusAbstract } from '../../abstracts';
import { WindowManager } from '../WindowManager';
import { ConfigManager } from '../ConfigManager';
import type { CompleteUser } from '../../../api';

type Page = {
  pageName: string;
  location: Location;
};

type EpiEvent = {
  error: Error;
  changeUser: CompleteUser;
  changePage: Page;
  click: {
    label: string;
    context?: string;
    page?: Page;
    type: 'button' | 'link' | 'table-row' | 'table-row-index';
  };
};

export class PageEventBusManager extends EventBusAbstract<EpiEvent> {
  private static __instance: PageEventBusManager;
  private lastPageEventPayload: string = null;

  private constructor() {
    super();
    this.setupClickEventListener();
  }

  public static get instance(): PageEventBusManager {
    PageEventBusManager.__instance = PageEventBusManager.__instance || new PageEventBusManager();
    return PageEventBusManager.__instance;
  }

  public emit<TEventName extends keyof EpiEvent>(eventName: TEventName, payload?: EpiEvent[TEventName]): void {
    if (eventName === 'changePage') {
      if (this.lastPageEventPayload === (payload as EpiEvent['changePage']).pageName) {
        return;
      }
      this.lastPageEventPayload = (payload as EpiEvent['changePage']).pageName;
    }

    if (eventName === 'click' && !(payload as EpiEvent['click']).page) {
      (payload as EpiEvent['click']).page = this.getPage();
    }

    super.emit(eventName, payload);
  }


  private setupClickEventListener(): void {
    if (!ConfigManager.instance.config.enablePageVents) {
      return;
    }
    WindowManager.instance.window.addEventListener('click', (event: Event): void => {

      const closestButton = (event.target as HTMLElement).closest('button');
      const closestLink = (event.target as HTMLElement).closest('a');
      const closestElement = closestButton || closestLink;

      if (closestElement) {
        const context = closestElement?.closest('[data-testid]')?.getAttribute('data-testid') ?? '';

        const buttonTitle = closestElement.getAttribute('aria-label') ?? closestElement.getAttribute('title');
        if (buttonTitle) {
          this.emit('click', {
            label: buttonTitle,
            context,
            type: closestButton ? 'button' : 'link',
          });
        } else {
          const childTextNode = this.traverseDom(closestElement, (el) => el.nodeType === Node.TEXT_NODE);
          if (childTextNode?.nodeValue) {
            this.emit('click', {
              label: childTextNode?.nodeValue,
              context,
              type: closestButton ? 'button' : 'link',
            });
          } else {
            const nodeWithText = this.traverseDom(closestElement, (el) => !!el.innerText);
            if (nodeWithText?.innerText) {
              this.emit('click', {
                label: nodeWithText?.innerText.split('\n')[0],
                context,
                type: closestButton ? 'button' : 'link',
              });
            }
          }
        }
      }
    });
  }

  private traverseDom(element: HTMLElement, predicate: (element: HTMLElement) => boolean): HTMLElement {
    if (predicate(element)) {
      return element;
    }
    for (const child of Array.from(element.childNodes)) {
      const found = this.traverseDom(child as HTMLElement, predicate);
      if (found) {
        return child as HTMLElement;
      }
    }
    return null;
  }

  public getPage(): Page {
    return {
      pageName: document.querySelector('[data-page-container]')?.getAttribute('data-testid'),
      location: WindowManager.instance.window.location,
    };
  }
}
