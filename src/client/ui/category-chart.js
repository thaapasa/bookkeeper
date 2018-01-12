"use strict";

import React from "react";
import d3 from "d3";
import { scaleBand, scaleLinear } from "d3-scale"
import * as d3Axis from 'd3-axis'
import { select as d3Select } from 'd3-selection'
import { interpolateLab } from 'd3-interpolate'

class Bars extends React.Component {
    constructor(props) {
        super(props)
    }

    render() {
        const { scales, margins, data, svgDimensions } = this.props
        const { xScale, yScale } = scales
        const { height } = svgDimensions

        const bars =  ( data ?
            data.map(datum =>
                <rect
                    key={datum.categoryName}
                    x={xScale(datum.categoryName)}
                    y={yScale(datum.categoryTotal)}
                    height={height - margins.bottom - scales.yScale(datum.categoryTotal)}
                    width={xScale.bandwidth()}
                    fill="#A252B6"
                />,
            ) : <rect></rect>
        )

        return (
            <g>{bars}</g>
        )
    }
}

class Axis extends React.Component {
    componentDidMount() {
        this.renderAxis()
    }

    componentDidUpdate() {
        this.renderAxis()
    }

    renderAxis() {
        const axisType = `axis${this.props.orient}`
        const axis = d3Axis[axisType]()
            .scale(this.props.scale)
            .tickSize(-this.props.tickSize)
            .tickPadding([12])
            .ticks([4])

        d3Select(this.axisElement).call(axis)
    }

    render() {
        return (
            <g
                className={`Axis Axis-${this.props.orient}`}
                ref={(el) => { this.axisElement = el; }}
                transform={this.props.translate}
            />
        )
    }
}

function Axes({ scales, margins, svgDimensions}){

    const { height, width } = svgDimensions

    const xProps = {
        orient: 'Bottom',
        scale: scales.xScale,
        translate: `translate(0, ${height - margins.bottom})`,
        tickSize: height - margins.top - margins.bottom,
    }

    const yProps = {
        orient: 'Left',
        scale: scales.yScale,
        translate: `translate(${margins.left}, 0)`,
        tickSize: width - margins.left - margins.right,
    }

    return (
        <g>
            <Axis {...xProps} />
            <Axis {...yProps} />
        </g>
    )
}

export default class CategoryChart extends React.Component {


    constructor(props) {
        super(props);
        this.xScale = scaleBand();
        this.yScale = scaleLinear();
        this.state = { containerWidth: null };

        this.adjustChartWidth = this.adjustChartWidth.bind(this);
    }

    componentDidMount() {
        this.adjustChartWidth();
        window.addEventListener('resize', this.adjustChartWidth);
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.adjustChartWidth);
    }

    adjustChartWidth() {
        const containerWidth = this.state.containerWidth;
        const currentContainerWidth = this.chartContainer.getBoundingClientRect().width;
        const shouldResize = containerWidth !== currentContainerWidth;

        if (shouldResize) {
            this.setState({ containerWidth: currentContainerWidth });
        }
    }

    renderChart() {
        const parentWidth = this.state.containerWidth;

        let data = this.props.data;
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
                        maxValue={maxValue}
                        svgDimensions={svgDimensions}
                    />
                </svg>
            </div>
        )
    }

    render() {
        const containerWidth = this.state.containerWidth;
        const shouldRenderChart = containerWidth !== null;

        return (       
            <div
                ref={(el) => { this.chartContainer = el }}
                className="Responsive-wrapper"
            >
            {shouldRenderChart && this.renderChart()}
          </div>
        );
    }


}