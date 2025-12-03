import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

// Accept width and height as props
const BarChart = ({ width, height }) => {
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
            }));
            
            const computers_per_year = d3.flatRollup(dataSubset, v => v.length, (d) => d.release_year, (d) => d.brand);

            console.log(computers_per_year)

            const x = d3.scalePoint()
                .range([0, innerWidth - margin.left - margin.right])
                .domain(release_year)
                .padding(0.1);

            svg.append("g")
                .attr("transform", `translate(0, ${innerHeight-20})`)
                .call(d3.axisBottom(x))
                .selectAll("text")
                    .style("fill", "black")
            svg.append("text")
                .attr("text-anchor", "middle")
                .attr("x", (innerWidth/2))
                .attr("y", innerHeight + 18)
                .style("font-size", "14px")
                .style("fill", "black")
                .text("Release year");
        
            const y = d3.scaleLinear()
                .range([innerHeight-20, 0])
                .domain([1600, 2400])

            svg.append("g")
                // .style("font-size", 12)
                .style("fill", "black")
                .call(d3.axisLeft(y).tickSize(0))
                .selectAll("text")
                    .style("fill", "black")
            .select(".domain").remove();
            svg.append("text")
                .attr("text-anchor", "middle")
                // .attr("x", 0)
                // .attr("y", innerHeight/2)
                .attr("transform", `translate(-45, ${innerHeight/2}) rotate(90)`)
                .style("font-size", "14px")
                .style("fill", "black")
                .text("Number of Computers Manufactured");
        
            // Centered Title
            svg.append("text")
                .attr("text-anchor", "middle")
                .attr("x", (innerWidth/2))
                .attr("y", -20)
                .style("font-size", "14px")
                .style("fill", "black")
                .text("Bar Chart");

            
        });

    // Re-run this effect whenever width or height changes
    }, [width, height]);

    return <div ref={ref} className="relative w-full h-full" />;
};

export default BarChart;