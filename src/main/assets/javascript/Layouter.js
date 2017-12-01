function Layouter(data, width, height) {
    const dg = new dagre.graphlib.Graph();
    dg.setGraph({});
    dg.setDefaultEdgeLabel(() => {
        return {}
    });

    data.nodes.forEach((n) => {
        n['width'] = width;
        n['height'] = height;
        dg.setNode(n.id, n);
    });
    data.edges.forEach((e) => {
        dg.setEdge(e.from, e.to);
    });

    this.layout = () => {
        dagre.layout(dg);
    }
}
