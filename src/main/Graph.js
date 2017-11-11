/**
 * @author Claudio
 * @date 11.11.2017
 * @version 1.0
 */

function Graph() {
    let nodes;
    let edges;
    
    this.load = function (path) {
        const json = JSON.parse(path);
        nodes = json.nodes;
        edges = json.edges;
    };

    this.nodes = () => nodes;
    this.edges = () => edges;

    this.select = function () {
        //todo selection handling
    }
}