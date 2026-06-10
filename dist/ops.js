"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mainlineNodeList = exports.hasBranching = exports.nodeAtPly = exports.last = exports.childById = void 0;
exports.withMainlineChild = withMainlineChild;
exports.findInMainline = findInMainline;
exports.collect = collect;
exports.takePathWhile = takePathWhile;
exports.removeChild = removeChild;
exports.countChildrenAndComments = countChildrenAndComments;
exports.merge = merge;
exports.updateAll = updateAll;
function withMainlineChild(node, f) {
    const next = node.children[0];
    return next ? f(next) : undefined;
}
function findInMainline(fromNode, predicate) {
    const findFrom = (node) => predicate(node) ? node : withMainlineChild(node, findFrom);
    return findFrom(fromNode);
}
// returns a list of nodes collected from the original one
function collect(from, pickChild) {
    const nodes = [from];
    let n = from, c;
    while ((c = pickChild(n))) {
        nodes.push(c);
        n = c;
    }
    return nodes;
}
const childById = (node, id) => node.children.find(child => child.id === id);
exports.childById = childById;
const last = (nodeList) => nodeList[nodeList.length - 1];
exports.last = last;
const nodeAtPly = (nodeList, ply) => nodeList.find(node => node.ply === ply);
exports.nodeAtPly = nodeAtPly;
function takePathWhile(nodeList, predicate) {
    let path = '';
    for (const n of nodeList) {
        if (predicate(n))
            path += n.id;
        else
            break;
    }
    return path;
}
function removeChild(parent, id) {
    parent.children = parent.children.filter(n => n.id !== id);
}
function countChildrenAndComments(node) {
    const count = {
        nodes: 1,
        comments: (node.comments || []).length,
    };
    node.children.forEach(function (child) {
        const c = countChildrenAndComments(child);
        count.nodes += c.nodes;
        count.comments += c.comments;
    });
    return count;
}
// adds n2 into n1
function merge(n1, n2) {
    if (n2.eval)
        n1.eval = n2.eval;
    if (n2.glyphs)
        n1.glyphs = n2.glyphs;
    n2.comments &&
        n2.comments.forEach(function (c) {
            if (!n1.comments)
                n1.comments = [c];
            else if (!n1.comments.some(function (d) {
                return d.text === c.text;
            }))
                n1.comments.push(c);
        });
    n2.startingComments &&
        n2.startingComments.forEach(function (c) {
            if (!n1.startingComments)
                n1.startingComments = [c];
            else if (!n1.startingComments.some(function (d) {
                return d.text === c.text;
            }))
                n1.startingComments.push(c);
        });
    n2.children.forEach(function (c) {
        const existing = (0, exports.childById)(n1, c.id);
        if (existing)
            merge(existing, c);
        else
            n1.children.push(c);
    });
}
const hasBranching = (node, maxDepth) => maxDepth <= 0 || !!node.children[1] || (node.children[0] && (0, exports.hasBranching)(node.children[0], maxDepth - 1));
exports.hasBranching = hasBranching;
const mainlineNodeList = (from) => collect(from, node => node.children[0]);
exports.mainlineNodeList = mainlineNodeList;
function updateAll(root, f) {
    // applies f recursively to all nodes
    function update(node) {
        f(node);
        node.children.forEach(update);
    }
    update(root);
}
