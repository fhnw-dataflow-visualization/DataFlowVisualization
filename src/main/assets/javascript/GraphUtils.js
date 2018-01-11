/**
 *Returns the object's attribute object as a html text
 * @param obj js object
 * @return {string} attribute description
 */
getAttrDesc = (obj) => {
    let description = [];
        const attr = obj.attr;
        const keys = Object.keys(attr);
        const len = keys.length;
        for (let i = 0; i < len; i++) {
            if (keys[i] === 'link') {
                const link = attr[keys[i]];
                // language=HTML
                description.push(`<a href='${link.url}'>${link.text}</a>`);
            } else {
                // language=HTML
                description.push(`${keys[i]}:${attr[keys[i]]}`);
            }
        }
    return description.join('<br>');
};

/**
 * Returns an object as string, containing id and name
 * @param o object to stringify
 */
toString = (o) => `{id: ${o.id}, name: ${o.name}}`;

/**
 * Returns an edge as string, containing id, from and to
 * @param e edge to stringify
 */
edgeToString = (e) => `{id: ${e.id}, from: ${e.from}, to: ${e.to}}`;

/**
 * Finds the node group in DOM
 * @param id node id
 */
findDNode = (id) => d3.select(`#n${id}`);


/**
 * Finds the port in DOM
 * @param nodeId node id
 * @param portId port id
 * @param type 'in' or 'out'
 */
findDPort = (nodeId, portId, type) => d3.select(`#n${nodeId}${type}${portId}`);

/**
 * Finds the edge group in DOM
 * @param edge edge id
 */
findDEdge = (edge) => d3.select(`#e${edge}`);
