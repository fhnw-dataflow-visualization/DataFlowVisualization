/**
 * @author Claudio Seitz
 * @version 1.0
 *
 * @param conf graph configuration
 * @param data graph data {nodes, edges}
 * @constructor
 */
function ViewGraph(conf, data, viewport, tooltip) {
    //darge graph used for frontend graph
    const dg = new dagre.graphlib.Graph({compound: true});
    dg.setGraph({});
    dg.setDefaultEdgeLabel(() => {
        return {}
    });

    /**
     * Recursive function to add grouped graph to dagre
     * @param node current js node
     * @param parent parent js node
     */
    let addNode = (node, parent) => {
        if (node['children']){
            //group node
            dg.setNode(node.id, node);
            node.children.forEach((child) => {
                addNode(child, node);
            });
        } else {
            //normal node
            node['width'] = conf.node.width;
            node['height'] = conf.node.height;
            dg.setNode(node.id, node);
            if (parent !== null) {
                dg.setParent(node.id, parent.id);
            }
        }
    };

    data.nodes.forEach((n) => {
        addNode(n, null);
    });
    data.edges.forEach((e) => {
        dg.setEdge(e.from, e.to, e);
    });

    this.layout = () => dagre.layout(dg);



}
