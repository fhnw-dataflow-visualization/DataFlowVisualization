/**
 * @author Claudio
 * @date 11.11.2017
 * @version 1.0
 */

/**
 *
 * @param path graph as *.json
 * @constructor
 */
function DataflowVisualtion(path) {
    const lib = null; //todo set library
    const mainGraph = new JsonGraph();
    mainGraph.load(path);

    /**
     * Modifies the existing graph
     * @param cmd Changing command
     */
    this.modify = function (cmd) {
        //todo graph modify operations
    };

    /**
     * Selects the needed graph data and build the visualization graph for lib input
     * @param libData lib event data, fired by user interaction
     */
    function select(libData) {
        //todo select relevant graph data for lib-input
    }

    /**
     * Returns the object attributes as descriptions
     * Read specified properties in obj.attr
     * @param obj object
     * @returns {string}
     */
    function getAttrDesc(obj) {
        const attr = obj.attr;
        const keys = Object.keys(attr);
        const len = keys.length;
        let description = "";
        if (len > 0) {
            description += `${keys[0]}: ${attr[keys[0]]}`;
        }
        for (let i = 1; i < len; i++) {
            description += `\n${keys[i]}: ${attr[keys[i]]}`;
        }
        return description;
    }
}