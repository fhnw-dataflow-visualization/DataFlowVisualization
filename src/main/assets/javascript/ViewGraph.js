/**
 * @author Claudio Seitz
 * @version 1.0
 *
 * @param conf graph configuration
 * @param data graph data {nodes, edges}
 * @constructor
 */
function ViewGraph(conf, data) {
    let dg;
    let idEdges;
    this.mod = {};
    this.mdata = {nodes: [], edges: []};

    this.create = () => {
        idEdges = {};
        this.mdata.nodes = [];
        this.mdata.edges = [];
        dg = new dagre.graphlib.Graph({compound: true});
        dg.setGraph({});
        dg.setDefaultEdgeLabel(() => {
            return {}
        });

        data.nodes.forEach((n) => {
            addNode(n, null);
        });
        data.edges.forEach((e) => {
            addEdge(e);
        });
        dagre.layout(dg);
    };

    /**
     * Recursive function to add grouped graph to dagre
     * @param node current js node
     * @param parent parent js node
     */
    let addNode = (node, parent, rootid) => {
        //check node id
        if (dg.hasNode(`${node.id}`)) {
            throw new Error(`Id of node: ${toString(node)} is already in use from node: ${toString(dg.node(node.id))}`);
        }

        if (rootid !== undefined) {
            //replacement for edges to children
            this.mod[`${node.id}`] = rootid;
            if (node['children']) {
                node.children.forEach((child) => {
                    addNode(child, node, rootid);
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
                } else if (node['view'] !== 'expanded' && node['view'] !== 'collapsed') {
                    throw new Error(`node attribute \'view\' is not \'expanded\' or \'collapsed\' at node: ${toString(node)}`);
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

    let addEdge = (e) => {
        if (idEdges[`${e.id}`]) {
            throw new Error(`Id of edge: ${edgeToString(e)} is already in use from edge: ${idEdges[`${e.id}`]}.`);
        }
        const from = dg.hasNode(e.from) ? e.from : this.mod[`${e.from}`];
        const to = dg.hasNode(e.to) ? e.to : this.mod[`${e.to}`];
        if (from !== to && !dg.hasEdge(from, to)) {
            idEdges[`${e.id}`] = edgeToString(e);
            dg.setEdge(from, to, e);
            this.mdata.edges.push(e);
        }
    };

    this.create();
}
