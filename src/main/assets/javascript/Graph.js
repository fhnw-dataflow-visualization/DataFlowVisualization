/**
 * @param conf graph configuration
 * @param data graph data {nodes, edges}
 * @constructor
 */
function Graph(conf, data) {
    const width = conf.width;
    const height = conf.height;
    const zoom = conf.zoom;

    let scale = 1;
    let lod = 2;

    const svg = d3.select("svg")
        .attr("width", width)
        .attr("height", height);
    const viewport = svg.append('g');
    svg.call(d3.zoom()
        .scaleExtent([zoom[0], zoom[zoom.length - 1]])
        .on('zoom', () => {
            const e = d3.event.transform;
            if (scale !== e.k) {
                //new scale
                scale = e.k;
                if (scale < zoom[lod]) {
                    lod--;
                    console.log(`scale: ${scale}\nlevel of detail: ${lod}`);
                } else if (scale >= zoom[lod + 1] && lod < zoom.length - 2) {
                    lod++;
                    console.log(`scale: ${scale}\nlevel of detail: ${lod}`);
                }
                // this.draw(lod);
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
