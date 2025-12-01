import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import path from 'path';

// Accept width and height as props
const RadarChart = ({ width, height }) => {
    const ref = useRef(null);

    const color = d3.scaleOrdinal(d3.schemeCategory10);
    const [runOne, setRunOne] = useState(false)
    const [selectedCat, setSelectedCat] = useState(null);
    const [dataset, setDataset] = useState(null)    
    const [categories, setCategories] = useState([])
    const labels = ["device_type", "cpu_brand", "form_factor"]
    const features = ["cpu_score", "gpu_score", "ram_score"]
    const [selectedLabel, setSelectedLabel] = useState("device_type")

    // Rendering
    useEffect(() => {
        const container = ref.current;
        
        if (!container || !width || !height || !dataset) return;
        // Init scale 
        const centerX = width/2;
        const centerY = height/2;
        const maxRadius = Math.min(centerX, centerY)*0.9;
        const radialScale = d3.scaleLinear().domain([0, 1]).range([0, maxRadius])

        function angleToCoordinate(angle, value){
            let x = Math.cos(angle) * radialScale(value);
            let y = Math.sin(angle) * radialScale(value);
            return {"x": centerX + x, "y": centerY - y};
        }
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

        const margin = {top: 50, right: 30, bottom: 30, left: 0};
        
        const svg = d3.select(container)
            .attr("class", "radar-chart")
            .attr("width", width)
            .attr("height", height)
            // .append("g")
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
        svg.selectAll(".radar_path")
            .data(dataset.slice(0,3))
            .join(
                enter => enter.append("path")
                    .attr("class", "radar_path")
                    .attr("stroke-width", 3)
                    .attr("stroke", (d, i) => { console.log(d) 
                        return color(d[selectedLabel])})
                    .attr("fill", (d, i) => {return color(d[selectedLabel])})
                    .attr("stroke-opacity", 1)
                    .datum(d => getPathCoordinates(d))
                    .attr("d", line)
                    .attr("opacity", 0.25),
                update => {
                    update
                        .attr("stroke", d => color(d[selectedLabel]))
                        .attr("fill",  d => color(d[selectedLabel]))
                        // .datum(d => getPathCoordinates(d))  // recalc coordinates for updated data
                        // .attr("d", line)
                },
                exit => exit.remove() // proper exit handler
            );
        
        

        // paths = scatter_svg.selectAll("path").data(dataset);
        // console.log(paths)
    // Re-run this effect whenever width or height changes
    }, [width, height, dataset, selectedLabel]);

    useEffect(() => {
        d3.csv("/radar_scaled_data.csv").then(function(data) {
            if (!dataset) setDataset(data);
            const set = new Set(d3.map(data, (d) => d[selectedLabel]))
            setCategories([...set])
         })
        // console.log(dataset["categories"])
    }, [dataset, selectedLabel])

    const CategoryEventHandler = (category) => {
        setSelectedCat(category);
        const svg = d3.select(ref.current);
        svg.selectAll(".radar_path")
            .attr("opacity", 0.85)
    }    

    return (
        <div className="flex w-full h-[500px]">
            <svg ref={ref} className="absolute" />
            <div className="absolute flex-col h-full w-full flex items-end justify-center space-y-2 px-4">
                {dataset && categories.map((feature, idx) => (
                <button key={idx} className="z-20 h-8 px-3 bg-gray-800 text-white text-xs rounded cursor-pointer">
                    {feature}
                </button>
                ))}
            </div>
                <div className="absolute h-full w-full flex items-end py-2 justify-center space-x-8 px-4">
                {dataset && labels.map((feature, idx) => (
                <button key={idx} onClick={() => setSelectedLabel(feature)} className="h-8 px-12 bg-gray-800 text-white text-xs rounded cursor-pointer">
                    {feature}
                </button>
                ))}
            </div>
        </div>
    )
};

export default RadarChart;