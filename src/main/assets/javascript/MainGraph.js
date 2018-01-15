/**
 * @author Claudio Seitz
 * @version 1.1
 *
 * Main graph, stores all graph data
 * User interacts with this class
 *
 * @param conf graph configuration
 * @param data graph data
 * @constructor
 */
function Graph(conf, data) {
    // --- basic graph methods ---
    let nodeCount = 0;
    let groupCount = 0;
    const nodeSet = {};
    let edgeCount = 0;
    const edgeSet = {};
    let depth = 0;
    let structure = data.compound;

    let portGraph = conf.hasOwnProperty('port');
    let compound = data.hasOwnProperty('compound');
    let minimap = conf.hasOwnProperty('map');

    /**
     * Returns the stored node (group)
     * @param id node id
     * @return {node}
     */
    this.getNode = (id) => nodeSet[id];

    /**
     * Returns if the graph contains a node
     * @param id node id
     * @return {boolean}
     */
    this.hasNode = (id) => nodeSet.hasOwnProperty(id);

    /**
     * Returns true, if the node is a group
     * @param id node id
     * @return {boolean}
     */
    this.isGroup = (id) => this.getNode(id).hasOwnProperty('view');

    /**
     * Returns the number of nodes (and groups)
     * @return {number}
     */
    this.countNodes = () => nodeCount;

    /**
     * Returns the number of groups
     * @return {number}
     */
    this.groupCount = () => groupCount;

    /**
     * Returns the stored edge
     * @param id edge id
     * @return {edge}
     */
    this.getEdge = (id) => edgeSet[id];

    /**
     * Returns if the graph contains an edge
     * @param id edge id
     */
    this.hasEdge = (id) => edgeSet.hasOwnProperty(id);

    /**
     * Returns the number of edges
     * @return {number}
     */
    this.countEdges = () => edgeCount;

    /**
     * Returns true if some nodes of the graph contains ports
     * @return {boolean}
     */
    this.isPortGraph = () => portGraph;

    /**
     * Returns true if the graph is a compound graph
     * @return {boolean}
     */
    this.isCompound = () => compound;

    /**
     * Returns the compound max depth
     * @return {number}
     */
    this.getDepth = () => depth;

    /**
     * Returns true if the graph has a minimap
     * @return {boolean}
     */
    this.hasMinimap = () => minimap;

    //--- input validation ---
    console.time('validation');
    if (conf.hasOwnProperty('node')) {
        const node = conf.node;
        if (!node.hasOwnProperty('width')){
            throw new Error('Width in conf.node is missing');
        }
        if (!node.hasOwnProperty('height')){
            throw new Error('Height in conf.node is missing');
        }
    } else {
        conf.node = {
            width: 125,
            height: 40,
        }
    }
    if (portGraph) {
        const port = conf.port;
        if (!port.hasOwnProperty('width')){
            throw new Error('Width in conf.port is missing');
        }
        if (!port.hasOwnProperty('height')){
            throw new Error('Height in conf.port is missing');
        }
    }
    if (minimap) {
        const map = conf.map;
        if (!map.hasOwnProperty('width')){
            throw new Error('Width in conf.map is missing');
        }
        if (!map.hasOwnProperty('height')){
            throw new Error('Height in conf.map is missing');
        }
    }
    let validateNode = (node) => {
        if (!node.hasOwnProperty('id')) {
            throw new Error(`id of node is missing`);
        }
        if (!node.hasOwnProperty('name')) {
            throw new Error(`name of node (${node.id}) is missing`);
        }
    };
    //todo clarify parallelism
    data.nodes.forEach((node) => {
        validateNode(node);
        if (this.hasNode(node.id)) {
            throw new Error(`Id of node: ${toString(node)} is already in use
            from node: ${toString(this.getNode(node.id))}.`);
        }
        nodeSet[node.id] = node;
        nodeCount++;
    });
    let validateEdge = (edge) => {
        if (!edge.hasOwnProperty('id')) {
            throw new Error(`id of edge is missing`);
        }
        if (!edge.hasOwnProperty('from')) {
            throw new Error(`from of edge (${edge.id}) is missing`);
        }
        if (!edge.hasOwnProperty('to')) {
            throw new Error(`to of edge (${edge.id}) is missing`);
        }
    };
    //todo clarify parallelism
    data.edges.forEach((edge) => {
        validateEdge(edge);
        if (this.hasEdge(edge.id)) {
            throw new Error(`Id of edge: ${edgeToString(edge)} is already in use
            from edge: ${edgeToString(this.getEdge(edge.id))}.`);
        }
        edgeSet[edge.id] = edge;
        edgeCount++;
    });
    let checkCompound = (c, level) => {
        if (level > depth) {
            depth = level;
        }
        if (c['children']) {
            c.children.forEach((child) => {
                if (!child.hasOwnProperty('group') && !child.hasOwnProperty('nodes')) {
                    throw new Error(`Invalid node in compound structure`);
                }
                const group = nodeSet[child.group];
                groupCount++;
                if (!group.hasOwnProperty('view')) {
                    group['view'] = 'expanded';
                } else if (group.view !== 'expanded' && group.view !== 'reduced') {
                    throw new Error(`Group attribute \'view\' is not \'expanded\' or \'reduced\' at ${toString(group)}`);
                }
                checkCompound(child, level + 1);
            });
        }
    };
    if (compound) {
        checkCompound(structure, 0);
    }
    console.timeEnd('validation');
    let e = null;                                               //current user transformation of graph
    // --- DOM elements ---
    const svg = d3.select("svg");
    const svgWidth = svg.attr('width');
    const svgHeight = svg.attr('height');
    const tooltip = d3.select(".tooltip");
    const viewport = svg.append('g');                           //viewport, transformed by user input
    const view0 = viewport.append('g').attr('id', 'view0');     //permanent visible view
    const view1 = viewport.append('g').attr('id', 'view1');     //visible if lod < 2
    const view2 = viewport.append('g').attr('id', 'view2');     //visible if lod = 2

    // --- layout graph ---
    const viewGraph = new ViewGraph(conf, nodeSet, edgeSet, structure); //layout class
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
        viewGraph.setMode(portGraph, structure);
        console.time('layout');
        layoutData = viewGraph.layout();
        console.timeEnd('layout');
    };
    this.layout();

    let mapSvg;
    let userView;
    let map;
    // append  minimap dom
    if (minimap) {
        map = conf.map;
        const mapArea = svg.append('g').attr('transform', `translate(${svgWidth - map.width},${svgHeight - map.height})`);
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
        console.log(this.printSettings());
    };
    const renderer = new Renderer(conf, changeGroupView, nodeSet, edgeSet, tooltip); //drawer
    //set custom drawing
    if (conf.hasOwnProperty('drawing')) {
        const d = conf.drawing;
        if (d.hasOwnProperty('drawNode')) {
            renderer.drawNode = d.drawNode;
        }
        if (d.hasOwnProperty('drawGroup')) {
            renderer.drawGroup = d.drawGroup;
        }
        if (d.hasOwnProperty('drawPorts')) {
            renderer.drawPorts = d.drawPorts;
        }
        if (d.hasOwnProperty('drawNodeEdge')) {
            renderer.drawNodeEdge = d.drawNodeEdge;
        }
        if (d.hasOwnProperty('drawPortEdge')) {
            renderer.drawPortEdge = d.drawPortEdge;
        }
        if (d.hasOwnProperty('drawMinimap')) {
            renderer.drawMimimap = d.drawMimimap;
        }
    }

    /**
     * Draws the graph onto the svg element
     */
    this.render = () => {
        console.time('render');
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
            userView = renderer.drawMimimap(layoutData.vis, mapSvg, x, y, s);
            userView.attr('class', 'userView');
            if (e !== null) {
                const dk = 1 / e.k;
                userView
                    .attr('x', -e.x * dk)
                    .attr('y', -e.y * dk)
                    .attr('width', svgWidth * dk)
                    .attr('height', svgHeight * dk);
            } else {
                userView
                    .attr('width', svgWidth)
                    .attr('height', svgHeight);
            }
        }
        console.timeEnd('render');
    };
    this.render();

    // -- modification graph methods ---
    /**
     * Changed the lod view
     * @param lod level of detail, 0: rough view, 1: detailed view
     */
    this.updateLod = (lod) => {
        view1.style('display', lod === 1 ? 'none' : 'block');
        view2.style('display', lod === 1 ? 'block' : 'none');
    };

    //handle user transformation
    let lod = conf.hasOwnProperty('lod') ? conf.lod : 1;        //start lod
    if (conf.hasOwnProperty('zoom')) {
        const zoom = conf.zoom;
        //validate zoom
        if (!Array.isArray(zoom) || zoom.length < 2 || zoom.length > 3){
            throw new Error(`Invalid zoom`);
        }
        let z = zoom[0];
        for (let i = 1; i < zoom.length; i++) {
            if (zoom[i] <= z) throw new Error(`Invalid zoom. Zoom at ${i} must be greater than previous`);
            z = zoom[i];
        }
        svg.call(d3.zoom()
            .scaleExtent([zoom[0], zoom[zoom.length - 1]])
            .on('zoom', () => {
                e = d3.event.transform;
                viewport.attr('transform', e);
                if (minimap) {
                    const dk = 1 / e.k;
                    userView.attr('class', 'userView')
                        .attr('x', -e.x * dk)
                        .attr('y', -e.y * dk)
                        .attr('width', svgWidth * dk)
                        .attr('height', svgHeight * dk);
                }
                if (portGraph && zoom.length === 3) {
                    if (lod === 1 && e.k < zoom[1]) {
                        lod = 0;
                        console.log(`Changed level of detail to ${lod}`);
                        this.updateLod(lod);
                    } else if (lod === 0 && e.k >= zoom[1]) {
                        lod = 1;
                        console.log(`Changed level of detail to ${lod}`);
                        this.updateLod(lod);
                    }
                }
            }));
    }

    /**
     * Modifies current graph
     * modify existing nodes, add new nodes
     * modify existing edges, add new edges
     * sets new compound structure
     * sets new portGraph flag
     * @param mod modification {nodes: [], edges: [], compound, portGraph}
     */
    this.modify = (mod) => {
        if (mod.hasOwnProperty('nodes')) {
            //todo clarify parallelism
            mod.nodes.forEach((node) => {
                //modify existing nodes, add new nodes
                validateNode(node);
                nodeSet[node.id] = node;
            });
        }
        //override portGraph by mod
        if (mod.hasOwnProperty('portGraph')) {
            portGraph = mod.portGraph;
        }
        if (mod.hasOwnProperty('edges')) {
            //todo clarify parallelism
            mod.edges.forEach((edge) => {
                //modify existing edges, add new edges
                validateEdge(edge);
                edgeSet[edge.id] = edge;
            });
        }
        if (mod.hasOwnProperty('compound')) {
            //new compound structure
            structure = mod.compound;
            checkCompound(structure)
        }
        this.layout();
        this.render();
    };

    /**
     * Returns the stored configuration
     * @return {string}
     */
    this.printSettings = () => `number of nodes ${nodeCount}\n`+
        `number of edges: ${edgeCount}\n`+
        `number of rendered nodes ${layoutData.vis.nodes.length}\n`+
        `number of rendered edges ${layoutData.vis.edges.length}\n`+
        `portGraph: ${portGraph}\n`+
        `compound: ${compound}\n`+
        `number of groups ${groupCount}\n`+
        `max depth level ${depth}\n`+
        `minimap: ${minimap}`;

    this.updateLod(lod);
}
