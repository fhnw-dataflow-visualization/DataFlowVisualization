

function Renderer(conf, changeGroupView, nodeSet, edgeSet, tooltip) {
    const nodeWidth = conf.node.width;
    const nodeWidthHalf = nodeWidth / 2;
    const nodeHeight = conf.node.height;
    const nodeHeightHalf = nodeHeight / 2;
    const portWidth = conf.port.width;
    const portWidthHalf = portWidth / 2;
    const portHeight = conf.port.height;

    this.render = (vis, view0) => {
        //init nodes
        //todo clarify parallelism
        vis.nodes.forEach((id) => {
            initNode(nodeSet[id], view0, null, 1);
        });
        //init edges
        //todo clarify parallelism
        vis.edges.forEach((id) => {
            initEdges(edgeSet[id], view0, null, 1);
        });
    };

    this.renderDetailed = (vis, view0, view1, view2) => {
        //init nodes
        //todo clarify parallelism
        vis.nodes.forEach((id) => {
            initNode(nodeSet[id], view0, view2, 2);
        });
        //init edges
        //todo clarify parallelism
        vis.edges.forEach((id) => {
            initEdges(edgeSet[id], view1, view2, 2);
        });
    };

    this.drawGroup = (root, group) => {
        const n = root.append("g")
            .attr('id', `n${group.id}`)
            .attr("class", "nodes")
            .attr("transform", `translate(${group.x - group.width * 0.5},${group.y - group.height * 0.5})`);
        const r = n.append("rect")
            .attr("width", group.width)
            .attr("height", group.height)
            .style('fill', group['color'] ? `${group.color}` : 'white');
        return n.append("svg:image")
            .attr('xlink:href', group.view==='reduced'
                ? './resources/Collabsout.png'
                : './resources/Collabsin.png')
            .attr("width", 23)
            .attr("height", 23)
            .attr("x", group.width-30)
            .attr("y",5);
    };

    this.drawNode = (root, node) => {
        const n = root.append("g")
            .attr('id', `n${node.id}`)
            .attr("class", "nodes")
            .attr("transform", `translate(${node.x - nodeWidthHalf},${node.y - nodeHeightHalf})`);
        const r = n.append("rect")
            .attr("width", nodeWidth)
            .attr("height", nodeHeight)
            .style('fill', node['color'] ? `${node.color}` : 'white');
        n.append("text")
            .attr('x', portWidthHalf + 5)
            .attr('y', nodeHeightHalf + 5)
            .html(`${node.name} (${node.id})`);
        addHover(r, node, node.x + nodeWidth + 12, node.y - 73);
    };

    this.drawPorts = (root, node) => {
        const n2 = root.append('g');
        let ports = null;
        if (node.hasOwnProperty('in')) {
            ports = n2.append('g')
                .attr('class', 'inPort');
            initInPort(ports, node);
        }
        /* draw out ports */
        if (node.hasOwnProperty('out')) {
            ports = n2.append('g')
                .attr('class', 'outPort');
            initOutPort(ports, node);
        }
    };

    this.drawNodeEdge = (root, edge) => {
        const p = root.append('path')
            .attr('class', 'edge')
            .attr('d', createPath(edge.points))
            .style('marker-end', 'url(#arrow)');
        addHover(p, edge);
    };

    this.drawPortEdge = (root, edge) => {
        const g = root.append('g')
            .attr('id', `e${edge.id}`)
            .attr('class', 'edge');
        edge.ports.forEach((port) => {
            const p = g.append('path')
                .attr('d', createPath(port.points))
                .style('marker-end', 'url(#arrow)');
            addHover(p, port);
        });
    };

    /**
     * Draws all input ports of current node
     * @param g <g> node
     * @param node js node
     */
    let initInPort = (g, node) => {
        for (let key in node.in) {
            if (node.in.hasOwnProperty(key)) {
                const port = node.in[key];
                const x = port.anchor.x;
                const y = port.anchor.y;
                g.append('polygon')
                    .attr('id', `n${node.id}in${port.port}`)
                    .attr('points', calculatePort(x, y, 1));
                addHover(g, port);
            }
        }
    };

    /**
     * Draws all <polygon> output ports of current node
     * @param g <g> node
     * @param node js node
     */
    let initOutPort = (g, node) => {
        for (let key in node.out) {
            if (node.out.hasOwnProperty(key)) {
                const port = node.out[key];
                const x = port.anchor.x;
                const y = port.anchor.y;
                g.append('polygon')
                    .attr('id', `n${node.id}out${port.port}`)
                    .attr('points', calculatePort(x, y, -1));
                addHover(g, port);
            }
        }
    };

    let initNode = (node, parent0, parent1, lod,) => {
        if (node.hasOwnProperty('view')) {
            const changeView = this.drawGroup(parent0, node);
            if (node.view === 'expanded') {
                //expanded group
                changeView.on('click', () => {
                    node.view = 'reduced';
                    changeGroupView(node);
                });
            } else {
                //reduced group
                changeView.on('click', () => {
                    node.view = 'expanded';
                    changeGroupView(node);
                });
            }
        } else {
            //normal node
            this.drawNode(parent0, node);
            if (lod === 2) {
                /* draw in ports */
                this.drawPorts(parent1, node);
            }
        }
    };

    let initEdges = (edge, root0, root1, lod) => {
        if (lod === 2 && edge['ports']) {
            this.drawPortEdge(root1, edge);
        }
        this.drawNodeEdge(root0, edge);
    };

    /**
     * Calculates all point coordinates of this port number
     * @param posX node x coordinate
     * @param posY node y coordinate
     * @param i port number
     * @return {string} points
     */
    let calculatePort = (posX, posY, i) => {
        const x1 = posX - portWidthHalf;
        const y1 = posY;
        const x2 = posX;
        const y2 = posY + i * portHeight;
        const x3 = posX + portWidthHalf;
        return `${x1},${y1} ${x2},${y2}, ${x3},${y1}`
    };

    // /**
    //  * Creates a svg path according to the point array
    //  *
    //  * @param points point array
    //  * @return {string} svg path
    //  */
    // let createPath = (points) => {
    //     const path = [];
    //     path.push (`M${points[0].x},${points[0].y} Q${points[1].x},${points[1].y},${points[2].x},${points[2].y}`);
    //     for (let i = 3; i < points.length; i++) {
    //         path.push(`C${points[i].x},${points[i].y}`);
    //     }
    //     return path.join(' ');
    // };

    /**
     * Creates a svg path according to the point array
     *
     * @param points point array
     * @return {string} svg path
     */
    let createPath = (points) => {
        const path = [];
        path.push (`M${points[0].x},${points[0].y}`);
        for (let i = 1; i < points.length; i++) {
            path.push(`L${points[i].x},${points[i].y}`);
        }
        return path.join(' ');
    };

    /**
     * Adds hover function to a tag using field attr of o
     * @param tag dom element
     * @param o js object
     */
    let addHover = (tag, o) => {
        if (o.hasOwnProperty('attr')) {
            tag.on('mouseover', () => {
                tooltip.style("display", "block")
                    .style('left', `${d3.event.pageX + 5}px`)
                    .style('top', `${d3.event.pageY + 5}px`)
                    .html(`${getAttrDesc(o)}`);
            }).on('mouseout', () => {
                if (o['attr'] && o.attr['link']) {
                    tooltip
                        .transition()
                        .duration(1000)
                        .delay(2000)
                        .style("display", "none");
                } else {
                    tooltip
                        .style("display", "none");
                }
            });
        }
    };
}
