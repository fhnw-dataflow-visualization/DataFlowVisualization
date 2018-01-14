/**
 * @author Claudio Seitz
 * @version 1.0
 *
 * Draws the graph as svg
 *
 * @param conf config object
 * @param changeGroupView group view update method
 * @param nodeSet set of all nodes
 * @param edgeSet set of all edges
 * @param tooltip <div> tooltip
 * @constructor
 */
function Renderer(conf, changeGroupView, nodeSet, edgeSet, tooltip) {
    const nodeWidth = conf.node.width;
    const nodeWidthHalf = nodeWidth / 2;
    const nodeHeight = conf.node.height;
    const nodeHeightHalf = nodeHeight / 2;
    const portWidth = conf.port.width;
    const portWidthHalf = portWidth / 2;
    const portHeight = conf.port.height;

    //todo adjust lod

    /**
     * Renders the graph rough
     * @param vis visible data
     * @param view0 <g> view element
     */
    this.render = (vis, view0) => {
        //init nodes
        //todo clarify parallelism
        vis.nodes.forEach((id) => {
            const node = nodeSet[id];
            if (node.hasOwnProperty('view')) {
                const changeView = this.drawGroup(view0, node);
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
                this.drawNode(view0, node);
            }
        });
        //init edges
        //todo clarify parallelism
        vis.edges.forEach((id) => {
            const edge = edgeSet[id];
            this.drawNodeEdge(view0, edge);
        });
    };

    /**
     * Render the graph detailed
     *
     * @param vis visible data
     * @param view0 <g> view element 0
     * @param view1 <g> view element 1
     * @param view2 <g> view element 2
     */
    this.renderDetailed = (vis, view0, view1, view2) => {
        //init nodes
        //todo clarify parallelism
        vis.nodes.forEach((id) => {
            const node = nodeSet[id];
            if (node.hasOwnProperty('view')) {
                const changeView = this.drawGroup(view0, node);
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
                this.drawNode(view0, node);
                this.drawPorts(view2, node);
            }
        });
        //init edges
        //todo clarify parallelism
        vis.edges.forEach((id) => {
            const edge = edgeSet[id];
            if (edge['ports']) {
                this.drawPortEdge(view2, edge);
            }
            this.drawNodeEdge(view1, edge);
        });
    };

    /**
     * Draws a group
     * @param root parent dom element
     * @param group group object
     */
    this.drawGroup = (root, group) => {
        const n = root.append("g")
            .attr('id', `n${group.id}`)
            .attr("class", "node")
            .attr("transform", `translate(${group.x - group.width * 0.5},${group.y - group.height * 0.5})`);
        const r = n.append("rect")
            .attr("width", group.width)
            .attr("height", group.height);
        if (group.hasOwnProperty('color')) {
            r.style('fill', group.color);
        }
        n.append("text")
            .attr('x', portWidthHalf + 5)
            .attr('y', nodeHeightHalf + 5)
            .html(`${group.name} (${group.id})`);
        return n.append("svg:image")
            .attr('xlink:href', group.view === 'reduced'
                ? './resources/Collabsout.png'
                : './resources/Collabsin.png')
            .attr("width", 23)
            .attr("height", 23)
            .attr("x", group.width - 30)
            .attr("y", 5);
    };

    /**
     * Draws a node
     * @param root parent dom element
     * @param node node object
     */
    this.drawNode = (root, node) => {
        const n = root.append("g")
            .attr('id', `n${node.id}`)
            .attr("class", "node")
            .attr("transform", `translate(${node.x - nodeWidthHalf},${node.y - nodeHeightHalf})`);
        const r = n.append("rect")
            .attr("width", nodeWidth)
            .attr("height", nodeHeight);
        if (node.hasOwnProperty('color')) {
            r.style('fill', node.color);
        }
        n.append("text")
            .attr('x', portWidthHalf + 5)
            .attr('y', nodeHeightHalf + 5)
            .html(`${node.name} (${node.id})`);
        addHover(r, node, node.x + nodeWidth + 12, node.y - 73);
    };

    /**
     * Draws the ports of a node
     * @param root parent dom element
     * @param node node object
     */
    this.drawPorts = (root, node) => {
        const p = root.append('g')
            .attr('class', 'port');
        // draw in ports
        if (node.hasOwnProperty('in')) {
            drawInPort(p, node);
        }
        // draw out ports
        if (node.hasOwnProperty('out')) {
            drawOutPort(p, node);
        }
    };

    /**
     * Draws all input ports of current node
     * @param root parent dom element
     * @param node js node
     */
    let drawInPort = (root, node) => {
        for (let key in node.in) {
            if (node.in.hasOwnProperty(key)) {
                const port = node.in[key];
                const x = port.anchor.x;
                const y = port.anchor.y;
                const p = root.append('polygon')
                    .attr('id', `n${node.id}in${port.port}`)
                    .attr('points', calculatePort(x, y, 1));
                if (port.hasOwnProperty('color')) {
                    p.style('fill', port.color);
                }
                addHover(p, port);
            }
        }
    };

    /**
     * Draws all <polygon> output ports of current node
     * @param root parent dom element
     * @param node js node
     */
    let drawOutPort = (root, node) => {
        for (let key in node.out) {
            if (node.out.hasOwnProperty(key)) {
                const port = node.out[key];
                const x = port.anchor.x;
                const y = port.anchor.y;
                const p = root.append('polygon')
                    .attr('id', `n${node.id}out${port.port}`)
                    .attr('points', calculatePort(x, y, -1));
                if (port.hasOwnProperty('color')) {
                    p.style('fill', port.color);
                }
                addHover(p, port);
            }
        }
    };

    /**
     * Draws an node-node edge
     * @param root parent dom element
     * @param edge edge object
     */
    this.drawNodeEdge = (root, edge) => {
        const p = root.append('path')
            .attr('class', 'edge')
            .attr('d', createPath(edge.points))
            .style('marker-end', 'url(#arrow)');
        if (edge.hasOwnProperty('color')) {
            p.style('stroke', edge.color);
        }
        addHover(p, edge);
    };

    /**
     * Draws all port-port edges of a node-node edge
     * @param root parent dom element
     * @param edge edge object
     */
    this.drawPortEdge = (root, edge) => {
        const g = root.append('g')
            .attr('id', `e${edge.id}`)
            .attr('class', 'edge');
        if (edge.hasOwnProperty('color')) {
            g.style('stroke', edge.color);
        }
        edge.ports.forEach((port) => {
            const p = g.append('path')
                .attr('d', createPath(port.points))
                .style('marker-end', 'url(#arrow)');
            if (port.hasOwnProperty('color')) {
                p.style('stroke', port.color);
            }
            addHover(p, port);
        });
    };

    this.drawMimimap = (vis, mapSvg, x, y, s) => {
        const g = mapSvg.append('g').attr('transform', `translate(${x},${y})scale(${s})`);
        const mapNodes = g.append('g').attr('class', 'node');
        const mapEdges = g.append('g').attr('class', 'edge');
        //init nodes
        //todo clarify parallelism
        vis.nodes.forEach((id) => {
            const node = nodeSet[id];
            const r = mapNodes.append("rect")
                .attr('x', node.x - node.width * 0.5)
                .attr('y', node.y - node.height * 0.5)
                .attr('width', node.width)
                .attr('height', node.height);
            if (node.hasOwnProperty('color')) {
                r.style('fill', node.color);
            }
        });
        //init edges
        //todo clarify parallelism
        vis.edges.forEach((id) => {
            const edge = edgeSet[id];
            const p = mapEdges.append('path')
                .attr('class', 'edge')
                .attr('d', createPath(edge.points))
                .style('marker-end', 'url(#arrow)');
            if (edge.hasOwnProperty('color')) {
                p.style('stroke', edge.color);
            }
        });
        return g.append('rect');;
    };

    /**
     * Calculates all point coordinates of this port number
     *
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
        path.push(`M${points[0].x},${points[0].y}`);
        for (let i = 1; i < points.length; i++) {
            path.push(`L${points[i].x},${points[i].y}`);
        }
        return path.join(' ');
    };

    /**
     * Adds hover function to a tag using field attr of o
     *
     * @param dom element
     * @param o js object
     */
    let addHover = (dom, o) => {
        if (o.hasOwnProperty('attr')) {
            dom.on('mouseover', () => {
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
                    tooltip.style("display", "none");
                }
            });
        }
    };
}
