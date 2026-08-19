import fs from "fs";
import { PNG } from "pngjs";

const inputPath = "./assets/orange_cat_pomelo.png";

fs.createReadStream(inputPath)
  .pipe(new PNG({ filterType: 4 }))
  .on("parsed", function () {
    console.log(`Source dimensions: ${this.width} x ${this.height}`);

    // Create a high-res retina optimized version: target width 450px (scaled proportionally)
    const targetWidth = 450;
    const targetHeight = Math.round((this.height * targetWidth) / this.width);
    console.log(`Target dimensions: ${targetWidth} x ${targetHeight}`);

    const resized = new PNG({ width: targetWidth, height: targetHeight });

    for (let y = 0; y < targetHeight; y++) {
      for (let x = 0; x < targetWidth; x++) {
        const srcX = Math.floor((x * this.width) / targetWidth);
        const srcY = Math.floor((y * this.height) / targetHeight);
        const srcIdx = (srcY * this.width + srcX) << 2;
        const dstIdx = (y * targetWidth + x) << 2;

        resized.data[dstIdx] = this.data[srcIdx];
        resized.data[dstIdx + 1] = this.data[srcIdx + 1];
        resized.data[dstIdx + 2] = this.data[srcIdx + 2];
        resized.data[dstIdx + 3] = this.data[srcIdx + 3];
      }
    }

    const chunks = [];
    resized.pack()
      .on("data", (chunk) => chunks.push(chunk))
      .on("end", () => {
        const buffer = Buffer.concat(chunks);
        const base64 = buffer.toString("base64");
        const dataUrl = `data:image/png;base64,${base64}`;
        console.log(`Base64 length: ${dataUrl.length} chars (approx ${(dataUrl.length / 1024).toFixed(1)} KB)`);

        fs.writeFileSync("./src/cat_data_url.ts", `export const CAT_IMAGE_DATA_URL = "${dataUrl}";\n`);
        fs.writeFileSync("./assets/cat_data_url.txt", dataUrl);
        fs.writeFileSync("./assets/orange_cat_optimized.png", buffer);
        fs.writeFileSync("./public/assets/orange_cat_optimized.png", buffer);
        fs.writeFileSync("./public/orange_cat_optimized.png", buffer);
        console.log("Exported CAT_IMAGE_DATA_URL successfully!");
      });
  });
