/**
 * @param conf graph configuration
 * @param data graph data {nodes, edges}
 * @constructor
 */
function Graph(conf, data) {
    const width = conf.width;
    const height = conf.height;

    let zoom = 1;

    const svg = d3.select("svg")
        .attr("width", width)
        .attr("height", height);
    const viewport = svg.append('g');
    svg.call(d3.zoom()
        .scaleExtent([0.1, 2])
        .on('zoom', () => {
            const e = d3.event.transform;
            if (zoom !== e.k){
                zoom = e.k;
                console.log(`event: ${e.k}`);
            }
            viewport.attr('transform', e);
        }));

    const tooltip = d3.select(".tooltip");

    const renderer = new Renderer(viewport, tooltip, conf, data);

    /**
     * Draws the graph into the svg
     * @param lod level of detail
     */
    this.draw = (lod) => {
        renderer.drawNodes(lod);
        renderer.drawEdges(lod);
    };
}
