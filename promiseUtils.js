
module.exports.MaybeDo = (res, project, tactic) => {
    if (null == res) {
        return tactic(project);
    } else {
        return res;
    }
};

module.exports.PassThrough = fn => d => {
    try {
        fn(d);
        return d;
    } catch (e) {
        throw e;
    }
};


module.exports.ForEach = fn => d => {
    var promises = [];
    d.forEach( (e) => {
        promises.push(fn(e));
    });

    return Promise.all(promises);
};


module.exports.sleep = ms => {
    return new Promise( resolve => {
        setTimeout(resolve, ms);
    });
}
