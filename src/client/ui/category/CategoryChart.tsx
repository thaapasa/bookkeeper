import * as React from 'react';
import styled from 'styled-components';
import { scaleBand, scaleLinear } from 'd3-scale';
import * as d3Axis from 'd3-axis';
import { select as d3Select } from 'd3-selection';
import Money from 'shared/util/Money';
import { media } from '../Styles';

export interface CategoryChartData {
  categoryId: number;
  categoryName: string;
  categoryTotal: number;
}

interface Scales {
  xScale: d3Axis.AxisScale<string>;
  yScale: d3Axis.AxisScale<number>;
}

interface Margins {
  bottom: number;
  top: number;
  left: number;
  right: number;
}

interface BarsProps {
  scales: Scales;
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

type Orient = 'Bottom' | 'Left' | 'Top' | 'Right';
function getAxis<D extends d3Axis.AxisDomain>(
  orient: Orient,
  scale: d3Axis.AxisScale<D>
): d3Axis.Axis<D> {
  switch (orient) {
    case 'Bottom':
      return d3Axis.axisBottom(scale);
    case 'Top':
      return d3Axis.axisTop(scale);
    case 'Left':
      return d3Axis.axisLeft(scale);
    case 'Right':
      return d3Axis.axisRight(scale);
    default:
      throw new Error('Invalid orient:' + orient);
  }
}

interface AxisProps<D extends d3Axis.AxisDomain> {
  readonly orient: 'Bottom' | 'Left' | 'Top' | 'Right';
  readonly scale: d3Axis.AxisScale<D>;
  readonly tickSize: number;
  readonly translate: string;
}
class Axis<D extends d3Axis.AxisDomain> extends React.Component<AxisProps<D>> {
  private axisElement: React.RefObject<SVGGElement> =
    React.createRef<SVGGElement>();

  public componentDidMount() {
    this.renderAxis();
  }

  public componentDidUpdate() {
    this.renderAxis();
  }

  private renderAxis() {
    if (!this.axisElement) {
      return;
    }
    const axis = getAxis(this.props.orient, this.props.scale)
      .tickSize(-this.props.tickSize)
      .tickPadding(12)
      .ticks([4]);

    d3Select(this.axisElement.current).call(axis as any);
  }

  public render() {
    return (
      <AxisG
        className={`Axis Axis-${this.props.orient}`}
        ref={this.axisElement}
        transform={this.props.translate}
      />
    );
  }
}

const AxisG = styled.g`
  .domain {
    display: none;
  }
  line {
    stroke: #e0e0e0;
  }
  &.Axis-Bottom .tick line {
    display: none;
  }
  ${media.mobile`
    &.Axis-Bottom text {
      transform: rotate(-45deg);
      text-anchor: end;
    }
  `}
`;

interface AxesProps {
  scales: Scales;
  margins: Margins;
  svgDimensions: { height: number; width: number };
}

function Axes({ scales, margins, svgDimensions }: AxesProps) {
  const { height, width } = svgDimensions;

  const xProps: AxisProps<string> = {
    orient: 'Bottom',
    scale: scales.xScale,
    translate: `translate(0, ${height - margins.bottom})`,
    tickSize: height - margins.top - margins.bottom,
  };

  const yProps: AxisProps<number> = {
    orient: 'Left',
    scale: scales.yScale,
    translate: `translate(${margins.left}, 0)`,
    tickSize: width - margins.left - margins.right,
  };

  return (
    <g>
      <Axis {...xProps} />
      <Axis {...yProps} />
    </g>
  );
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
