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
        const radialScale = d3.scaleLinear()
            .domain([0, 1])
            .range([0, maxRadius])

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
                coordinates.push(angleToCoordinate(angle, data_point[ft_name]*0.85))
            }
            return coordinates;
        }

        const margin = {top: 20, right: 30, bottom: 30, left: 0};
        
        const svg = d3.select(container)
            .attr("class", "radar-chart")
            .attr("width", width)
            .attr("height", height)
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
                    .attr("stroke", "white")
            )

        // Draw axis label
        svg.selectAll(".axislabel")
            .data(featureData)
            .join(
                enter => enter.append("text")
                    .attr("class", "axislabel")
                    .attr("x", d => d.label_coord.x - 20)
                    .attr("y", d => d.label_coord.y + 10)
                    .attr("fill", "white")
                    .text(d => d.name),
                update => update,
                exit => exit.remove() // proper exit handler
            )
            
        let line = d3.line()
            .x(d => d.x)
            .y(d => d.y)
            .curve(d3.curveLinearClosed);

        const font_size = 24

        // Draw the path element
        svg.selectAll("g.triangle")
            .data(dataset)
            .join(
                enter => {
                    const g = enter.append("g")
                        .attr("class", "triangle")
                               
                    g.selectAll("text.node-label")
                        .data(d => {
                            if (d[attribute_lbl] === selectedCat){
                                return getPathCoordinates(d).map(p => ({
                                    ...p,
                                    raw: d
                                }))
                            } else return [];
                        })
                        .join("text")
                        .attr("class", "node-label")
                        .attr("x", p => p.x + 8)
                        .attr("y", p => p.y + 3)
                        .attr("font-size", font_size)
                        .attr("fill", "white")
                        .style("opacity", 1)
                        // .attr("fill", p => color(p.raw[attribute_lbl]))
                        .text((p,i) => d3.format(".2f")(p.raw[features[i]]));

                    g.append("path")
                        // .attr("class", "radar_path")
                        .attr("fill", (d, i) => {return color(d[attribute_lbl])})
                        .attr("stroke", (d) => color(d[attribute_lbl]))
                        .attr("stroke-opacity", 1)
                        .attr("stroke-width", 1)
                        .attr("fill-opacity", 0.25)
                        .attr("d", d => line(getPathCoordinates(d)));


                    g.selectAll("circle.node")
                        .data(d =>
                            // 3 coords + carry category for color
                            getPathCoordinates(d).map(p => ({
                                ...p,
                                category: d[attribute_lbl]
                            }))
                        )
                        .join("circle")
                        .attr("class", "node")
                        .attr("cx", p => p.x)
                        .attr("cy", p => p.y)
                        .attr("r", 5)
                        .attr("fill", p => color(p.category))
                        .attr("fill-opacity", (p) => {
                            if (p.category === selectedCat){
                                return 1;
                            } else return 0.50;
                        });
                },
                update => {

                    update.selectAll("text.node-label")
                        .data(d => {
                            if (d[attribute_lbl] === selectedCat){
                                return getPathCoordinates(d).map(p => ({
                                    ...p,
                                    raw: d
                                }))
                            } else return [];
                        })
                        .join("text")
                        .attr("class", "node-label")
                        .attr("x", p => p.x + 8)
                        .attr("y", p => p.y + 3)
                        .attr("font-size", font_size)
                        .attr("fill", "white")
                        .style("opacity", 1)
                        // .attr("fill", p => color(p.raw[attribute_lbl]))
                        .text((p,i) => d3.format(".2f")(p.raw[features[i]]));

                    update.select("path")
                        .attr("fill",  d => color(d[attribute_lbl]))
                        .attr("stroke", d => color(d[attribute_lbl]))
                        .attr("stroke-opacity", 1)
                        .attr("fill-opacity", (d) => {
                            if (d[attribute_lbl] === selectedCat){
                                return 0.70;
                            } else return 0.25;
                        })
                        .attr("d", d => line(getPathCoordinates(d)));


                    update.selectAll("circle.node")
                        .data(d =>
                        getPathCoordinates(d).map(p => ({
                            ...p,
                            category: d[attribute_lbl]
                        }))
                        )
                        .join(
                        enter => enter.append("circle")
                            .attr("class", "node")
                            .attr("r", 5),
                        update => update,
                        exit => exit.remove()
                        )
                        .attr("cx", p => p.x)
                        .attr("cy", p => p.y)
                        .attr("fill", p => color(p.category))
                        .attr("fill-opacity", (p) => {
                            if (p.category === selectedCat){
                                return 1;
                            } else return 0.50;
                        });
                    
                    
                },
                exit => exit
                    .remove() // proper exit handler
            );
        
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
                <button key={idx} className="h-8 px-12 bg-[#0a4abf] text-[#fff200] text-xs rounded cursor-pointer">
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
        <div className="flex w-full h-[500px] rounded-xl bg-gray-800 opacity-90">
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