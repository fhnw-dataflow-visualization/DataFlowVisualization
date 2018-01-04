function Renderer(mg, tooltip) {
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
     * @param viewport <g> viewport element
     * @param data aligned graph data {node: [], edges: []}
     * @param lod init level of detail
     */
    this.initGraph = (viewport, data, lod) => {
        //init nodes
        viewport.selectAll(".node").data(data.nodes).enter().each((node) => {
            initNode(node, viewport, 0, 0, lod);
        });
        //init edges
        viewport.selectAll(".edge").data(data.edges).enter().each((line) => {
            const g = viewport.append('g')
                .attr('id', `e${line.id}`)
                .attr('class', 'edge');
            drawLines(g, line, lod);
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
                if (lod === 2 && node.in.length > 0) {
                    drawInPort(ports, node);
                }
            }
            /* draw out ports */
            if (node['out']) {
                const ports = n.append('g')
                    .attr('class', 'outPort');
                if (lod === 2 && node.out.length > 0) {
                    drawOutPort(ports, node);
                }
            }
        }
    };


    /**
     * Updates all nodes in the graph
     * Actually used for changed level of detail
     * @param viewport <g> viewport
     * @param lod level of detail
     */
    this.updateNodes = (viewport, lod) => {
        const n = viewport.selectAll('.node');
        n.data(data.nodes).each((node) => {
            updateNode(node, lod)
        });
    };

    let updateNode = (node, lod) => {
        if (node['children']) {
            node.children.forEach((child) => {
                updateNode(child, lod);
            });
        } else {
            const n = findNode(node.id);
            const inPorts = n.select('.inPort');
            const outPorts = n.select('.outPort');
            if (lod === 2) {
                if (node['in']) {
                    drawInPort(inPorts, node);
                }
                if (node['out']) {
                    drawOutPort(outPorts, node);
                }
            } else {
                removePorts(inPorts);
                removePorts(outPorts);
            }
        }
    };

    /**
     * Draws all input ports of current node
     * @param g <g> node
     * @param node js node
     */
    let drawInPort = (g, node) => {
        const inLength = node.in.length;
        const sIn = 1 / (2 * inLength);
        g.selectAll('polygon').data(node.in).enter().each((port) => {
            const x = (2 * port.port + 1) * sIn * nodeWidth;
            g.append('polygon')
                .attr('id', `n${node.id}in${port.port}`)
                .attr('data-x', node.x - nodeWidthHalf + x)
                .attr('data-y', node.y - nodeHeightHalf)
                .attr('points', calculatePort(x, 0, 1));
            addHover(g, port);
        });
    };

    /**
     * Draws all <polygon> output ports of current node
     * @param g <g> node
     * @param node js node
     */
    let drawOutPort = (g, node) => {
        const outLength = node.out.length;
        const sOut = 1 / (2 * outLength);
        g.selectAll('polygon').data(node.out).enter().each((port) => {
            const x = (2 * port.port + 1) * sOut * nodeWidth;
            g.append('polygon')
                .attr('id', `n${node.id}out${port.port}`)
                .attr('data-x', node.x - nodeWidthHalf + x)
                .attr('data-y', node.y + nodeHeightHalf)
                .attr('points', calculatePort(x, nodeHeight, -1));
            addHover(g, port);
        });
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
     * Removes all <polygon> ports from current node
     * @param g <g> in- or output ports
     */
    let removePorts = (g) => {
        g.selectAll('polygon').remove();
    };

    /**
     * Updates all edges in the graph
     * Actually used for changed level of detail
     * @param viewport <g> viewport
     * @param lod level of detail
     */
    this.updateEdges = (viewport,  lod) => {
        viewport.selectAll(".edge").data(data.edges).each((line) => {
            const g = findEdge(line.id);
            g.selectAll('line').remove();
            g.selectAll('path').remove();
            drawLines(g, line, lod);
        });
    };

    /**
     * Draws all <line> of current edge
     * lod = 2: Draws all port-to-port edges
     * lod < 2: Draws node-to-node edge
     *
     * @param e <g> edge
     * @param line js edge
     * @param lod level of detail
     */
    let drawLines = (e, line, lod) => {
        // if (lod === 2 && line['ports']) {
        //     //draw multi lines port-to-port
        //     e.selectAll('line').data(line.ports).enter().each((port) => {
        //         const from = findPort(line.from, port.out, 'out');
        //         const to = findPort(line.to, port.in, 'in');
        //         const L = e.append('line')
        //             .attr('x1', from.attr('data-x'))
        //             .attr('y1', from.attr('data-y'))
        //             .attr('x2', to.attr('data-x'))
        //             .attr('y2', to.attr('data-y'))
        //             .style('marker-end', 'url(#arrow)');
        //         addHover(L, port);
        //     });
        // } else {
            //draw line node to node
            // const from = findNode(line.from);
            // const to = findNode(line.to);
            //todo remove debug
            if(!line['points']) {
                console.log(`No points at edge: ${toString(line)}`)
            } else {
                const p = e.append('path')
                    .attr('d', createPath(line.points))
                    .style('marker-end', 'url(#arrow)');
                addHover(p, line);
            }

        // }
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
                        .style("display", "none")
                } else {
                    tooltip
                        .style("display", "none")
                }
            });
        }
    };
}
