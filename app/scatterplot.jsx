import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

// Accept width and height as props
const ScatterPlot = ({ width, height }) => {
    const ref = useRef(null);
    const [topK, setTopK] = useState([]);

    useEffect(() => {
        const container = ref.current;
        
        if (!container || !width || !height) return;

        // Clear previous drawing
        d3.select(container).selectAll("*").remove();

        const margin = {top: 40, right: 30, bottom: 30, left: 60};
        
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;
        const logo_radius = 25

        const svg = d3.select(container)
            .append("svg")
            .attr("width", width)
            .attr("height", height)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`)
        
        const doubleclick = function(event, d){
            console.log("background click");
            setTopK([]);
        }
        console.log(topK)
        d3.select("body")
            .on("dblclick", doubleclick);


        d3.csv("/tsne.csv").then(function(data) {
            
            const dataMap = data.slice(0, 50)

            const sizeScale = d3.scaleLinear()
                .domain(d3.extent(dataMap, d => +d.cpu_cores))
                .range([10, 30])

            const filteredData = dataMap.filter(d => d.label !== "") // get rid of rows with no label
            const chipGroup = d3.group(filteredData, d => d.label)

            const x = d3.scaleLinear()
                .range([0, innerWidth - margin.left - margin.right])
                .domain(d3.extent(dataMap, d => +d.dimX))
        
            const y = d3.scaleLinear()
                .range([innerHeight, 0])
                .domain(d3.extent(dataMap, d => +d.dimY))
        
            const groupKeys = Array.from(chipGroup.keys())
            const myColor = d3.scaleOrdinal(d3.schemeCategory10 )
                .domain(groupKeys);
            
            // Tooltip 
            const tooltip = d3.select(container).append("div")
                .style("opacity", 0)
                .attr("class", "tooltip")
                .style("background-color", "white")
                .style("border", "solid")
                .style("border-width", "2px")
                .style("padding", "5px")
                .style("color", "black")
                .style("position", "absolute");

            const mouseover = function(event, d) {
                simulation.alphaTarget(0.4).restart();   // wake up simulation
                tooltip.style("opacity", 1);
                d3.select(this)
                    .transition()
                    .duration(100)
                    .style("stroke", "black")
                    .style("opacity", 1)
                    .attr("width", logo_radius + 25)
                    .attr("height", logo_radius + 25);   
            }
            const mousemove = function(event, d) {
                const [x, y] = d3.pointer(event, container);
                tooltip
                    .html(`Model: ${d.cpu_model} <br> CPU cores: ${d.cpu_cores} <br> CPU Clock Speed: ${d.cpu_base_ghz} GHz <br> Price: ${d.price} <br> Overall point: ${d3.format(".2f")(d.cpu_score)}`)
                    .style("fill", "black")
                    .style("left", (x + 10) + "px")
                    .style("top", (y + 10) + "px");
            }

            const mouseclick = function(event, d) {
                const [x, y] = d3.pointer(event, container);
                console.log(d)
                const results = [d];
                const percent_diff_threshold = 0.1
                for (const data of filteredData) {
                    const percent_diff = Math.abs( (parseFloat(data.cpu_score) - parseFloat(d.cpu_score)) / ((parseFloat(data.cpu_score) + parseFloat(d.cpu_score))/2));
                    if (percent_diff < percent_diff_threshold && parseFloat(data.price) < parseFloat(d.price)){
                        results.push(data);
                    }
                    if (results.length > 3) break;
                }
                setTopK(results);
                console.log(results)
            }

            const mouseleave = function(event, d) {
                simulation.alphaTarget(0);               // let it cool
                tooltip.style("opacity", 0);
                d3.select(this)
                    .transition()
                    .duration(100)
                    .style("stroke", "none")
                    .style("opacity", 0.8)
                    .attr("width", logo_radius)
                    .attr("height", logo_radius);   
            }

            svg.selectAll("image.node-logo")
                .data(filteredData, (d, i) => i)
                .enter()
                .append("image")
                    .attr("class", "node-logo")
                    .attr("href", d => {
                        switch (d.label){
                            case "Intel":
                                return "intel.png";
                            case "AMD":
                                return "amd.png";
                            case "Apple":
                                return "apple.jpg"
                        }
                    })
                    .attr("x", d => x(d.dimX) - logo_radius/2)
                    .attr("y", d => y(d.dimY) - logo_radius/2)
                    .attr("width", logo_radius)
                    .attr("height", logo_radius)
                    .style("opacity", .75)
                    .attr("preserveAspectRatio", "xMidYMid meet")
                    .on("mouseover", mouseover)
                    .on("mousemove", mousemove)
                    .on("mouseleave", mouseleave)
                    .on("click", mouseclick);

            if (topK.length <= 1) {
                svg.selectAll(".topk-line").remove();
                console.log("removing")
            } else {
                const anchor = topK[0];
                console.log("test")
                svg.selectAll(".topk-line")
                    .data(topK.slice(1))
                    .join(
                        enter => enter.append("line")
                            .attr("class", "topk-line")
                            .attr("x1", x(anchor.dimX))
                            .attr("y1", y(anchor.dimY))
                            .attr("x2", d => x(d.dimX))
                            .attr("y2", d => y(d.dimY))
                            .attr("stroke", "black"),
                        update => update
                            .attr("x1", x(anchor.dimX))
                            .attr("y1", y(anchor.dimY))
                            .attr("x2", d => x(d.dimX))
                            .attr("y2", d => y(d.dimY)),
                        exit => exit.remove()
                    );
            }

            // Avoid collision and overlapping
            const simulation = d3.forceSimulation(filteredData)
                .force("x", d3.forceX(d => x(d.dimX)))
                .force("y", d3.forceY(d => y(d.dimY)))
                .force("collision", d3.forceCollide(logo_radius / 2 + 2))
                .on("tick", () => {
                    svg.selectAll("image.node-logo")
                        .attr("x", d => d.x - logo_radius / 2)
                        .attr("y", d => d.y - logo_radius / 2);
                });

            // Centered Title
            svg.append("text")
                .attr("text-anchor", "middle")
                .attr("x", (innerWidth/2))
                .attr("y", -20)
                .style("font-size", "14px")
                .style("fill", "white")
                .text("CPU Similarity Chart");

            // Add one dot in the legend for each name.
            // var size = 20
            // svg.selectAll("mydots")
            // .data(groupKeys)
            // .enter()
            // .append("rect")
            //     .attr("x", innerWidth - margin.left - margin.right )
            //     .attr("y", function(d,i){ return  i*(size+5)}) // 100 is where the first dot appears. 25 is the distance between dots
            //     .attr("width", size)
            //     .attr("height", size)
            //     .style("fill", function(d){ return myColor(d)})

            // // Add one dot in the legend for each name.
            // svg.selectAll("mylabels")
            // .data(groupKeys)
            // .enter()
            // .append("text")
            //     .attr("x", (innerWidth - margin.left - margin.right) + size*1.2)
            //     .attr("y", function(d,i){ return  i*(size+5) + (size/2)}) // 100 is where the first dot appears. 25 is the distance between dots
            //     .style("fill", function(d){ return myColor(d)})
            //     .text(function(d){ return d})
            //     .attr("text-anchor", "left")
            //     .style("alignment-baseline", "middle")
        });

    // Re-run this effect whenever width or height changes
    }, [topK]);

    return <div ref={ref} className="relative w-full h-full border border-white" />;
};

export default ScatterPlot;