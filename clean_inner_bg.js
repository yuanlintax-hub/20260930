import fs from "fs";
import { PNG } from "pngjs";

const inputPath = "./assets/orange_cat_pomelo.png";
const outputPath = "./assets/orange_cat_pomelo.png";

fs.createReadStream(inputPath)
  .pipe(new PNG({ filterType: 4 }))
  .on("parsed", function () {
    const width = this.width;
    const height = this.height;

    // Check all pixels: if it's an isolated checkerboard pixel (e.g. between cape and leg or armpit)
    // How to distinguish from white face/gloves?
    // White face is solid pure white (#ffffff) or very uniform.
    // Checkerboard alternates with light gray (#ebebeb, #e5e5e5, #e0e0e0) in an 8x8 or 16x16 grid.
    
    // Let's check for any enclosed background pockets (e.g., in armpit or between legs)
    // Find all connected components of unvisited candidate pixels with alpha > 0
    const visited = new Uint8Array(width * height);
    let innerCleared = 0;

    function isCheckerPixel(r, g, b, a) {
      if (a === 0) return false;
      const maxDiff = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b));
      const avg = (r + g + b) / 3;
      return maxDiff <= 20 && avg >= 180 && avg <= 255;
    }

    // Identify connected white/gray regions that contain both white and gray (i.e. checkerboard pattern)
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        if (visited[idx]) continue;
        const pIdx = idx << 2;
        const r = this.data[pIdx];
        const g = this.data[pIdx + 1];
        const b = this.data[pIdx + 2];
        const a = this.data[pIdx + 3];

        if (isCheckerPixel(r, g, b, a)) {
          // Explore this region
          const region = [];
          let hasGray = false;
          let hasWhite = false;
          const q = [x, y];
          visited[idx] = 1;

          let qHead = 0;
          while (qHead < q.length) {
            const cx = q[qHead++];
            const cy = q[qHead++];
            const cIndex = (cy * width + cx) << 2;
            const cr = this.data[cIndex];
            const cg = this.data[cIndex + 1];
            const cb = this.data[cIndex + 2];
            const cAvg = (cr + cg + cb) / 3;

            if (cAvg < 240) hasGray = true;
            if (cAvg > 248) hasWhite = true;

            region.push(cx, cy);

            const dx = [1, -1, 0, 0];
            const dy = [0, 0, 1, -1];
            for (let i = 0; i < 4; i++) {
              const nx = cx + dx[i];
              const ny = cy + dy[i];
              if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                const nIdx = ny * width + nx;
                if (!visited[nIdx]) {
                  const npIdx = nIdx << 2;
                  if (isCheckerPixel(this.data[npIdx], this.data[npIdx + 1], this.data[npIdx + 2], this.data[npIdx + 3])) {
                    visited[nIdx] = 1;
                    q.push(nx, ny);
                  }
                }
              }
            }
          }

          // If the region contains BOTH gray and white (the checkerboard pattern) and does NOT cover the cat's face (cat face is pure solid white):
          // Note: Cat face muzzle is solid pure white (r>250, g>250, b>250 without dark gray checker squares)
          if (hasGray && hasWhite && region.length < 50000) {
            console.log(`Found enclosed checkerboard pocket of size ${region.length / 2} pixels! Clearing...`);
            for (let i = 0; i < region.length; i += 2) {
              const px = region[i];
              const py = region[i + 1];
              const pIndex = (py * width + px) << 2;
              this.data[pIndex + 3] = 0;
              innerCleared++;
            }
          }
        }
      }
    }

    console.log(`Inner cleared: ${innerCleared} pixels.`);

    this.pack()
      .pipe(fs.createWriteStream(outputPath))
      .on("finish", () => {
        fs.copyFileSync(outputPath, "./assets/小橘拿柚子.png");
        fs.copyFileSync(outputPath, "./public/assets/小橘拿柚子.png");
        fs.copyFileSync(outputPath, "./public/orange_cat_pomelo.png");
        fs.copyFileSync(outputPath, "./public/小橘拿柚子.png");
        console.log("All files updated with cleaned transparent image!");
      });
  });
