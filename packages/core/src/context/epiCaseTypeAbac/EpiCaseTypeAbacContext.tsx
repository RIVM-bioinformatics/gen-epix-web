import { createContext } from 'react';

import type {
  CaseTypeAccessAbac,
  DataCollection,
} from '@gen_epix/api';

export type EpiCaseTypeAbacContextValue = {
  userDataCollections: DataCollection[];
  userDataCollectionsMap: Map<string, DataCollection>;
  caseTypeAccessAbacDict: { [key: string]: CaseTypeAccessAbac };
  caseTypeAccessAbacs?: CaseTypeAccessAbac[];
  effectiveColumnAccessRights?: Map<string, { read: boolean; write: boolean }>;
};

export const EpiCaseTypeAbacContext = createContext<EpiCaseTypeAbacContextValue>(null);
