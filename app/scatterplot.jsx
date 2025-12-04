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
            
            const dataSubset = data.slice(0, 3000)
            const dataMap = data.slice(0,3000).map(d => ({
                dimX: +d.dimX,
                dimY: +d.dimY,
                price: +d.price,
                label: d.label,
                cpu_cores: +d.cpu_cores
            }));

            const sizeScale = d3.scaleLinear()
                .domain(d3.extent(dataSubset, d => +d.cpu_cores))
                .range([4, 10])

            console.log("test with 8: " + sizeScale(8))
            console.log("test with 15: " + sizeScale(15))
            const filteredData = dataMap.filter(d => d.label !== "") // get rid of rows with no label
            console.log(filteredData)
            
            // const dimX = Array.from(new Set(filteredData.map(d => d.dimX))).sort(); // X axis
            // const dimY = Array.from(new Set(filteredData.map(d => d.dimY))); // Y axis
            // const price = Array.from(new Set(filteredData.map(d => d.price))); // Y axis
            const chipGroup = d3.group(filteredData, d => d.label)

            const x = d3.scaleLinear()
                .range([0, innerWidth - margin.left - margin.right])
                .domain([-250, 250])
            // svg.append("g")
            //     .attr("transform", `translate(0, ${innerHeight})`)
            //     .call(d3.axisBottom(x))
            //     .selectAll("text")
            //         .style("fill", "black")
        
            const y = d3.scaleLinear()
                .range([innerHeight, 0])
                .domain([-250, 250])
            // svg.append("g")
            //     .style("fill", "black")
            //     .call(d3.axisLeft(y).tickSize(0))
            //     .selectAll("text")
            //         .style("fill", "black")
            // .select(".domain").remove();
        
            const groupKeys = Array.from(chipGroup.keys())
            console.log("keys: ")
            console.log(groupKeys)
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
                    .html(`label: ${d.label}<br> CPU cores: ${d.cpu_cores} <br> price: ${d.price}<br> DimX: ${d.dimX}<br> DimY: ${d.dimY}`)
                    .style("fill", "black")
                    .style("left", (x + 10) + "px")
                    .style("top", (y + 10) + "px");
            }
            const mouseleave = function(event, d) {
                tooltip.style("opacity", 0);
                d3.select(this).style("stroke", "none").style("opacity", 0.8);
            }

            // add circles for each mob
            svg.selectAll("circle")
                .data(filteredData, (d, i) => i)
                .enter()
                .append("circle")
                    .attr("cx", function(d) { return x(d.dimX) } )  // center x coord
                    .attr("cy", function(d) { return y(d.dimY) }) // center y coord
                    .attr("r", function(d) { return sizeScale(d.cpu_cores) }) // radius
                    .attr('fill', function(d) { return myColor(d.label) })
                    .style("opacity", .75)
                    .on("mouseover", mouseover)
                    .on("mousemove", mousemove)
                    .on("mouseleave", mouseleave); 
            
            // Centered Title
            svg.append("text")
                .attr("text-anchor", "middle")
                .attr("x", (innerWidth/2))
                .attr("y", -20)
                .style("font-size", "14px")
                .style("fill", "black")
                .text("Scatter plot");

            // Add one dot in the legend for each name.
            var size = 20
            svg.selectAll("mydots")
            .data(groupKeys)
            .enter()
            .append("rect")
                .attr("x", innerWidth - margin.left - margin.right )
                .attr("y", function(d,i){ return  i*(size+5)}) // 100 is where the first dot appears. 25 is the distance between dots
                .attr("width", size)
                .attr("height", size)
                .style("fill", function(d){ return myColor(d)})

            // Add one dot in the legend for each name.
            svg.selectAll("mylabels")
            .data(groupKeys)
            .enter()
            .append("text")
                .attr("x", (innerWidth - margin.left - margin.right) + size*1.2)
                .attr("y", function(d,i){ return  i*(size+5) + (size/2)}) // 100 is where the first dot appears. 25 is the distance between dots
                .style("fill", function(d){ return myColor(d)})
                .text(function(d){ return d})
                .attr("text-anchor", "left")
                .style("alignment-baseline", "middle")
        });

    // Re-run this effect whenever width or height changes
    }, [width, height]);

    return <div ref={ref} className="relative w-full h-full" />;
};

export default ScatterPlot;