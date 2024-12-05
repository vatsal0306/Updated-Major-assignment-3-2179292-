const dataUrl = 'data_scopus.csv';

d3.json(dataUrl).then(data => {
    // Filter and prepare data
    const nodes = data.nodes.filter(d => d.year && d.affiliation && d.name);
    const links = data.links;

    // Extract top 10 countries by affiliation
    const affiliationCount = d3.rollup(nodes, v => v.length, d => d.country);
    const topCountries = Array.from(affiliationCount.keys())
        .sort((a, b) => affiliationCount.get(b) - affiliationCount.get(a))
        .slice(0, 10);

    // Define color scale for the top 10 countries
    const colorScale = d3.scaleOrdinal()
        .domain(topCountries)
        .range(d3.schemeCategory10)
        .unknown("#A9A9A9");

    // Set up SVG dimensions
    const svg = d3.select("#graph");
    const width = +svg.attr("width");
    const height = +svg.attr("height");

    // Define radius scale based on degree
    const radiusScale = d3.scaleSqrt()
        .domain([1, d3.max(nodes, d => d.degree)])
        .range([3, 12]);

    // Tooltip div
    const tooltip = d3.select("#tooltip");

    // Initialize force simulation
    const simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links).id(d => d.id).strength(0.5))
        .force("charge", d3.forceManyBody().strength(-30))
        .force("collide", d3.forceCollide().radius(d => radiusScale(d.degree) + 3))
        .force("center", d3.forceCenter(width / 2, height / 2));

    // Add links
    const link = svg.append("g")
        .attr("class", "links")
        .selectAll("line")
        .data(links)
        .enter().append("line")
        .attr("stroke", "#aaa");

    // Add nodes
    const node = svg.append("g")
        .attr("class", "nodes")
        .selectAll("circle")
        .data(nodes)
        .enter().append("circle")
        .attr("r", d => radiusScale(d.degree))
        .attr("fill", d => colorScale(d.country))
        .on("mouseover", (event, d) => {
            const affiliation = d.affiliation;
            node.style("opacity", node => node.affiliation === affiliation ? 1 : 0.2);
        })
        .on("mouseleave", () => {
            node.style("opacity", 1);
        })
        .on("click", (event, d) => {
            tooltip.style("left", (event.pageX + 5) + "px")
                .style("top", (event.pageY - 5) + "px")
                .style("opacity", 1)
                .html(`<strong>Name:</strong> ${d.name}<br>
                       <strong>Affiliation:</strong> ${d.affiliation}<br>
                       <strong>Country:</strong> ${d.country}`);
        });

    // Hide tooltip on outside click
    svg.on("click", () => tooltip.style("opacity", 0));

    // Update node and link positions during simulation
    simulation.on("tick", () => {
        link.attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);

        node.attr("cx", d => d.x)
            .attr("cy", d => d.y);
    });

    // Control sliders
    d3.select("#chargeStrength").on("input", function () {
        simulation.force("charge").strength(+this.value);
        simulation.alpha(1).restart();
    });

    d3.select("#linkStrength").on("input", function () {
        simulation.force("link").strength(+this.value);
        simulation.alpha(1).restart();
    });

    d3.select("#collisionRadius").on("input", function () {
        simulation.force("collide").radius(+this.value);
        simulation.alpha(1).restart();
    });
});
