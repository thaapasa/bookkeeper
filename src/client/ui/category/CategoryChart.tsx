import * as d3Axis from 'd3-axis';
import { scaleBand, scaleLinear } from 'd3-scale';
import * as React from 'react';

import Money from 'shared/util/Money';

import { Axes } from '../chart/Axis';
import { ChartScales } from '../chart/types';

export interface CategoryChartData {
  categoryId: number;
  categoryName: string;
  categoryTotal: number;
}

interface BarsProps {
  scales: ChartScales;
  margins: { bottom: number };
  data?: CategoryChartData[];
  svgDimensions: { height: number };
}

class Bars extends React.Component<BarsProps> {
  public render() {
    const { scales, margins, data, svgDimensions } = this.props;
    const { xScale, yScale } = scales;
    const { height } = svgDimensions;

    const bars = data ? (
      data.map(datum => (
        <rect
          key={datum.categoryName}
          x={xScale(datum.categoryName)}
          y={yScale(datum.categoryTotal)}
          height={height - margins.bottom - (yScale(datum.categoryTotal) || 0)}
          width={xScale.bandwidth ? xScale.bandwidth() : 0}
          fill="#A252B6"
        />
      ))
    ) : (
      <rect />
    );

    return <g>{bars}</g>;
  }
}

interface CategoryChartState {
  containerWidth: number | null;
}

export default class CategoryChart extends React.Component<
  { chartData: CategoryChartData[] | undefined },
  CategoryChartState
> {
  private xScale = scaleBand<string>();
  private yScale = scaleLinear<number>();
  private chartContainer = React.createRef<HTMLDivElement>();

  public state: CategoryChartState = {
    containerWidth: null,
  };

  public componentDidMount() {
    this.adjustChartWidth();
    window.addEventListener('resize', this.adjustChartWidth);
  }

  public componentWillUnmount() {
    window.removeEventListener('resize', this.adjustChartWidth);
  }

  private adjustChartWidth = () => {
    const containerWidth = this.state.containerWidth;
    const currentContainerWidth =
      this.chartContainer.current &&
      this.chartContainer.current.getBoundingClientRect().width;
    const shouldResize = containerWidth !== currentContainerWidth;

    if (shouldResize) {
      this.setState({ containerWidth: currentContainerWidth });
    }
  };

  private renderChart(parentWidth: number) {
    const chartData = this.props.chartData;
    const margins = { top: 50, right: 20, bottom: 80, left: 60 };
    const width = Math.min(
      (chartData && chartData.length * 90) || 3000,
      parentWidth
    );
    const svgDimensions = {
      width: Math.max(width, 300),
      height: 500,
    };

    const maxValue = chartData
      ? Math.max(...chartData.map(d => Money.toValue(d.categoryTotal))) * 1.1
      : 0;
    // scaleBand type
    const xScale: d3Axis.AxisScale<string> = chartData
      ? this.xScale
          .padding(0.5)
          .domain(chartData.map(d => d.categoryName))
          .range([margins.left, svgDimensions.width - margins.right])
      : this.xScale;

    // scaleLinear type
    const yScale: d3Axis.AxisScale<number> = this.yScale
      // scaleLinear domain required at least two values, min and max
      .domain([0, maxValue])
      .range([svgDimensions.height - margins.bottom, margins.top]);

    return (
      <svg width={svgDimensions.width} height={svgDimensions.height}>
        <Axes
          scales={{ xScale, yScale }}
          margins={margins}
          svgDimensions={svgDimensions}
        />
        <Bars
          scales={{ xScale, yScale }}
          margins={margins}
          data={chartData}
          svgDimensions={svgDimensions}
        />
      </svg>
    );
  }

  public render() {
    const containerWidth = this.state.containerWidth;

    return (
      <div ref={this.chartContainer} className="Responsive-wrapper">
        {containerWidth != null && this.renderChart(containerWidth)}
      </div>
    );
  }
}
