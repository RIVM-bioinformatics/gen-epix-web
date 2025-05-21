import { buildQueries } from '@testing-library/react';

type AllByBoundAttribute<T extends HTMLElement = HTMLElement> = (container: HTMLElement, propName: string, value: string) => T[];

const queryAllByTestIdProp: AllByBoundAttribute = (container, propName, value) => {
  return Array.from<HTMLElement>(container.querySelectorAll(`[data-testid-prop-${propName}="${value}"]`));
};

const getMultipleError = (_element: Element, propName: string, value: string) => {
  return `Found multiple elements with: [data-testid-prop-${propName}="${value}"]`;
};
const getMissingError = (_element: Element, propName: string, value: string) => {
  return `Unable to find an element with: [data-testid-prop-${propName}="${value}"]`;
};

const [
  queryByTestIdProp, getAllByTestIdProp, getByTestIdProp, findAllByTestIdPropBase, findByTestIdPropBase,
] = buildQueries<[propName: string, value: string]>(queryAllByTestIdProp, getMultipleError, getMissingError);

export type QueryMethod<Arguments extends unknown[], Return> = (
  container: HTMLElement,
  ...args: Arguments
) => Return;

type FindAllBy = QueryMethod<[propName: string, value: string], Promise<HTMLElement[]>>;
type FindBy = QueryMethod<[propName: string, value: string], Promise<HTMLElement>>;

const findAllByTestIdProp: FindAllBy = findAllByTestIdPropBase;
const findByTestIdProp: FindBy = findByTestIdPropBase;

export {
  queryByTestIdProp,
  getAllByTestIdProp,
  getByTestIdProp,
  findAllByTestIdProp,
  findByTestIdProp,
};
