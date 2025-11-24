import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

// Accept width and height as props
const RadarChart = ({ width, height }) => {
    const ref = useRef(null);

    const color = d3.scaleOrdinal(d3.schemeCategory10);
    const [runOne, setRunOne] = useState(false)
    const [dataset, setDataset] = useState(null)
    const [selectedLabel, setSelectedLabel] = useState("device_type")

    useEffect(() => {
        const container = ref.current;
        
        if (!container || !width || !height || !dataset) return;

        if (runOne) return;
        console.log(width)
        console.log(height)

        setRunOne(true);
        // Init scale 
        const centerX = width/2;
        const centerY = height/2;
        const maxRadius = Math.min(centerX, centerY)*0.9;
        const radialScale = d3.scaleLinear().domain([0, 1]).range([0, maxRadius])

        function angleToCoordinate(angle, value){
            let x = Math.cos(angle) * radialScale(value);
            let y = Math.sin(angle) * radialScale(value);
            console.log(maxRadius)
            return {"x": centerX + x, "y": centerY - y};
        }
        const features = dataset["features"]
        let featureData = features.map((f, i) => {
            let angle = (Math.PI / 2) + (2 * Math.PI * i / features.length);
            return {
                "name": f,
                "angle": angle,
                "line_coord": angleToCoordinate(angle, 1),
                "label_coord": angleToCoordinate(angle, 1.15)
            }
        });

        // Get x,y,z coordinates for each attr
        function getPathCoordinates(data_point){
            let coordinates = [];
            for (var i = 0; i < features.length; i++){
                let ft_name = features[i];
                let angle = (Math.PI / 2) + (2 * Math.PI * i / features.length);
                coordinates.push(angleToCoordinate(angle, data_point[ft_name]))
            }
            return coordinates;
        }

        // Clear previous drawing
        d3.select(container).selectAll("*").remove();

        const margin = {top: 50, right: 30, bottom: 30, left: 0};
        
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;
        
        const svg = d3.select(container)
            .append("svg")
            .attr("class", "radar-chart")
            .attr("width", width)
            .attr("height", height)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);
        
        // Draw axis fine
        svg.selectAll("line")
            .data(featureData)
            .join(
                enter => enter.append("line")
                    .attr("x1", centerX)
                    .attr("y1", centerY)
                    .attr("x2", d => d.line_coord.x)
                    .attr("y2", d => d.line_coord.y)
                    .attr("stroke", "black")
            )

        // Draw axis label
        svg.selectAll(".axislabel")
            .data(featureData)
            .join(
                enter => enter.append("text")
                    .attr("x", d => d.label_coord.x - 32)
                    .attr("y", d => d.label_coord.y + 10)
                    .text(d => d.name)
            )

        let line = d3.line()
            .x(d => d.x)
            .y(d => d.y);

        // Draw the path element
        svg.selectAll("path")
            .data(dataset.slice(0,50))
            .join(
                enter => enter.append("path")
                    .datum(d => getPathCoordinates(d))
                    .attr("d", line)
                    .attr("stroke-width", 3)
                    .attr("stroke", (d, i) => color(d.device_type))
                    .attr("fill", (d, i) => color(d.device_type))
                    .attr("stroke-opacity", 1)
                    .attr("opacity", 0.25)
            )
            .on("mouseover", function (d, i) {
            d3.select(this).transition()
                .attr("opacity", 0.5)
            })
            .on("mouseout", function (d, i) {
                d3.select(this).transition()
                .attr("opacity", 0.25)
            });
    // Re-run this effect whenever width or height changes
    }, [width, height, dataset]);

    useEffect(() => {
         d3.csv("/radar_scaled_data.csv").then(function(data: any) {
            data["labels"] = ["device_type", "cpu_brand", "form_factor"]
            data["features"] = ["cpu_score", "gpu_score", "ram_score"]
            const set = new Set(d3.map(data, (d) => d[selectedLabel]))
            data["categories"] = [...set]
            setDataset(data);
         })
        console.log(selectedLabel)
        // console.log(dataset["categories"])
    }, [dataset, selectedLabel])

    return (
        <div className="flex w-full h-[500px]">
            <div ref={ref} className="relative" />
            <div className="absolute flex-col h-full w-full flex items-end justify-center space-y-2 px-4">
                {dataset && dataset["categories"].map((feature, idx) => (
                <button key={idx} className="z-20 h-8 px-3 bg-gray-800 text-white text-xs rounded cursor-pointer">
                    {feature}
                </button>
                ))}
            </div>
                <div className="absolute h-full w-full flex items-end py-2 justify-center space-x-8 px-4">
                {dataset && dataset["labels"].map((feature, idx) => (
                <button key={idx} onClick={() => setSelectedLabel(feature)} className="h-8 px-12 bg-gray-800 text-white text-xs rounded cursor-pointer">
                    {feature}
                </button>
                ))}
            </div>
        </div>
    )
};

export default RadarChart;