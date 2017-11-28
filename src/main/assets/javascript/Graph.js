/**
 * @param conf graph configuration
 * @param data graph data {nodes, edges}
 * @constructor
 */
function Graph(conf, data) {
    const width = conf.width;
    const height = conf.height;

    const svg = d3.select("svg")
        .attr("width", width)
        .attr("height", height);

    const tooltip = d3.select(".tooltip");

    const renderer = new Renderer(svg, tooltip, conf, data);

    /**
     * Draws the graph into the svg
     * @param lod level of detail
     */
    this.draw = (lod) => {
        renderer.drawNodes(lod);
        renderer.drawEdges(lod);
    };
}
