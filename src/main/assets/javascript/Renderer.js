function Renderer(viewport, tooltip, conf, data) {
    const nodeWidth = conf.node.width;
    const nodeWidthHalf = nodeWidth / 2;
    const nodeHeight = conf.node.height;
    const nodeHeightHalf = nodeHeight / 2;
    const portWidth = conf.port.width;
    const portWidthHalf = portWidth / 2;
    const portHeight = conf.port.height;

    /**
     * Initializes all nodes in the graph
     * @param lod level of detail
     */
    this.initNodes = (lod) => {
        viewport.selectAll(".node").data(data.nodes).enter().each((node) => {
            const n = viewport.append("g")
                .attr('id', `n${node.id}`)
                .attr('data-x', node.x)
                .attr('data-y', node.y)
                .attr("class", "node")
                .attr("transform", `translate(${node.x},${node.y})`);
            const r = n.append("rect")
                .attr("width", nodeWidth)
                .attr("height", nodeHeight);
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
        });
    };

    /**
     * Updates all nodes in the graph
     * Actually used for changed level of detail
     * @param lod level of detail
     */
    this.updateNode = (lod) => {
        const n = viewport.selectAll('.node');
        n.data(data.nodes).each((node) => {
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
        });
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
                .attr('data-x', node.x + x)
                .attr('data-y', node.y)
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
                .attr('data-x', node.x + x)
                .attr('data-y', node.y + nodeHeight)
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
     * Initializes all edges in the graph
     * @param lod level of detail
     */
    this.initEdges = (lod) => {
        viewport.selectAll(".edge").data(data.edges).enter().each((line) => {
            const g = viewport.append('g')
                .attr('id', `e${line.id}`)
                .attr('class', 'edge');
            drawLines(g, line, lod);
        });
    };

    /**
     * Updates all edges in the graph
     * Actually used for changed level of detail
     * @param lod level of detail
     */
    this.updateEdges = (lod) => {
        viewport.selectAll(".edge").data(data.edges).each((line) => {
            const g = findEdge(line.id);
            g.selectAll('line').remove();
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
        if (lod === 2 && line['ports']) {
            //draw multi lines port-to-port
            e.selectAll('line').data(line.ports).enter().each((port) => {
                const from = findPort(line.from, port.out, 'out');
                const to = findPort(line.to, port.in, 'in');
                e.append('line')
                    .attr('x1', from.attr('data-x'))
                    .attr('y1', from.attr('data-y'))
                    .attr('x2', to.attr('data-x'))
                    .attr('y2', to.attr('data-y'))
                    .style('marker-end', 'url(#arrow)');
                addHover(e, port);
            });
        } else {
            //draw line node to node
            const from = findNode(line.from);
            const to = findNode(line.to);
            e.append('line')
                .attr('x1', parseFloat(from.attr('data-x')) + nodeWidthHalf)
                .attr('y1', parseFloat(from.attr('data-y')) + nodeHeight)
                .attr('x2', parseFloat(to.attr('data-x')) + nodeWidthHalf)
                .attr('y2', to.attr('data-y'))
                .style('marker-end', 'url(#arrow)');
            addHover(e, line);
        }
    };

    let addHover = (tag, o) => {
        tag.on('mousemove', () => {
            tooltip.style("display", "block")
                .style('left', `${d3.event.pageX + 5}px`)
                .style('top', `${d3.event.pageY + 5}px`)
                .html(`${getAttrDesc(o)}`);
        })
            .on('mouseout', () => {
                tooltip.style("display", "none");


            });
    };
}
