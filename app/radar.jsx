import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

// Accept width and height as props
const RadarChart = ({ width, height }) => {
    const ref = useRef(null);

    const color = d3.scaleOrdinal(d3.schemeCategory10);
    const [runOne, setRunOne] = useState(false)
    const [selectedCat, setSelectedCat] = useState(null);
    const [dataset, setDataset] = useState(null)    
    const [categories, setCategories] = useState([])
    const labels = ["Computer Brand", "CPU Brand", "Desktop Form Factor", "Laptop Form Factor"]
    const features = ["price", "gpu_score", "cpu_score"]
    const [selectedLabel, setSelectedLabel] = useState("Computer Brand")
    const [attribute_lbl, setAttribute] = useState("");

    // Rendering
    useEffect(() => {
        const container = ref.current;
        
        if (!container || !width || !height || !dataset || attribute_lbl === "") return;
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
                "label_coord": angleToCoordinate(angle, 1.05)
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
                    .attr("class", "axislabel")
                    .attr("x", d => d.label_coord.x - 20)
                    .attr("y", d => d.label_coord.y + 10)
                    .text(d => d.name),
                update => update,
                exit => exit.remove() // proper exit handler
            )
            
        let line = d3.line()
            .x(d => d.x)
            .y(d => d.y)
            .curve(d3.curveLinearClosed);

        // Draw the path element
        svg.selectAll("path")
            .data(dataset)
            .join(
                enter => enter.append("path")
                    // .attr("class", "radar_path")
                    .attr("fill", (d, i) => {return color(d[attribute_lbl])})
                    .attr("stroke", (d) => color(d[attribute_lbl]))
                    .attr("stroke-opacity", 1)
                    .attr("stroke-width", 1)
                    .attr("fill-opacity", 0.25)
                    .datum(d => getPathCoordinates(d))
                    .attr("d", line),
                update => {
                    const updated = update
                        .attr("fill",  d => color(d[attribute_lbl]))
                        .attr("stroke", d => color(d[attribute_lbl]))
                        .attr("stroke-opacity", 1)
                        .attr("fill-opacity", (d) => {
                            if (d[attribute_lbl] === selectedCat){
                                return 0.75;
                            } else return 0.25;
                        })
                        .datum(d => getPathCoordinates(d))
                        .attr("d", line)
                    updated.filter(d => d[attribute_lbl] === selectedCat)
                        .raise()
                },
                exit => exit
                    .remove() // proper exit handler
            );
        
        

        // paths = scatter_svg.selectAll("path").data(dataset);
        // console.log(paths)
    // Re-run this effect whenever width or height changes
    }, [width, height, dataset, attribute_lbl, selectedCat]);

    useEffect(() => {
        let url = "radar_dataset/";
        switch (selectedLabel) {
            case "Computer Brand":
                url = url + "brand_radar.csv";
                setAttribute("brand")
                break;
            case "CPU Brand":
                url = url + "cpu_radar.csv";
                setAttribute("cpu_brand")
                break;
            case "Desktop Form Factor":
                url = url + "desk_ff_radar.csv";
                setAttribute("form_factor")
                break;
            case "Laptop Form Factor":
                url = url + "lap_ff_radar.csv";
                setAttribute("form_factor")
                break;
        }
        if (url === "radar_dataset/") {
            console.log(`Invalid dataset label: ${url}`);
            return;
        }
        d3.csv(url).then(function(data) {
            setDataset(data);
            const attributes = d3.map(data, (d) => d[attribute_lbl])
            setCategories([...attributes])
         });
    }, [selectedLabel, attribute_lbl])

    const CategoryButton = (category, idx) => {
        const color_code = d3.color(color(category)).formatHex();
        if (selectedCat === category){
            return (
                <button key={idx} onClick={() => setSelectedCat(null)} style={{ backgroundColor: color_code }} className={`z-20 h-8 px-3 opacity-70 text-white text-xs rounded cursor-pointer`}>
                    {category}
                </button>
            )
        } else {
            return (
                <button key={idx} onClick={() => setSelectedCat(category)} style={{ backgroundColor: color_code }} className={`z-20 h-8 px-3 text-white text-xs rounded cursor-pointer`}>
                    {category}
                </button>
            )
        }
    }

    const AttributeButton = (label, idx) => {
        if (selectedLabel === label){
            return (
                <button key={idx} className="h-8 px-12 bg-gray-800 opacity-70 text-white text-xs rounded cursor-pointer">
                    {label}
                </button>
            )
        } else {
            return (
                <button key={idx} onClick={() => setSelectedLabel(label)} className="h-8 px-12 bg-gray-800 text-white text-xs rounded cursor-pointer">
                    {label}
                </button>
            )
        }
    }
 
    return (
        <div className="flex w-full h-[500px]">
            <svg ref={ref} className="absolute" />
            <div className="absolute flex-col h-full w-full flex items-end justify-center space-y-2 px-4">
                {dataset && categories.map((feature, idx) => (
                    CategoryButton(feature, idx)
                ))}
            </div>
                <div className="absolute h-full w-full flex items-end py-2 justify-center space-x-8 px-4">
                {dataset && labels.map((feature, idx) => (
                    AttributeButton(feature, idx)
                ))}
            </div>
        </div>
    )
};

export default RadarChart;