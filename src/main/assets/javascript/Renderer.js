function Renderer(mg, viewport, tooltip) {
    const conf = mg.conf;
    const nodeWidth = conf.node.width;
    const nodeWidthHalf = nodeWidth / 2;
    const nodeHeight = conf.node.height;
    const nodeHeightHalf = nodeHeight / 2;
    const portWidth = conf.port.width;
    const portWidthHalf = portWidth / 2;
    const portHeight = conf.port.height;

    /**
     * Creates the dom graph and appends it on the viewport element
     *
     * @param data aligned graph data {node: [], edges: []}
     * @param lod init level of detail
     */
    this.initGraph = (data, lod) => {
        //init nodes
        data.nodes.forEach((node) => {
            initNode(node, viewport, 0, 0, lod);
        });
        //init edges
        data.edges.forEach((edge) => {
            initEdges(edge, lod);
        });
    };

    let initNode = (node, parent, x, y, lod) => {
        if (node['children']) {
            //group node
            const n = parent.append("g")
                .attr('id', `n${node.id}`)
                .attr("class", "nodes")
                .attr("transform", `translate(${node.x - x - node.width * 0.5},${node.y - y - node.height * 0.5})`);
            const r = n.append("rect")
                .attr("width", node.width)
                .attr("height", node.height)
                .attr("class", "group");
            const circle = n.append("circle")
                .attr("cx", node.width - 20)
                .attr("cy", 20)
                .attr("r", 10)
                .attr("class", "groupF");
            if (node.view === 'expanded') {
                //expanded group
                circle.on('click', () => {
                    node.view = 'reduced';
                    mg.updateGroup(node);
                });
                node.children.forEach((child) => {
                    initNode(child, n, node.x - node.width * 0.5, node.y - node.height * 0.5, lod);
                });
            } else {
                //reduced group
                circle.on('click', () => {
                    node.view = 'expanded';
                    mg.updateGroup(node);
                });
            }
        } else {
            //normal node
            const n = parent.append("g")
                .attr('id', `n${node.id}`)
                .attr("class", "nodes")
                .attr("transform", `translate(${node.x - x - nodeWidthHalf},${node.y - y - nodeHeightHalf})`);
            const r = n.append("rect")
                .attr("width", nodeWidth)
                .attr("height", nodeHeight)
                .attr("class", "node");
            if (node['color'])
                r.style('stroke', `${node.color}`);
            n.append("text")
                .attr('x', 5)
                .attr('y', nodeHeightHalf + 5)
                .html(node.name);
            addHover(r, node, node.x + nodeWidth + 12, node.y - 73);
            /* draw in ports */
            if (node['in']) {
                const ports = n.append('g')
                    .attr('class', 'inPort');
                if (lod === 2) {
                    initInPort(ports, node);
                }
            }
            /* draw out ports */
            if (node['out']) {
                const ports = n.append('g')
                    .attr('class', 'outPort');
                if (lod === 2) {
                    initOutPort(ports, node);
                }
            }
        }
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
                const x = port.anchor.x - node.x + nodeWidthHalf;
                const y = port.anchor.y - node.y + nodeHeightHalf;
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
                const x = port.anchor.x - node.x + nodeWidthHalf;
                const y = port.anchor.y - node.y + nodeHeightHalf;
                g.append('polygon')
                    .attr('id', `n${node.id}out${port.port}`)
                    .attr('points', calculatePort(x, y, -1));
                addHover(g, port);
            }
        }
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

    /**
     * Draws all <line> of current edge
     * lod = 2: Draws all port-to-port edges
     * lod < 2: Draws node-to-node edge
     *
     * @param edge js edge
     * @param lod level of detail
     */
    let initEdges = (edge, lod) => {
        const g = viewport.append('g')
            .attr('id', `e${edge.id}`)
            .attr('class', 'edge');
        if (edge['ports']) {
            edge.ports.forEach((port) => {
                const p = g.append('path')
                    .attr('d', createPath(port.points))
                    .style('marker-end', 'url(#arrow)');
                addHover(p, port);
            });
        } else {
            //     const p = e.append('path')
            //         .attr('d', createPath(line.points))
            //         .style('marker-end', 'url(#arrow)');
            //     addHover(p, line);
        }
    };

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
     * @param tag dom element
     * @param o js object
     */
    let addHover = (tag, o) => {
        if (o['attr']) {
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

    this.updateLod = (lod) => {
        updateNodeLod(viewport.selectAll('.nodes'), lod);
    };

    let updateNodeLod = (g, lod) => {
        g.selectAll('.inPort').style("display", lod === 2 ? "block" : "none");
        g.selectAll('.outPort').style("display", lod === 2 ? "block" : "none");
        const n = g.selectAll('.nodes');
        if (n.size() > 0)
            updateNodeLod(n, lod);
    }


    // /**
    //  * Updates all nodes in the graph
    //  * Actually used for changed level of detail
    //  * @param viewport <g> viewport
    //  * @param lod level of detail
    //  */
    // this.updateNodes = (viewport, nodes, lod) => {
    //     const n = viewport.selectAll('.nodes');
    //     n.data(nodes).each((node) => {
    //         updateNode(node, lod)
    //     });
    // };
    //
    // let updateNode = (node, lod) => {
    //     if (node['children']) {
    //         node.children.forEach((child) => {
    //             updateNode(child, lod);
    //         });
    //     } else {
    //         const n = findNode(node.id);
    //         const inPorts = n.select('.inPort');
    //         const outPorts = n.select('.outPort');
    //         if (lod === 2) {
    //             if (node['in']) {
    //                 initInPort(inPorts, node);
    //             }
    //             if (node['out']) {
    //                 initOutPort(outPorts, node);
    //             }
    //         } else {
    //             removePorts(inPorts);
    //             removePorts(outPorts);
    //         }
    //     }
    // };
    //
    // /**
    //  * Removes all <polygon> ports from current node
    //  * @param g <g> in- or output ports
    //  */
    // let removePorts = (g) => {
    //     g.selectAll('polygon').remove();
    // };
    //
    // /**
    //  * Updates all edges in the graph
    //  * Actually used for changed level of detail
    //  * @param viewport <g> viewport
    //  * @param lod level of detail
    //  */
    // this.updateEdges = (viewport, edges, lod) => {
    //     viewport.selectAll(".edge").data(edges).each((line) => {
    //         const g = findEdge(line.id);
    //         g.selectAll('line').remove();
    //         g.selectAll('path').remove();
    //         initEdges(g, line, lod);
    //     });
    // };
}
