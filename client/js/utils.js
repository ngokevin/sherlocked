function slugifyBrowserEnv(browserEnv) {
    var slug = browserEnv.name;
    if (browserEnv.version) {
        slug += ' | Version ' + browserEnv.version;
    }
    if (browserEnv.platform) {
        slug += ' | ' + browserEnv.platform;
    }
    return slug;
}

module.exports = {
    slugifyBrowserEnv: slugifyBrowserEnv
};
