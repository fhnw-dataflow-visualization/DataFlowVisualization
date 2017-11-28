function Renderer(svg, tooltip, conf, data) {
    const nodeWidth = conf.node.width;
    const nodeWidthHalf = nodeWidth / 2;
    const nodeHeight = conf.node.height;
    const nodeHeightHalf = nodeHeight / 2;
    const portWidth = conf.port.width;
    const portWidthHalf = portWidth / 2;
    const portHeight = conf.port.height;

    /**
     * Draws the nodes into the svg
     */
    this.drawNodes = (lod) => {
        svg.selectAll(".node").data(data.nodes).enter().each((node) => {
            const n = svg.append("g")
                .attr("class", "node")
                .attr("transform", `translate(${node.x},${node.y})`);
            n.append("rect")
                .attr('id', `n${node.id}`)
                .attr("width", nodeWidth)
                .attr("height", nodeHeight)
                .attr('data-x', node.x)
                .attr('data-y', node.y)
                /* mouse events */
                .on("mouseover", () => {
                    tooltip.style("display", "block")
                        .style('left', `${node.x + nodeWidth + 12}px`)
                        .style('top', `${node.y - 73}px`)
                        .html(`${getAttrDesc(node)}`);
                })
                .on("mouseout", () => {
                    tooltip.style("display", "none");
                });
            n.append("text")
                .attr('x', 5)
                .attr('y', nodeHeightHalf + 5)
                .html(node.name);
            /* draw in ports */
            if (lod === 0 && node['in']) {
                const inLength = node.in.length;
                const sIn = 1 / (2 * inLength);
                n.selectAll('.inPort').data(node.in).enter().each((port) => {
                    const x = (2 * port.port + 1) * sIn * nodeWidth;
                    n.append('polygon')
                        .attr('id', `n${node.id}in${port.port}`)
                        .attr('data-x', node.x + x)
                        .attr('data-y', node.y)
                        .attr('points', calculatePort(x, 0, 1))
                        .attr('class', 'inPort')
                        .on("mouseover", () => {
                            tooltip.style("display", "block")
                                .style('left', `${node.x + x + 12}px`)
                                .style('top', `${node.y - 73}px`)
                                .html(`${getAttrDesc(port)}`);
                        })
                        .on("mouseout", () => {
                            tooltip.style("display", "none");
                        });
                });
            }
            /* draw out ports */
            if (lod === 0 && node['out']) {
                const outLength = node.out.length;
                const sOut = 1 / (2 * outLength);
                n.selectAll('.outPort').data(node.out).enter().each((port) => {
                    const x = (2 * port.port + 1) * sOut * nodeWidth;
                    n.append('polygon')
                        .attr('id', `n${node.id}out${port.port}`)
                        .attr('data-x', node.x + x)
                        .attr('data-y', node.y + nodeHeight)
                        .attr('points', calculatePort(x, nodeHeight, -1))
                        .attr('class', 'outPort')
                        .on("mouseover", () => {
                            tooltip.style("display", "block")
                                .style('left', `${node.x + x + 12}px`)
                                .style('top', `${node.y + nodeHeight + 12}px`)
                                .html(`${getAttrDesc(port)}`);
                        })
                        .on("mouseout", () => {
                            tooltip.style("display", "none");
                        });
                });
            }
        });
    };
    /**
     * Draws the edges into the svg
     * @param lod level of detail
     */
    this.drawEdges = (lod) => {
        svg.selectAll(".edge").data(data.edges).enter().each((line) => {
            const lineg = svg.append('g')
                .attr("class", "edge");
            if (lod === 0 && line['ports']) {
                //draw multi lines port to port
                lineg.selectAll('line').data(line.ports).enter().each((port) => {
                    const from = findPort(line.from, port.out, 'out');
                    const to = findPort(line.to, port.in, 'in');
                    lineg.append('line')
                        .attr('x1', from.attr('data-x'))
                        .attr('y1', from.attr('data-y'))
                        .attr('x2', to.attr('data-x'))
                        .attr('y2', to.attr('data-y'))
                        .style('marker-end', 'url(#arrow)')
                        .attr("class", "edge")
                        /* mouse events */
                        .on("mouseover", () => {
                            tooltip.style("display", "block")
                                .html(`${getAttrDesc(port)}`);
                        })
                        .on("mouseout", () => {
                            tooltip.style("display", "none");
                        });
                });
            } else {
                //draw line node to node
                const from = findNode(line.from);
                const to = findNode(line.to);
                lineg.append('line')
                    .attr('x1', parseFloat(from.attr('data-x')) + nodeWidthHalf)
                    .attr('y1', parseFloat(from.attr('data-y')) + nodeHeight)
                    .attr('x2', parseFloat(to.attr('data-x')) + nodeWidthHalf)
                    .attr('y2', to.attr('data-y'))
                    .style('marker-end', 'url(#arrow)')
                    .attr("class", "edge")
                    /* mouse events */
                    .on("mouseover", () => {
                        tooltip.style("display", "block")
                            .html(`${getAttrDesc(line)}`);
                    })
                    .on("mouseout", () => {
                        tooltip.style("display", "none");
                    });
            }
        });
    };

    let calculatePort = (posX, posY, i) => {
        const x1 = posX - portWidthHalf;
        const y1 = posY;
        const x2 = posX;
        const y2 = posY + i * portHeight;
        const x3 = posX + portWidthHalf;
        return `${x1},${y1} ${x2},${y2}, ${x3},${y1}`
    };
}
