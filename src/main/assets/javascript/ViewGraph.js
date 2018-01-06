/**
 * @author Claudio Seitz
 * @version 1.0
 *
 * Layouts the graph and stores the modification on this graph
 *
 * @param conf graph configuration
 * @param data main graph data {nodes, edges}
 * @constructor
 */
function ViewGraph(conf, data) {
    let dg; //internal dagre graph used to layout the graph
    let idEdges;
    /**
     * Stores hidden node ids
     * Each node id refers to its root node id
     * @type {{}}
     */
    this.mod = {};
    /**
     * Stores the selected (modified) graph, used for further rendering
     * @type {{nodes: Array, edges: Array}}
     */
    this.mdata = {nodes: [], edges: []};

    this.lod = undefined;

    /**
     * Creates a graph in dagre, depended if groups are expanded or reduced
     * Layouts this created graph
     * Hidden node ids are stored in {@link mod}
     * Modified graph elements are stored in {@link mdata}
     */
    this.render = (lod) => {
        idEdges = {};
        this.mdata.nodes = [];
        this.mdata.edges = [];
        dg = initDagre();
        this.lod = lod;

        // select elements from main graph to show
        data.nodes.forEach((node) => {
            addNode(node, null);
        });
        data.edges.forEach((edge) => {
            addEdge(edge);
        });
        //layout graph
        dagre.layout(dg);

        //layout ports
        if (lod === 2) {
            data.edges.forEach((edge) => {
                if (edge['ports']) {
                    const fromId = edge.from;
                    const toId = edge.to;
                    edge.ports.forEach((port) => {
                        const from = dg.node(fromId);
                        const outPort = from.out[port.out];
                        outPort['anchor'] = port.points[0];
                        const to = dg.node(toId);
                        const inPort = to.in[port.in];
                        inPort['anchor'] = port.points[port.points.length - 1];
                    });
                }
            });
        }
    };

    let initDagre = () => {
        dg = new dagre.graphlib.Graph({
            directed: true,
            compound: true,
            multigraph: true
        });
        //todo calculate exact value
        dg.setGraph({
            edgesep: conf.port.width * 5
        });
        dg.setDefaultEdgeLabel(() => {
            return {}
        });
        return dg;
    };

    /**
     * Recursive function to add grouped graph to dagre
     * @param rootId id of the root node of a collapse, only used for hidden children
     * @param node current js node
     * @param parent parent js node
     */
    let addNode = (node, parent, rootId) => {
        //check node id
        if (dg.hasNode(`${node.id}`)) {
            throw new Error(`Id of node: ${toString(node)} is already in use from node: ${toString(dg.node(node.id))}`);
        }

        if (rootId !== undefined) {
            //replacement for edges to children
            this.mod[`${node.id}`] = rootId;
            if (node['children']) {
                node.children.forEach((child) => {
                    addNode(child, node, rootId);
                });
            }
        } else {
            //set node
            dg.setNode(node.id, node);
            this.mdata.nodes.push(node);

            if (parent !== null) {
                dg.setParent(node.id, parent.id);
            }
            if (node['children']) {
                //group node
                if (!node['view']) {
                    node['view'] = 'expanded';
                } else if (node['view'] !== 'expanded' && node['view'] !== 'reduced') {
                    throw new Error(`node attribute \'view\' is not \'expanded\' or \'reduced\' at node: ${toString(node)}`);
                }

                if (node['view'] === 'expanded') {
                    node.children.forEach((child) => {
                        addNode(child, node);
                    });
                } else {
                    node['width'] = conf.node.width;
                    node['height'] = conf.node.height;
                    node.children.forEach((child) => {
                        addNode(child, node, node.id);
                    });
                }
            } else {
                //normal node
                node['width'] = conf.node.width;
                node['height'] = conf.node.height;
            }
        }
    };

    /**
     * Adds an edge to the dagre graph
     * @param e current js edge
     */
    let addEdge = (e) => {
        if (idEdges[`${e.id}`]) {
            throw new Error(`Id of edge: ${edgeToString(e)} is already in use from edge: ${idEdges[`${e.id}`]}.`);
        }
        const from = dg.hasNode(e.from) ? e.from : this.mod[`${e.from}`];
        const to = dg.hasNode(e.to) ? e.to : this.mod[`${e.to}`];
        if (from !== to && !dg.hasEdge(from, to)) {
            idEdges[`${e.id}`] = edgeToString(e);
            if (this.lod === 2 && e['ports']){
                e.ports.forEach((port) => {
                    dg.setEdge(from, to, port, `${e.id}.${port.out}.${port.in}`);
                });
            } else {
                dg.setEdge(from, to, e);
            }
            this.mdata.edges.push(e);
        }
    };

    // this.updateGroup = (group) => {
    //     if (group['view'] === 'expanded') {
    //         // expandGroup(child, group.id);
    //     } else {
    //         group.children.forEach((child) => {
    //             reduceGroup(group, group.id)
    //         });
    //     }
    //     dagre.layout(dg);
    // };
    //
    // let reduceGroup = (node, rootId) => {
    //     this.mod[`${node.id}`] = rootId;
    //     dg.
    //     dg.removeNode(node.id);
    //     if (node['children']) {
    //         node.children.forEach((child) => {
    //             reduceGroup(child, rootId);
    //         });
    //     }
    // };
    //
    // let expandGroup = (group) => {
    //     // group.children.forEach((child) => {
    //     //
    //     // });
    // };
}
