const width = window.innerWidth;
const height = window.innerHeight;

const svg = d3.select("#visualization")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .call(d3.zoom().on("zoom", (event) => {
        zoomGroup.attr("transform", event.transform);
    }));

const zoomGroup = svg.append("g");

d3.json("author_network.json").then(data => {
    console.log("Data loaded:", data);

    const degreeMap = {};
    data.links.forEach(link => {
        degreeMap[link.source] = (degreeMap[link.source] || 0) + 1;
        degreeMap[link.target] = (degreeMap[link.target] || 0) + 1;
    });

    data.nodes.forEach(node => {
        node.degree = degreeMap[node.name] || 0;
    });

    const sizeScale = d3.scaleSqrt()
        .domain(d3.extent(data.nodes, d => d.degree))
        .range([3, 12]);

    const countries = Array.from(new Set(data.nodes.map(d => d.country)));
    const colorScale = d3.scaleOrdinal(d3.schemeCategory10).domain(countries);

    const simulation = d3.forceSimulation(data.nodes)
        .force("link", d3.forceLink(data.links).id(d => d.name).strength(0.5))
        .force("charge", d3.forceManyBody().strength(-30))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("collide", d3.forceCollide().radius(d => sizeScale(d.degree) + 2)); 

    const link = zoomGroup.append("g")
        .selectAll("line")
        .data(data.links)
        .enter()
        .append("line")
        .attr("stroke", "#999")
        .attr("stroke-opacity", 0.6)
        .attr("stroke-width", 1.5);

    const node = zoomGroup.append("g")
        .selectAll("circle")
        .data(data.nodes)
        .enter()
        .append("circle")
        .attr("r", d => sizeScale(d.degree))  
        .attr("fill", d => colorScale(d.country))
        .call(drag(simulation));

    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("background-color", "white")
        .style("border", "solid")
        .style("border-width", "1px")
        .style("padding", "10px")
        .style("display", "none");

    node
        .on("mouseover", (event, d) => {
            tooltip.style("display", "block")
                .html(`<strong>${d.name}</strong><br>Country: ${d.country}<br>Connections: ${d.degree}`);
            node.attr("opacity", n => n.country === d.country ? 1 : 0.2);
        })
        .on("mousemove", event => {
            tooltip.style("top", (event.pageY + 5) + "px")
                .style("left", (event.pageX + 5) + "px");
        })
        .on("mouseout", () => {
            tooltip.style("display", "none");
            node.attr("opacity", 1);
        })
        .on("click", (event, d) => {
            tooltip.style("display", "block")
                .html(`<strong>${d.name}</strong><br>Country: ${d.country}<br>Affiliation: ${d.affiliation || "Not available"}`)
                .style("top", (event.pageY + 5) + "px")
                .style("left", (event.pageX + 5) + "px");
        });

    simulation.on("tick", () => {
        link
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);

        node
            .attr("cx", d => d.x)
            .attr("cy", d => d.y);
    });

    const legendContainer = d3.select(".legend");

    legendContainer.selectAll(".legend-item").remove();

    countries.forEach(country => {
        const legendItem = legendContainer.append("div").attr("class", "legend-item");

        legendItem.append("div")
            .style("background-color", country === "Other" ? "#A9A9A9" : colorScale(country))
            .style("width", "15px")
            .style("height", "15px")
            .style("display", "inline-block")
            .style("margin-right", "10px");

        legendItem.append("span").text(country);
    });

    d3.select("#forceStrength").on("input", function() {
        simulation.force("charge").strength(+this.value);
        simulation.alpha(1).restart();
    });

    d3.select("#collisionRadius").on("input", function() {
        simulation.force("collide").radius(d => sizeScale(d.degree) + +this.value);
        simulation.alpha(1).restart();
    });

    d3.select("#linkStrength").on("input", function() {
        simulation.force("link").strength(+this.value);
        simulation.alpha(1).restart();
    });
}).catch(error => console.error("Error loading data:", error));

function drag(simulation) {
    return d3.drag()
        .on("start", event => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            event.subject.fx = event.subject.x;
            event.subject.fy = event.subject.y;
        })
        .on("drag", event => {
            event.subject.fx = event.x;
            event.subject.fy = event.y;
        })
        .on("end", event => {
            if (!event.active) simulation.alphaTarget(0);
            event.subject.fx = null;
            event.subject.fy = null;
        });
}
