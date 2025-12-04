import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

// Accept width and height as props
const LineChart = ({ width, height }) => {
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
        
        d3.csv("/computers.csv").then(function(data) {
            const dataSubset = data.map(d => ({
                release_year: +d.release_year,
                brand: d.brand,
                price: +d.price
            }));
            
            const release_year = Array.from(new Set(dataSubset.map(d => d.release_year))).sort(); // X axis
            const price = Array.from(new Set(dataSubset.map(d => d.price))); // Y axis
            const brandGroup = d3.group(dataSubset, d => d.brand)

            const grouped = d3.rollup(
                dataSubset,  
                v => d3.mean(v, d => +d.price),
                d => d.brand,
                d => d.release_year
            );


            const formattedData = Array.from(grouped, ([brand, yearMap]) => {
                const values = Array.from(yearMap, ([year, avgPrice]) => ({
                    release_year: year,
                    value: avgPrice
                })).sort((a, b) => a.release_year - b.release_year);

                return { brand, values };
            });


            const ratioData = [];
            for (const [brand, innerMap] of grouped) {
                for (const [release_year, value] of innerMap) {
                    ratioData.push({ brand, release_year, value });
                }
            }

            // x axis
            const x = d3.scalePoint()
                .range([0, innerWidth - margin.left - margin.right])
                .domain(release_year)
                .padding(0.1);
            svg.append("g")
                .attr("transform", `translate(0, ${innerHeight-20})`)
                .call(d3.axisBottom(x))
                .call(g => {
                    g.selectAll("text").style("fill", "white")
                    g.selectAll(".tick line").style("stroke", "white")
                    g.select(".domain").style("stroke", "white")
                });
            svg.append("text")
                .attr("text-anchor", "middle")
                .attr("x", (innerWidth/2))
                .attr("y", innerHeight + 18)
                .style("font-size", "14px")
                .style("fill", "white")
                .text("Release year");
        
            // y axis
            const y = d3.scaleLinear()
                .range([innerHeight-20, 0])
                .domain([1600, 2400])
            svg.append("g")
                .style("fill", "white")
                .call(d3.axisLeft(y).tickSize(0))
                .call(g => {
                    g.selectAll("text").style("fill", "white")
                    g.selectAll(".tick line").style("stroke", "white")
                    g.select(".domain").style("stroke", "white")
                });
            svg.append("text")
                .attr("text-anchor", "middle")
                .attr("transform", `translate(-45, ${innerHeight/2}) rotate(90)`)
                .style("font-size", "14px")
                .style("fill", "white")
                .text("Price (in $)");
        
            const groupKeys = Array.from(brandGroup.keys())
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
                    .html(`release year: ${d.release_year}<br> Price: $${d.value.toFixed(2)}`)
                    .style("fill", "black")
                    .style("left", (x + 10) + "px")
                    .style("top", (y + 10) + "px");
            }
            const mouseleave = function(event, d) {
                tooltip.style("opacity", 0);
                d3.select(this).style("stroke", "none").style("opacity", 0.8);
            }

            svg.selectAll(".line")
                .data(formattedData)
                .join("path")
                    .attr("fill", "none")
                    .attr("stroke", function(d) { 
                        return myColor(d.brand)})
                    .attr("stroke-width", 1.5)
                    .attr("d", function(d){
                        return d3.line()
                            .x(function(d) { 
                                return x(d.release_year); })
                            .y(function(d) { 
                                return y(d.value); })
                            (d.values)
                    })

                    
            const flatData = formattedData.flatMap(d => 
                d.values.map(v => ({
                    brand: d.brand,       
                    release_year: v.release_year, 
                    value: v.value        
                }))
            );
            // add circles 
            svg.selectAll("circle")
                .data(flatData)
                .join("circle")
                    .attr('fill', function(d) { return myColor(d.brand) })
                    .attr("r", 3) // radius
                    .attr("cx", function(d) { return x(d.release_year) } )  // center x coord
                    .attr("cy", function(d) { return y(d.value) }) // center y coord
                    .on("mouseover", mouseover)
                    .on("mousemove", mousemove)
                    .on("mouseleave", mouseleave); 
            
            // Centered Title
            svg.append("text")
                .attr("text-anchor", "middle")
                .attr("x", (innerWidth/2))
                .attr("y", -20)
                .style("font-size", "14px")
                .style("fill", "white")
                .text("Line chart");

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

    return <div ref={ref} className="relative w-full h-full bg-gray-800 rounded-lg opacity-90" />;
};

export default LineChart;