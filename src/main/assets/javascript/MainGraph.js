/**
 * @author Claudio Seitz
 * @version 1.0
 *
 * @param conf graph configuration
 * @param data graph data {nodes, edges}
 * @constructor
 */
function Graph(conf, data) {
    this.conf = conf;

    const width = conf.width;
    const height = conf.height;
    const zoom = conf.zoom;

    let scale = 1;
    let lod = 2;
    // let lod = 1;

    const svg = d3.select("svg")
        .attr("width", width)
        .attr("height", height);
    const tooltip = d3.select(".tooltip");
    const viewGraph = new ViewGraph(conf, data);
    const mdata = viewGraph.render(lod);
    const viewport = svg.append('g');
    const view0 = viewport.append('g')
        .attr('id', 'view0');
    const view1 = viewport.append('g')
        .attr('id', 'view1');
    const view2 = viewport.append('g')
        .attr('id', 'view2');
    const renderer = new Renderer(this, tooltip);
    // renderer.renderDetailed(viewGraph.mdata, view0, view1);
    renderer.renderDetailed(mdata.data, view0, view1, view2);
    svg.call(d3.zoom()
        .scaleExtent([zoom[0], zoom[zoom.length - 1]])
        .on('zoom', () => {
            const e = d3.event.transform;
            viewport.attr('transform', e);
            if (scale !== e.k) {  //new scale
                scale = e.k;
                if (scale < zoom[lod]) {
                    lod--;
                    console.log(`Changed level of detail to: ${lod}\nscale: ${scale}`);
                    this.updateLod(lod);
                } else if (scale >= zoom[lod + 1] && lod < zoom.length - 2) {
                    lod++;
                    console.log(`Changed level of detail to: ${lod}\nscale: ${scale}`);
                    this.updateLod(lod);
                }
            }
        }));

    this.updateLod = (lod) => {
        view1.style('display', lod === 2 ? 'none' : 'block');
        view2.style('display', lod === 2 ? 'block' : 'none');
    };

    /**
     * Update the group in the graph
     * @param group group node
     */
    this.updateGroup = (group) => {
        console.log(`${group.view === 'expanded' ? 'Expanded' : 'Reduced'} group ${toString(group)}`);
        viewport.selectAll('*').remove();
        viewGraph.render(lod);
        renderer.renderDetailed(viewGraph.mdata, view0, view1);
    };

    this.updateLod(lod);
}
