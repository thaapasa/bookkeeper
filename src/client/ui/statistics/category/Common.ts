import { Size } from 'client/ui/Types';

const ChartMargins = { left: 16, top: 32, right: 48, bottom: 0 };
const NarrowMargins = { left: 0, top: 16, right: 0, bottom: 0 };

export function getChartMargins(size: Size) {
  return size.width > 400 ? ChartMargins : NarrowMargins;
}
