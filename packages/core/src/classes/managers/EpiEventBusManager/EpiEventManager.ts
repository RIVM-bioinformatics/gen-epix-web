import type {
  EpiAddCasesToEventDialogOpenProps,
  EpiBulkEditCaseDialogOpenProps,
  EpiCaseInfoDialogOpenProps,
  EpiContactDetailsDialogOpenProps,
  EpiCreateEventDialogOpenProps,
  EpiRemoveCasesFromEventDialogOpenProps,
  EpiSequenceDownloadDialogOpenProps,
} from '../../../components';
import { EventBusAbstract } from '../../abstracts';

type EpiEvent = {
  openContactDetailsDialog: EpiContactDetailsDialogOpenProps;
  openSequenceDownloadDialog: EpiSequenceDownloadDialogOpenProps;
  openCaseInfoDialog: EpiCaseInfoDialogOpenProps;
  openCreateEventDialog: EpiCreateEventDialogOpenProps;
  openRemoveCasesFromEventDialog: EpiRemoveCasesFromEventDialogOpenProps;
  openAddCasesToEventDialog: EpiAddCasesToEventDialogOpenProps;
  openBulkEditCaseDialog: EpiBulkEditCaseDialogOpenProps;
  onEventCreated: void;
};

export class EpiEventBusManager extends EventBusAbstract<EpiEvent> {
  private static __instance: EpiEventBusManager;

  private constructor() {
    super();
  }

  public static get instance(): EpiEventBusManager {
    EpiEventBusManager.__instance = EpiEventBusManager.__instance || new EpiEventBusManager();
    return EpiEventBusManager.__instance;
  }

}
