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
    let renderlevel = 2;
    // let lod = 1;

    const svg = d3.select("svg")
        .attr("width", width)
        .attr("height", height);
    const tooltip = d3.select(".tooltip");
    const viewGraph = new ViewGraph(conf, data);
    const mdata = viewGraph.render(renderlevel);
    const viewport = svg.append('g');
    const view0 = viewport.append('g')
        .attr('id', 'view0');
    const view1 = viewport.append('g')
        .attr('id', 'view1');
    const view2 = viewport.append('g')
        .attr('id', 'view2');
    const renderer = new Renderer(this, tooltip);
    if (renderlevel === 2) {
        renderer.renderDetailed(mdata.data, view0, view1, view2);
    } else {
        renderer.render(mdata.data, view0);
    }

    // const map = svg.append('g')
    //     .attr('transform', `translate(${width-conf.map.width},0)`);
    // const minimap = map.append('g')
    //     .attr('transform', `scale(${Math.max(conf.map.width/mdata.graph.width,conf.map.height/mdata.graph.heigth) })`);
    // renderer.render(mdata.data,minimap);

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
        view0.selectAll('*').remove();
        view1.selectAll('*').remove();
        view2.selectAll('*').remove();
        const mdata = viewGraph.render(renderlevel);
        if (renderlevel === 2) {
            renderer.renderDetailed(mdata.data, view0, view1, view2);
        } else {
            renderer.render(mdata.data, view0);
        }
    };

    this.updateLod(lod);
}
