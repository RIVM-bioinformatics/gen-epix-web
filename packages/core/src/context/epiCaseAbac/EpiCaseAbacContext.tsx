import { createContext } from 'react';

import type { OptionBase } from '../../models';
import type {
  DataCollection,
  CaseSetDataCollectionLink,
  CaseDataCollectionLink,
  CaseSetRights,
  CaseRights,
} from '../../api';

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
