import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

// Accept width and height as props
const ScatterPlot = ({ width, height }) => {
    const ref = useRef(null);

    useEffect(() => {
        const container = ref.current;
        
        if (!container || !width || !height) return;

        // Clear previous drawing
        d3.select(container).selectAll("*").remove();

        const margin = {top: 40, right: 30, bottom: 30, left: 60};
        
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;
        
        const svg = d3.select(container)
            .append("svg")
            .attr("width", width)
            .attr("height", height)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);
        
        d3.csv("/tsne.csv").then(function(data) {
            
            const dataSubset = data.slice(0, 200)
            // const dataMap = dataSubset.map(d => ({
            //     dimX: +d.dimX,
            //     dimY: +d.dimY,
            //     price: +d.price,
            //     label: d.label,
            //     cpu_cores: +d.cpu_cores,
            //     cpu_base_ghz: +d.cpu_base_ghz,
            //     cpu_boost_ghz: +d.cpu_boost_ghz,
            //     cpu_threads: +d.cpu_threads,
            //     cpu_score: +d.cpu_score,
            //     cpu_model: +d.cpu_model
            // }));

            const dataMap = dataSubset;

            const sizeScale = d3.scaleLinear()
                .domain(d3.extent(dataSubset, d => +d.cpu_cores))
                .range([10, 30])

            const filteredData = dataMap.filter(d => d.label !== "") // get rid of rows with no label
            const chipGroup = d3.group(filteredData, d => d.label)

            const x = d3.scaleLinear()
                .range([0, innerWidth - margin.left - margin.right])
                .domain(d3.extent(dataMap, d => +d.dimX))
            // svg.append("g")
            //     .attr("transform", `translate(0, ${innerHeight})`)
            //     .call(d3.axisBottom(x))
            //     .selectAll("text")
            //         .style("fill", "black")
        
            const y = d3.scaleLinear()
                .range([innerHeight, 0])
                .domain(d3.extent(dataMap, d => +d.dimY))

            // svg.append("g")
            //     .style("fill", "black")
            //     .call(d3.axisLeft(y).tickSize(0))
            //     .selectAll("text")
            //         .style("fill", "black")
            //     .select(".domain").remove();
        
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
                tooltip.style("opacity", 1);
                d3.select(this).style("stroke", "black").style("opacity", 1);   
            }
            const mousemove = function(event, d) {
                const [x, y] = d3.pointer(event, container);
                tooltip
                    .html(`Model: ${d.cpu_model} <br> CPU cores: ${d.cpu_cores} <br> CPU Clock Speed: ${d.cpu_base_ghz} GHz <br> Price: ${d.price} <br> Overall point: ${d3.format(".2f")(d.cpu_score)}`)
                    .style("fill", "black")
                    .style("left", (x + 10) + "px")
                    .style("top", (y + 10) + "px");
            }
            const mouseleave = function(event, d) {
                tooltip.style("opacity", 0);
                d3.select(this).style("stroke", "none").style("opacity", 0.8);
            }

            const logo_radius = 25
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
                    .on("mouseleave", mouseleave);     

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
                .style("fill", "black")
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
    }, [width, height]);

    return <div ref={ref} className="relative w-full h-full" />;
};

export default ScatterPlot;