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
            viewport.attr('transform', e);
            if (scale !== e.k) {  //new scale
                scale = e.k;
                if (scale < zoom[lod]) {
                    lod--;
                    console.log(`scale: ${scale}\nlevel of detail: ${lod}`);
                    update(lod);
                } else if (scale >= zoom[lod + 1] && lod < zoom.length - 2) {
                    lod++;
                    console.log(`scale: ${scale}\nlevel of detail: ${lod}`);
                    update(lod);
                }
            }
        }));
    const tooltip = d3.select(".tooltip");

    //layout
    const dg = new dagre.graphlib.Graph({compound: true});
    dg.setGraph({});
    dg.setDefaultEdgeLabel(() => {
        return {}
    });

    data.nodes.forEach((n) => {
        n['width'] = conf.node.width;
        n['height'] = conf.node.height;
        dg.setNode(n.id, n);
    });
    data.edges.forEach((e) => {
        dg.setEdge(e.from, e.to, e);
    });
    // data.groups.forEach((g) => {
    //     dg.setNode(g.id, g);
    //     g.children.forEach((child) => {
    //         dg.setParent(child, g.id);
    //     });
    // });
    dagre.layout(dg);

    const renderer = new Renderer(viewport, tooltip, conf, data);

    /*
     * Initializes the graph
     */
    renderer.initNodes(lod);
    renderer.initEdges(lod);

    /**
     * Updates the graph
     * Actually used for changed lod
     * @param lod level of detail
     */
    let update = (lod) => {
        renderer.updateNode(lod);
        renderer.updateEdges(lod);
    };

}
