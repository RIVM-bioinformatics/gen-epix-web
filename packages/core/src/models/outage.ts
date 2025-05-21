import type { Outage } from '@gen_epix/api';

export type CategorizedOutages = {
  visibleOutages: Outage[];
  activeOutages: Outage[];
  soonActiveOutages: Outage[];
};
