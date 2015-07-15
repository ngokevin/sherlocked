function browserEnvSlugify(browserEnv) {
  let slug = browserEnv.name;
  if (browserEnv.version) {
    slug += ' | Version ' + browserEnv.version;
  }
  if (browserEnv.platform) {
    slug += ' | ' + browserEnv.platform;
  }
  return slug;
}
export {browserEnvSlugify};
