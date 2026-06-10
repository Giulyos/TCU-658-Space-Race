// Monorepo lint-staged config.
// When files in a package are staged, run that package's own lint + tests
// (each package has its own flat ESLint config, which only resolves correctly
// when ESLint runs from that package's directory). Returning a fixed command
// per package avoids passing root-relative paths into the wrong config.
export default {
  'server/**/*.js': () => [
    'npm --prefix server run lint',
    'npm --prefix server test',
  ],
  'client/**/*.{js,jsx}': () => [
    'npm --prefix client run lint',
    'npm --prefix client test',
  ],
}
