/**
 *
 * @param obj
 * @return {string}
 */
getAttrDesc = (obj) => {
    let description = "";
    if (obj['attr']) {
        const attr = obj.attr;
        const keys = Object.keys(attr);
        const len = keys.length;
        if (len > 0) {
            description += `${keys[0]}: ${attr[keys[0]]}`;
        }
        for (let i = 1; i < len; i++) {
            description += `<br>${keys[i]}: ${attr[keys[i]]}`;
        }
    }
    return description;
};

/**
 * Finds the node group in DOM
 * @param node node id
 */
findNode = (node) => d3.select(`#n${node}`);


/**
 * Finds the port in DOM
 * @param node node id
 * @param port port id
 * @param type 'in' or 'out'
 */
findPort = (node, port, type) => d3.select(`#n${node}${type}${port}`);

/**
 * Finds the node group in DOM
 * @param edge edge id
 */
findEdge = (edge) => d3.select(`#e${edge}`);
