export class CategoricalColormap {
  constructor(gradientLimits) {
    this.gradients = gradientLimits || [
      "482778",
      "1F968B",
      "55C567",
      "BF1464",
      "E58740",
      "AB4ECC"
    ];

    this.gradients = this.gradients.map(c => this.hexToDec(c));
  }

  hexToDec(hexColor) {
    let decColors = [];
    for (let j = 0; j < 3; j++)
      decColors.push(parseInt(hexColor.slice(j * 2, j * 2 + 2), 16));
    return decColors;
  }

  decToHex(decColor) {
    let hexColor = "#";
    for (let j = 0; j < 3; j++) hexColor += decColor[j].toString(16);
    return hexColor;
  }

  getNScale(n) {
    // adhoc scheme of choosing colors
    // 1) select the C limits of the linear gradients in order
    // 2) select central equaltity distributed intermediate colors
    //    of each gradient segment using a round-robin
    if (n === 0) return [];

    let colors = this.gradients
      .slice(0, Math.min(this.gradients.length, n))
      .map(decColor => this.decToHex(decColor));

    if (colors.length < n) {
      let colorsPerInterval = Math.floor(
        (n - this.gradients.length) / (this.gradients.length - 1)
      );
      let extraColors =
        (n - this.gradients.length) % (this.gradients.length - 1);
      for (let i = colors.length; i < n; i++) {
        let sequenceColor = Math.floor(
          (i - this.gradients.length) / (this.gradients.length - 1)
        );
        let interval =
          (i - this.gradients.length) % (this.gradients.length - 1);
        let step =
          (sequenceColor + 1) /
          (1 + colorsPerInterval + (interval < extraColors ? 1 : 0));

        colors.push(
          this.decToHex(
            this.getLinearColor(
              this.gradients[interval],
              this.gradients[interval + 1],
              step
            )
          )
        );
      }
    }
    return colors;
  }

  getLinearColor(startColor, endColor, k) {
    let decColor = [];
    for (let j = 0; j < 3; j++) {
      decColor.push(
        Math.floor(startColor[j] + k * (endColor[j] - startColor[j]))
      );
    }
    return decColor;
  }
}
