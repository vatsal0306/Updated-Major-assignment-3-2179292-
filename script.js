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

d3.json("author_network1.json").then(data => {
    console.log("Data loaded:", data);

    const degreeMap = {};
    data.links.forEach(link => {
        degreeMap[link.source] = (degreeMap[link.source] || 0) + 1;
        degreeMap[link.target] = (degreeMap[link.target] || 0) + 1;
    });

    data.nodes.forEach(node => {
        node.degree = degreeMap[node.id] || 0;  // Use id here
    });

    const sizeScale = d3.scaleSqrt()
        .domain(d3.extent(data.nodes, d => d.degree))
        .range([3, 12]);

    // Step 1: Find the top 10 countries by frequency
    const countryCount = {};
    data.nodes.forEach(node => {
        countryCount[node.country] = (countryCount[node.country] || 0) + 1;
    });

    const topCountries = Object.entries(countryCount)
        .sort((a, b) => b[1] - a[1])  // Sort by the number of occurrences
        .slice(0, 10)  // Get the top 10 countries
        .map(entry => entry[0]);  // Extract country names

    // Step 2: Define the custom color scale
    const customColors = [
        "#FF5733", "#33FF57", "#3357FF", "#F333FF", "#FF33B8",
        "#33FFF3", "#B8FF33", "#FF8C33", "#8C33FF", "#33FFC5"
    ];

    const colorScale = d3.scaleOrdinal()
        .domain(topCountries)
        .range(customColors);

    // Apply a fallback color for others
    const otherColor = "#A9A9A9"; // Grey color for "Other" countries

    // Step 3: Adjust the node color based on whether the country is in the top 10
    const simulation = d3.forceSimulation(data.nodes)
        .force("link", d3.forceLink(data.links).id(d => d.id).strength(0.5))
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
        .attr("fill", d => topCountries.includes(d.country) ? colorScale(d.country) : otherColor) // Hue channel based on country
        .call(drag(simulation));

    const tooltip = d3.select("body").append("div")
        .
