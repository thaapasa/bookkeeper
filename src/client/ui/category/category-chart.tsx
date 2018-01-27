import * as React from 'react';
import { scaleBand, scaleLinear } from 'd3-scale';
import * as d3Axis from 'd3-axis';
import { select as d3Select } from 'd3-selection';

interface Scales {
    xScale: any;
    yScale: any;
}

interface Margins { bottom: number, top: number, left: number, right: number }

interface BarsProps {
    scales: Scales;
    margins: { bottom: number };
    data?: Array<{ categoryName: string, categoryTotal: number }>;
    svgDimensions: { height: number };
}

class Bars extends React.Component<BarsProps, {}> {

    public render() {
        const { scales, margins, data, svgDimensions } = this.props;
        const { xScale, yScale } = scales;
        const { height } = svgDimensions;

        const bars = (data ?
            data.map(datum =>
                <rect
                    key={datum.categoryName}
                    x={xScale(datum.categoryName)}
                    y={yScale(datum.categoryTotal)}
                    height={height - margins.bottom - yScale(datum.categoryTotal)}
                    width={xScale.bandwidth()}
                    fill="#A252B6"
                />,
            ) : <rect />
        );

        return (
            <g>{bars}</g>
        )
    }
}

interface AxisProps {
    readonly orient: string;
    readonly scale: any;
    readonly tickSize: number;
    readonly translate: string;
}
class Axis extends React.Component<AxisProps, {}> {
    private axisElement: SVGElement | null = null;
    
    public componentDidMount() {
        this.renderAxis();
    }

    public componentDidUpdate() {
        this.renderAxis();
    }

    private renderAxis() {
        const axisType = `axis${this.props.orient}`
        const axis = d3Axis[axisType]()
            .scale(this.props.scale)
            .tickSize(-this.props.tickSize)
            .tickPadding([12])
            .ticks([4]);

        d3Select(this.axisElement).call(axis);
    }

    public render() {
        return (
            <g
                className={`Axis Axis-${this.props.orient}`}
                ref={(el) => { this.axisElement = el; }}
                transform={this.props.translate}
            />
        );
    }
}

interface AxesProps {
    scales: Scales;
    margins: Margins;
    svgDimensions: { height: number, width: number };
}

function Axes({ scales, margins, svgDimensions }: AxesProps) {

    const { height, width } = svgDimensions;

    const xProps = {
        orient: 'Bottom',
        scale: scales.xScale,
        translate: `translate(0, ${height - margins.bottom})`,
        tickSize: height - margins.top - margins.bottom,
    };

    const yProps = {
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
    )
}

interface CategoryChartState {
    containerWidth: number | null;
};

export default class CategoryChart extends React.Component<any, CategoryChartState> {

    private xScale = scaleBand();
    private yScale = scaleLinear();
    private chartContainer;

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
        const currentContainerWidth = this.chartContainer.getBoundingClientRect().width;
        const shouldResize = containerWidth !== currentContainerWidth;

        if (shouldResize) {
            this.setState({ containerWidth: currentContainerWidth });
        }
    }

    private renderChart(parentWidth: number) {

        let chartData = this.props.chartData;
        const margins = { top: 50, right: 20, bottom: 100, left: 60 }
        const svgDimensions = { 
            width: Math.max(parentWidth, 300), 
            height: 500 
        }

        const maxValue = chartData ? Math.max(...chartData.map(d => d.categoryTotal)) * 1.1 : 0;
        // scaleBand type
        const xScale = chartData ? this.xScale
            .padding(0.5)
            .domain(chartData.map(d => d.categoryName))
            .range([margins.left, svgDimensions.width - margins.right]) : this.xScale;

        // scaleLinear type
        const yScale = this.yScale
        // scaleLinear domain required at least two values, min and max
            .domain([0, maxValue])
            .range([svgDimensions.height - margins.bottom, margins.top])

        return (
            <div className="category-chart-container">
                <svg width={svgDimensions.width} height={svgDimensions.height}>
                    // Bars and Axis comes here
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
            </div>
        )
    }

    public render() {
        const containerWidth = this.state.containerWidth;

        return (       
            <div
                ref={(el) => { this.chartContainer = el }}
                className="Responsive-wrapper"
            >
            {containerWidth != null && this.renderChart(containerWidth)}
          </div>
        );
    }


}