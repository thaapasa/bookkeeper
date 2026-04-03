const ChartMargins = { left: 16, top: 32, right: 16, bottom: 0 };
const NarrowMargins = { left: 0, top: 16, right: 0, bottom: 0 };

export function getChartMargins(size: { width: number }) {
  return size.width > 400 ? ChartMargins : NarrowMargins;
}
