/**
 * @author Claudio Seitz
 * @version 1.1
 *
 * Main graph, stores all graph data
 * User interacts with this class
 *
 * @param data graph data
 * @param conf graph configuration
 * @constructor
 */
function Graph(data, conf) {
    // --- basic graph methods ---
    const nodeSet = {};
    const edgeSet = {};
    let nodeCount = 0;
    let edgeCount = 0;
    let structure = data.compound;

    if (conf === undefined) {
        //default config
        conf = {
            zoom: [0.1, 2],
            node: {
                width: 125,
                height: 40
            }
        }
    }

    let log = conf.hasOwnProperty('log') ? conf.log : false;
    let portGraph = conf.hasOwnProperty('port');
    let compound = data.hasOwnProperty('compound');
    let groupCount = 0;
    let depth = 0;
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
     * Returns the number of nodes (and groups)
     * @return {number}
     */
    this.countNodes = () => nodeCount;

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
     * Returns the number of groups
     * @return {number}
     */
    this.countGroups = () => groupCount;

    /**
     * Returns true if the graph has a minimap
     * @return {boolean}
     */
    this.hasMinimap = () => minimap;

    this.validateNode = (node) => node.hasOwnProperty('id') && node.hasOwnProperty('name');

    this.validateEdge = (edge) => edge.hasOwnProperty('id') && edge.hasOwnProperty('from') && edge.hasOwnProperty('to');

    //--- input validation ---
    if (log) {
        console.time('validation');
    }
    if (conf.hasOwnProperty('node')) {
        const node = conf.node;
        if (!node.hasOwnProperty('width')) {
            throw new Error('Width in conf.node is missing');
        }
        if (!node.hasOwnProperty('height')) {
            throw new Error('Height in conf.node is missing');
        }
    } else {
        //set default node config
        conf.node = {
            width: 125,
            height: 40,
        }
    }
    if (!conf.hasOwnProperty('zoom')) {
        //set default node config
        conf.zoom = [0.1, 2];
    }
    if (conf.hasOwnProperty('port')) {
        const port = conf.port;
        if (!port.hasOwnProperty('width')) {
            throw new Error('Width in conf.port is missing');
        }
        if (!port.hasOwnProperty('height')) {
            throw new Error('Height in conf.port is missing');
        }
    }
    if (conf.hasOwnProperty('map')) {
        const map = conf.map;
        if (!map.hasOwnProperty('width')) {
            throw new Error('Width in conf.map is missing');
        }
        if (!map.hasOwnProperty('height')) {
            throw new Error('Height in conf.map is missing');
        }
    }
    //todo clarify parallelism
    data.nodes.forEach((node) => {
        if (!this.validateNode(node)) {
            throw new Error(`Invalid node ${toString(node)}`);
        }
        if (this.hasNode(node.id)) {
            throw new Error(`Id of node: ${toString(node)} is already in use
            from node: ${toString(this.getNode(node.id))}.`);
        }
        nodeSet[node.id] = node;
        nodeCount++;
    });
    //todo clarify parallelism
    data.edges.forEach((edge) => {
        if (!this.validateEdge(edge)) {
            throw new Error(`Invalid edge: ${edgeToString(edge)}`);
        }
        if (this.hasEdge(edge.id)) {
            throw new Error(`Id of edge: ${edgeToString(edge)} is already in use
            from edge: ${edgeToString(this.getEdge(edge.id))}.`);
        }
        edgeSet[edge.id] = edge;
        edgeCount++;
    });
    let validateCompound = (c, level) => {
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
                validateCompound(child, level + 1);
            });
        }
    };
    if (compound) {
        validateCompound(structure, 0);
    }
    if (log) {
        console.timeEnd('validation');
    }


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
     * @type {{vis, meta, portEdges}}
     */
    let layoutData;
    /**
     * Layouts the graph using dagre
     */
    this.layout = () => {
        viewGraph.setMode(portGraph, structure);
        if (log) {
            console.time('layout');
        }
        layoutData = viewGraph.layout();
        if (log) {
            console.timeEnd('layout');
            console.log(`Render nodes: ${layoutData.vis.nodes.length}\n` +
                `Render edges: ${portGraph ? layoutData.portEdges : layoutData.vis.edges.length}`);
        }
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
        if (log) {
            console.log(`${group.view === 'expanded' ? 'Expanded' : 'Reduced'} group ${toString(group)}`);
        }
        this.layout();
        this.render();
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
        if (log) {
            console.time('render');
        }
        view0.selectAll('*').remove();
        view1.selectAll('*').remove();
        view2.selectAll('*').remove();
        if (portGraph) {
            renderer.renderDetailed(layoutData.vis, view0, view1, view2);
        } else {
            renderer.render(layoutData.vis, view0);
        }
        if (minimap) {
            //update minimap
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
        if (log) {
            console.timeEnd('render');
        }
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

    const zoom = conf.zoom;
    svg.call(d3.zoom()
        .scaleExtent([zoom[0], zoom[zoom.length - 1]])
        .on('zoom', () => {
            e = d3.event.transform;
            viewport.attr('transform', e);
            //update user view minimap
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
                    if (log) {
                        console.log(`Changed level of detail to ${lod}`);
                    }
                    this.updateLod(lod);
                } else if (lod === 0 && e.k >= zoom[1]) {
                    lod = 1;
                    if (log) {
                        console.log(`Changed level of detail to ${lod}`);
                    }
                    this.updateLod(lod);
                }
            }
        }));

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
                this.validateNode(node);
                if (!this.hasNode(node.id)) {
                    nodeCount++;
                }
                nodeSet[node.id] = node;
            });
        }
        //override portGraph by mod
        if (mod.hasOwnProperty('edges')) {
            //todo clarify parallelism
            mod.edges.forEach((edge) => {
                //modify existing edges, add new edges
                this.validateEdge(edge);
                if (!this.hasEdge(edge.id)) {
                    edgeCount++;
                }
                edgeSet[edge.id] = edge;
            });
        }
        if (mod.hasOwnProperty('compound')) {
            //new compound structure
            structure = mod.compound;
            groupCount = 0;
            depth = 0;
            validateCompound(structure)
        }
        this.layout();
        this.render();
    };

    /**
     * Returns the stored configuration
     * @return {string}
     */
    this.printSettings = () => `number of nodes ${nodeCount}\n` +
        `number of edges: ${edgeCount}\n` +
        `portGraph: ${portGraph}\n` +
        `compound: ${compound}\n` +
        `number of groups ${groupCount}\n` +
        `max depth level ${depth}\n` +
        `minimap: ${minimap}`;

    this.updateLod(lod);
}
