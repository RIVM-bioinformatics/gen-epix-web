import { createContext } from 'react';

import type {
  CaseSetDataCollectionLink,
  CaseDataCollectionLink,
  CaseSetRights,
  CaseRights,
  DataCollection,
} from '@gen_epix/api';

import type { OptionBase } from '../../models';

export type EpiCaseAbacContextValue = {
  userDataCollections: DataCollection[];
  userDataCollectionsMap: Map<string, DataCollection>;
  userDataCollectionOptions: OptionBase<string>[];
  itemDataCollectionLinks: Array<Array<CaseSetDataCollectionLink | CaseDataCollectionLink>>;
  itemDataCollections?: Array<DataCollection[]>;
  itemSharedInDataCollections?: Array<DataCollection[]>;
  itemDataCollectionOptions?: Array<OptionBase<string>[]>;
  rights: Array<CaseSetRights | CaseRights>;
};

export const EpiCaseAbacContext = createContext<EpiCaseAbacContextValue>(null);
