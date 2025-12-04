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

        const margin = {top: 40, right: 120, bottom: 30, left: 60};
        
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;
        
        const svg = d3.select(container)
            .append("svg")
            .attr("width", width)
            .attr("height", height)
            .attr("viewBox", [0, 0, width, height])
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);
        
        d3.csv("/computers.csv").then(function(data) {
            const dataSubset = data.map(d => ({
                release_year: +d.release_year,
                brand: d.brand,
            }));
            
            const release_year = Array.from(new Set(dataSubset.map(d => d.release_year))).sort(); // X axis
            const brands = Array.from(new Set(dataSubset.map(d => d.brand))); // 

            const grouped = d3.rollup(
                dataSubset,  
                v => v.length,
                d => d.brand,
                d => d.release_year
            );
            console.log("grouped")
            console.log(grouped)


            const formattedData = Array.from(grouped, ([brand, yearMap]) => {
                const values = Array.from(yearMap, ([release_year, length]) => ({
                    release_year: release_year,
                    value: length
                })).sort((a, b) => a.release_year - b.release_year);

                return { brand, values };
            });

            const flatData = formattedData.flatMap(d => 
                d.values.map(v => ({
                    brand: d.brand,       
                    release_year: v.release_year, 
                    value: v.value        
                }))
            );
            
            const series = d3.stack()
                .keys(d3.union(formattedData.map(d => d.brand))) // computer brand will represent subgroup
                .value(([, group], key) => group.get(key).value) // get value for each series key and stack, total y axis val
                (d3.index(flatData, d => d.release_year, d => d.brand)); // group by year then brand

            const x = d3.scaleBand()
                .range([0, width - margin.left - margin.right])
                .domain(release_year)
                .padding(0.1);
                svg.append("g")
                    .attr("transform", `translate(0,${innerHeight-margin.bottom})`)
                    .call(d3.axisBottom(x).tickSizeOuter(0))
                    .call(g => g.selectAll(".domain").remove());
                svg.append("text")
                    .attr("text-anchor", "middle")
                    .attr("x", (innerWidth/2))
                    .attr("y", innerHeight + 18)
                    .style("font-size", "14px")
                    .style("fill", "black")
                    .text("Release year");

            const y = d3.scaleLinear()
                .domain([0, 19000])
                .range([innerHeight - 30, 0])
            svg.append("g")
                .attr("transform", `translate(0,0)`)
                .call(d3.axisLeft(y).ticks(null, "s"))
                .call(g => g.selectAll(".domain").remove());
                svg.append("text")
                    .attr("text-anchor", "middle")
                    .attr("transform", `translate(-45, ${innerHeight/2}) rotate(90)`)
                    .style("font-size", "14px")
                    .style("fill", "black")
                    .text("Number of Computers");

            const color = d3.scaleOrdinal()
                .domain(series.map(d => d.key))
                .range(d3.schemeSpectral[series.length])
                .unknown("#ccc");

            // append rectangles, each series will have one for each brand.
            const years = Array.from(d3.union(flatData.map(d => d.release_year)));
            svg.append("g")
                .selectAll()
                .data(series)
                .join("g")
                    .attr("fill", d => color(d.key))
                .selectAll("rect")
                .data(D => D.map(d => (d.key = D.key, d)))
                .join("rect")
                    .attr("x", (d, i) => x(years[i])) 
                    .attr("y", d => y(d[1]))
                    .attr("height", d => y(d[0]) - y(d[1]))
                    .attr("width", x.bandwidth())
                .append("title")
                    .text((d, i) => `${years[i]} ${d.key}\n${d[1] - d[0]}`);

            // Legend
            var size = 20
            svg.selectAll("mydots")
            .data(brands)
            .enter()
            .append("rect")
                .attr("x", innerWidth )
                .attr("y", function(d,i){ return  i*(size+5)}) // 100 is where the first dot appears. 25 is the distance between dots
                .attr("width", size)
                .attr("height", size)
                .style("fill", function(d){ return color(d)})

            // Add one dot in the legend for each name.
            svg.selectAll("mylabels")
            .data(brands)
            .enter()
            .append("text")
                .attr("x", (innerWidth) + size*1.2)
                .attr("y", function(d,i){ return  i*(size+5) + (size/2)}) // 100 is where the first dot appears. 25 is the distance between dots
                .style("fill", function(d){ return color(d)})
                .text(function(d){ return d})
                .attr("text-anchor", "left")
                .style("alignment-baseline", "middle")
        });

    // Re-run this effect whenever width or height changes
    }, [width, height]);

    return <div ref={ref} className="relative w-full h-full" />;
};

export default BarChart;