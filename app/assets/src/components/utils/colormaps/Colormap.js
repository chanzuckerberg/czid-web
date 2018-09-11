export class Colormap {
  // Colormap provides utility functions to load color maps (array defining a scale of colors) from
  // a JSON array and create colors scales with a variable number of colors.

  static loadLocalScale(scaleName) {
    return require(`./${scaleName}.json`);
  }

  static getNScale(scaleName, n) {
    const baseScale = this.loadLocalScale(scaleName);
    n = Math.min(n, baseScale.length);

    let step = baseScale.length / n;
    let sampledScale = [];
    for (let i = 0; i < n - 1; i++) {
      sampledScale.push(baseScale[Math.round(i * step)]);
    }
    sampledScale.push(baseScale[baseScale.length - 1]);
    return sampledScale;
  }
}
