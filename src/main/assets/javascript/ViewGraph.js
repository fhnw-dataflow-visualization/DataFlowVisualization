/**
 * @author Claudio Seitz
 * @version 1.0
 *
 * Layout visible graph elements
 *
 * @param conf graph configuration
 * @param nodeSet set of all nodes
 * @param edgeSet set of all edges
 * @param structure optional compound graph structure
 * @constructor
 */
function ViewGraph(conf, nodeSet, edgeSet, structure) {
    /**
     * internal dagre.js graph used to layout the graph
     */
    let dg;
    let hidden, parents, visNodes, visEdges;
    let dgMultiEdge = true;
    let dgCompound = structure !== undefined;

    let dgConf = {
        directed: true,
        compound: dgCompound,
        multigraph: dgMultiEdge
    };

    /**
     * Sets a new mode for the dagre graph
     * @param multiEdge render multi edges (port-port), use if graph has ports
     * @param structure optional compound graph structure
     */
    this.setMode = (multiEdge, structure) => {
        dgMultiEdge = multiEdge;
        dgCompound = structure !== undefined;
        dgConf = {
            directed: true,
            compound: dgCompound,
            multigraph: multiEdge
        };
    };

    /**
     * Layout the input graph, using dagre
     * Returns graph information
     * vis contains visible nodes and edges
     * meta contains information about the graph itself
     * @returns {{vis: {nodes: Array, edges: Array}, meta: {width, height}}}
     */
    this.layout = () => {
        hidden = {};        // set of hidden child node or group ids, each refers to itself root id
        parents = {};       // set of child node or group ids, each refers to itself parent id
        visNodes = [];      // array of visible nodes
        visEdges = [];      // array of visible edges
        dg = initDagre();

        //build compound structure tree recursively
        if (dgCompound) {
            buildCompound(structure);
        }

        // add nodes from main graph
        //todo clarify parallelism
        for (let id in nodeSet) {
            if (nodeSet.hasOwnProperty(id)) {
                const node = nodeSet[id];
                if (!hidden[node.id]) {
                    dg.setNode(node.id, node);
                    if (!node.hasOwnProperty('view')) {
                        //normal node
                        node['width'] = conf.node.width;
                        node['height'] = conf.node.height;
                    }
                }
            }
        }

        // set Parents from compound structure
        //todo clarify parallelism
        if (dgCompound) {
            for (let id in parents) {
                if (nodeSet.hasOwnProperty(id)) {
                    dg.setParent(id, parents[id]);
                }
            }
        }

        //set edges from main graph
        //todo clarify parallelism
        for (let id in edgeSet) {
            if (edgeSet.hasOwnProperty(id)) {
                const edge = edgeSet[id];
                const from = nodeSet.hasOwnProperty(edge.from) ? edge.from : hidden[edge.from];
                const to = nodeSet.hasOwnProperty(edge.to) ? edge.to : hidden[edge.to];
                if (from !== to && !dg.hasEdge(from, to)) {
                    if (dgMultiEdge && edge.hasOwnProperty('ports')) {
                        edge.ports.forEach((port) => {
                            dg.setEdge(from, to, port, `${edge.id}.${port.out}.${port.in}`);
                        });
                    } else {
                        dg.setEdge(from, to, edge);
                    }
                    visEdges.push(edge.id);
                }
            }
        }

        //render graph
        dagre.layout(dg);

        //render ports
        //todo clarify parallelism
        if (dgMultiEdge) {
            for (let id in edgeSet){
                if (edgeSet.hasOwnProperty(id)) {
                    const edge = edgeSet[id];
                    if (edge.hasOwnProperty('ports')) {
                        //layout node-node edge as middle edge for rough view
                        //todo fix side ports
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

                        //layout ports
                        const fromId = edge.from;
                        const from = nodeSet[!hidden.hasOwnProperty(fromId) ? fromId : hidden[fromId]];
                        const toId = edge.to;
                        const to = nodeSet[!hidden.hasOwnProperty(toId) ? toId : hidden[toId]];
                        edge.ports.forEach((port) => {
                            if (from.hasOwnProperty('out')) {
                                const outPort = from.out[port.out];
                                outPort['anchor'] = port.points[0];
                            }
                            if (to.hasOwnProperty('in')) {
                                const inPort = to.in[port.in];
                                inPort['anchor'] = port.points[port.points.length - 1];
                            }
                        });
                    }
                }
            }
        }
        return {
            "vis": {"nodes": visNodes, "edges": visEdges},
            "meta": {"width": dg.width, "height": dg.height}
        };
    };

    /**
     * Initializes the dagre graph
     * @returns {dagre.graphlib.Graph|*}
     */
    let initDagre = () => {
        dg = new dagre.graphlib.Graph(dgConf);
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
     * Initializes the mod object
     * @param e compound node
     * @param parentId compound parent node id
     * @param rootId compound root node id
     */
    let buildCompound = (e, parentId, rootId) => {
        if (rootId !== undefined) {
            //hidden children
            e.nodes.forEach((id) => {
                hidden[id] = rootId;
            });
            if (e.hasOwnProperty('children')) {
                e.children.forEach((child) => {
                    buildCompound(child, undefined, rootId);
                });
            }
        } else {
            e.nodes.forEach((node) => {
                visNodes.push(node);
            });
            //visible children node
            if (parentId !== undefined) {
                e.nodes.forEach((id) => {
                    parents[id] = parentId;
                });
            }
            if (e.hasOwnProperty('children')) {
                e.children.forEach((child) => {
                    const group = nodeSet[child.group];
                    visNodes.push(group.id);
                    if (group.view === 'expanded') {
                        buildCompound(child, group.id)
                    } else {
                        buildCompound(child, undefined, group.id);
                    }
                });
            }
        }
    };
}
