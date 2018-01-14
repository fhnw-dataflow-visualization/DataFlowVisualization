/**
 * @author Claudio Seitz
 * @version 1.0
 *
 * @param conf graph configuration
 * @param data graph data {nodes, edges}
 * @constructor
 */
function Graph(conf, data) {
    // --- basic graph methods ---
    const nodeSet = {};
    const edgeSet = {};
    const stucture = data.compound;

    //todo adjust lod
    //todo implement minimap
    //todo implement modify compound

    let portGraph = false;
    let compound = data.hasOwnProperty('compound');
    let minimap = conf.hasOwnProperty('map');

    /**
     * Returns the stored node
     * @param id node id
     */
    this.getNode = (id) => nodeSet[id];

    /**
     * Returns if the graph contains a node
     * @param id node id
     */
    this.hasNode = (id) => nodeSet.hasOwnProperty(id);

    /**
     * Returns the stored edge
     * @param id edge id
     */
    this.getEdge = (id) => edgeSet[id];

    /**
     * Returns if the graph contains an edge
     * @param id edge id
     */
    this.hasEdge = (id) => edgeSet.hasOwnProperty(id);

    /**
     * Returns true if some nodes of the graph contains ports
     */
    this.isPortGraph = () => portGraph;

    /**
     * Returns true if the graph is a compound graph
     */
    this.isCompound = () => compound;

    /**
     * Returns true if the graph has a minimap
     */
    this.hasMinimap = () => minimap;

    //--- input validation ---
    data.nodes.forEach((node) => {
        if (this.hasNode(node.id)) {
            throw new Error(`Id of node: ${toString(node)} is already in use
            from node: ${toString(this.getNode(node.id))}.`);
        }
        if (!portGraph && (node['in'] || node['out']))
            portGraph = true;
        nodeSet[node.id] = node;
    });
    data.edges.forEach((edge) => {
        if (this.hasEdge(edge.id)) {
            throw new Error(`Id of edge: ${edgeToString(edge)} is already in use
            from edge: ${edgeToString(this.getEdge(edge.id))}.`);
        }
        edgeSet[edge.id] = edge;
    });
    //override portGraph by conf
    if (conf.hasOwnProperty('portGraph')) {
        portGraph = conf.portGraph;
    }

    let checkCompound = (c) => {
        if (c['children']) {
            c.children.forEach((child) => {
                if (!child.hasOwnProperty('group') && !child.hasOwnProperty('nodes')) {
                    throw new Error(`Invalid node in compound structure`);
                }
                const group = nodeSet[child.group];
                if (!group.hasOwnProperty('view')) {
                    group['view'] = 'expanded';
                } else if (group.view !== 'expanded' && group.view !== 'reduced') {
                    throw new Error(`Group attribute \'view\' is not \'expanded\' or \'reduced\' at ${toString(group)}`);
                }
                checkCompound(child);
            });
        }
    };
    if (compound) {
        checkCompound(stucture);
    }

    let scale = conf.hasOwnProperty('scale') ? conf.scale : 1; //start scale
    let lod = conf.hasOwnProperty('lod') ? conf.lod : 2;   //start lod
    // --- DOM elements ---
    const svg = d3.select("svg");
    const tooltip = d3.select(".tooltip");
    const viewport = svg.append('g');                           //viewport, transformed by user input
    const view0 = viewport.append('g').attr('id', 'view0');     //permanent visible view
    const view1 = viewport.append('g').attr('id', 'view1');     //visible if lod < 2
    const view2 = viewport.append('g').attr('id', 'view2');     //visible if lod = 2

    // --- layout graph ---
    const viewGraph = new ViewGraph(conf, nodeSet, edgeSet, stucture); //layout class
    /**
     * Layout meta info data object
     * vis: currently visible nodes and edges
     * meta: meta information about the graph
     * @type {{vis, meta}}
     */
    let layoutData;
    /**
     * Layouts the graph using dagre
     */
    this.layout = () => {
        viewGraph.setMode(portGraph, compound);
        layoutData = viewGraph.layout();
    };
    this.layout();

    let mapSvg;
    let map;
    // append  minimap dom
    if (minimap) {
        map = conf.map;
        const mapArea = svg.append('g').attr('transform', `translate(${svg.attr('width') - map.width},${svg.attr('height') - map.height})`);
        mapSvg = mapArea.append('svg')
            .attr('width', map.width)
            .attr('height', map.height);
    }

    // --- rendering graph ---
    /**
     * Update the group in the graph
     * @param group group node
     */
    let changeGroupView = (group) => {
        console.log(`${group.view === 'expanded' ? 'Expanded' : 'Reduced'} group ${toString(group)}`);
        this.layout();
        this.render();
    };
    const renderer = new Renderer(conf, changeGroupView, nodeSet, edgeSet, tooltip); //drawer
    //set custom drawing
    if (conf['drawing']) {
        const d = conf.drawing;
        if (d['drawNode']) {
            renderer.drawNode = d.drawNode;
        }
        if (d['drawGroup']) {
            renderer.drawGroup = d.drawGroup;
        }
        if (d['drawPorts']) {
            renderer.drawPorts = d.drawPorts;
        }
        if (d['drawNodeEdge']) {
            renderer.drawNodeEdge = d.drawNodeEdge;
        }
        if (d['drawPortEdge']) {
            renderer.drawPortEdge = d.drawPortEdge
        }
    }

    /**
     * Draws the graph onto the svg element
     */
    this.render = () => {
        view0.selectAll('*').remove();
        view1.selectAll('*').remove();
        view2.selectAll('*').remove();
        if (portGraph) {
            renderer.renderDetailed(layoutData.vis, view0, view1, view2);
        } else {
            renderer.render(layoutData.vis, view0);
        }
        if (minimap) {
            mapSvg.selectAll('*').remove();
            mapSvg.append('rect')
                .attr('class', 'map')
                .attr('width', map.width)
                .attr('height', map.height);
            const graphWidth = layoutData.meta.width;
            const graphHeight = layoutData.meta.height;
            const s = Math.min(map.width / graphWidth, map.height / graphHeight);
            // const s = 0.2;
            const x = (map.width - graphWidth * s) * 0.5;
            const y = (map.height - graphHeight * s) * 0.5;
            renderer.drawMimimap(layoutData.vis, mapSvg, x, y, s);
        }
    };
    this.render();



    // -- modification graph methods ---

    /**
     * Changed the lod view
     * @param lod level of detail
     */
    this.updateLod = (lod) => {
        view1.style('display', lod === 2 ? 'none' : 'block');
        view2.style('display', lod === 2 ? 'block' : 'none');
    };


    const zoom = conf.zoom;
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

    /**
     * Modifies current graph
     * @param mod modification {nodes: [], edges: [], compound, portGraph}
     */
    this.modify = (mod) => {
        if (mod.hasOwnProperty('nodes')) {
            mod.nodes.forEach((node) => {
                //modify existing edges, add new edges
                if (!portGraph && (node['in'] || node['out']))
                    portGraph = true;
                nodeSet[node.id] = node;
            });
        }
        //override portGraph by mod
        if (mod.hasOwnProperty('portGraph')) {
            portGraph = mod.portGraph;
        }
        if (mod.hasOwnProperty('edges')) {
            mod.edges.forEach((edge) => {
                //modify existing edges, add new edges
                edgeSet[edge.id] = edge;
            });
        }
        if (mod.hasOwnProperty('compound')) {
            //todo handle
        }
        this.layout();
        this.render();
    };

    this.updateLod(lod);
}
