// "use client"
import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
const HeatMap = ({ width, height }) => {
    const ref = useRef(null);

    useEffect(() => {
        const container = ref.current;
        
        if (!container || !width || !height) return;

        // Clear previous drawing
        d3.select(container).selectAll("*").remove();

        const margin = {top: 60, right: 100, bottom: 50, left: 100};
        
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
                form_factor: d.form_factor,
                brand: d.brand,
                price: +d.price
            }));
            const form_factor = Array.from(new Set(dataSubset.map(d => d.form_factor)));
            const brands = Array.from(new Set(dataSubset.map(d => d.brand)));

            const grouped = d3.rollup(
                dataSubset,  
                v => d3.mean(v, d => +d.price),
                d => d.brand,
                d => d.form_factor
            );

            const ratioData = [];
            for (const [brand, innerMap] of grouped) {
                for (const [form_factor, value] of innerMap) {
                    ratioData.push({ brand, form_factor, value });
                }
            }

            const x = d3.scaleBand()
                .range([0, innerWidth])
                .domain(brands)
                .padding(0.05);
            svg.append("g")
                .attr("transform", `translate(0, ${innerHeight})`)
                .call(d3.axisBottom(x).tickSize(0))
                .selectAll("text")
                    .style("fill", "white")
            .select(".domain").remove();
            svg.append("text")
                .attr("text-anchor", "middle")
                .attr("x", innerWidth/2)
                .attr("y", innerHeight + margin.bottom-15)
                .style("font-size", "14px")
                .style("fill", "white")
                .text("Brand");
        
            const y = d3.scaleBand()
                .range([innerHeight, 0])
                .domain(form_factor)
                .padding(0.05);
            svg.append("g")
                .style("font-size", 12)
                .style("fill", "white")
                .call(d3.axisLeft(y).tickSize(0))
                .selectAll("text")
                    .style("fill", "white")
            .select(".domain").remove();
            svg.append("text")
                .attr("text-anchor", "middle")
                .attr("transform", `translate(-75, ${innerHeight/2}) rotate(90)`)
                .style("font-size", "14px")
                .style("fill", "white")
                .text("Form Factor");
        
            const [minValue, maxValue] = d3.extent(ratioData, d => d.value);
            console.log("min" + minValue)
            console.log("max" + maxValue)
            const myColor = d3.scaleSequential()
                .interpolator(d3.interpolateRdBu)
                .domain([maxValue, minValue]);
            
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
                    .html(`Brand: ${d.brand}<br> Form: ${d.form_factor}<br> Avg. Price: $${d.value.toFixed(2)}`)
                    .style("fill", "black")
                    .style("left", (x + 10) + "px")
                    .style("top", (y + 10) + "px");
            }
            const mouseleave = function(event, d) {
                tooltip.style("opacity", 0);
                d3.select(this).style("stroke", "none").style("opacity", 0.8);
            }

            svg.selectAll()
                .data(ratioData, function(d) {return d.brand + ':' + d.form_factor;})
                .join("rect")
                    .attr("x", function(d) { return x(d.brand) })
                    .attr("y", function(d) { return y(d.form_factor) })
                    .attr("width", x.bandwidth())
                    .attr("height", y.bandwidth())
                    .style("fill", function(d) { return myColor(d.value) })
                    .style("stroke", "none")
                    .style("opacity", 0.8)
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
                .text("Price Distribution");
              
        });

    // Re-run this effect whenever width or height changes
    }, [width, height]);

    return <div ref={ref} className="relative w-full h-full" />;
};

export default HeatMap;