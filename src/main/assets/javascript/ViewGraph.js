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

    let mod = {};
    let nodes = [];
    let edges = [];

    /**
     * Creates a graph in dagre, depended if groups are expanded or reduced
     * Layouts this created graph
     * Hidden node ids are stored in {@link mod}
     * Modified graph elements are stored in {@link mdata}
     */
    this.render = (lod) => {
        idEdges = {};
        mod ={};
        nodes = [];
        edges = [];
        dg = initDagre();

        // select elements from main graph to show
        data.nodes.forEach((node) => {
            addNode(node, null);
        });
        data.edges.forEach((edge) => {
            addEdge(edge, lod);
        });
        //layout graph
        dagre.layout(dg);

        //layout ports
        if (lod === 2) {
            data.edges.forEach((edge) => {
                if (edge['ports']) {
                    const nPorts = edge.ports.length;
                    edge['points'] = [];
                    if (nPorts & 1) {
                        const pPoints = edge.ports[(nPorts - 1) * 0.5].points;
                        for (let i = 0; i < pPoints.length; i++) {
                            const point = pPoints[i];
                            edge['points'].push({x: point.x, y: point.y});
                        }
                    } else {
                        const pPoints1 = edge.ports[nPorts * 0.5 - 1].points;
                        const pPoints2 = edge.ports[nPorts * 0.5].points;
                        for (let i = 0; i < Math.min(pPoints1.length, pPoints2.length); i++) {
                            const point1 = pPoints1[i];
                            const point2 = pPoints2[i];
                            edge['points'].push({x: (point1.x + point2.x) * 0.5, y: (point1.y + point2.y) * 0.5});
                        }
                    }

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
        return {"mod": mod, data: {"nodes": nodes, "edges": edges}, "graph": {"width": dg.width, "heigth": dg.height}};
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
            mod[`${node.id}`] = rootId;
            if (node['children']) {
                node.children.forEach((child) => {
                    addNode(child, node, rootId);
                });
            }
        } else {
            //set node
            dg.setNode(node.id, node);
            nodes.push(node);

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
    let addEdge = (e, lod) => {
        if (idEdges[`${e.id}`]) {
            throw new Error(`Id of edge: ${edgeToString(e)} is already in use from edge: ${idEdges[`${e.id}`]}.`);
        }
        const from = dg.hasNode(e.from) ? e.from : mod[`${e.from}`];
        const to = dg.hasNode(e.to) ? e.to : mod[`${e.to}`];
        if (from !== to && !dg.hasEdge(from, to)) {
            idEdges[`${e.id}`] = edgeToString(e);
            if (lod === 2 && e['ports']){
                e.ports.forEach((port) => {
                    dg.setEdge(from, to, port, `${e.id}.${port.out}.${port.in}`);
                });
            } else {
                dg.setEdge(from, to, e);
            }
            edges.push(e);
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
