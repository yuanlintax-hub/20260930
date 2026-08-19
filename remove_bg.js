import fs from "fs";
import { PNG } from "pngjs";

const inputPath = "./src/assets/小橘拿柚子.png";
const outputPath = "./assets/orange_cat_pomelo.png";

fs.createReadStream(inputPath)
  .pipe(new PNG({ filterType: 4 }))
  .on("parsed", function () {
    console.log(`Image dimensions: ${this.width} x ${this.height}`);
    
    // Check border pixel colors
    const borderSamples = [];
    for (let x = 0; x < Math.min(10, this.width); x++) {
      const idx = (this.width * 0 + x) << 2;
      borderSamples.push(`(${this.data[idx]},${this.data[idx+1]},${this.data[idx+2]},${this.data[idx+3]})`);
    }
    console.log("Top border samples:", borderSamples.join(" "));

    const width = this.width;
    const height = this.height;
    const visited = new Uint8Array(width * height);
    const queue = [];

    // Helper: is this pixel a background checkerboard pixel?
    // Checkered background consists of near-white (#ffffff) and light gray (#ebebeb, #e5e5e5, #e0e0e0, #f0f0f0, #d9d9d9, etc.)
    // Note: The character has a strong solid black/dark outline or bright colors.
    function isBackgroundCandidate(r, g, b, a) {
      if (a === 0) return true;
      // Checkerboard pixels are gray/white: r ≈ g ≈ b and lightness > 180
      const maxDiff = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b));
      const avg = (r + g + b) / 3;
      // High brightness neutrals (checker pattern):
      return maxDiff <= 25 && avg >= 170;
    }

    // Push all border pixels that match background
    for (let x = 0; x < width; x++) {
      for (let y of [0, height - 1]) {
        const idx = y * width + x;
        const pIdx = idx << 2;
        if (isBackgroundCandidate(this.data[pIdx], this.data[pIdx+1], this.data[pIdx+2], this.data[pIdx+3])) {
          visited[idx] = 1;
          queue.push(x, y);
        }
      }
    }
    for (let y = 0; y < height; y++) {
      for (let x of [0, width - 1]) {
        const idx = y * width + x;
        const pIdx = idx << 2;
        if (!visited[idx] && isBackgroundCandidate(this.data[pIdx], this.data[pIdx+1], this.data[pIdx+2], this.data[pIdx+3])) {
          visited[idx] = 1;
          queue.push(x, y);
        }
      }
    }

    console.log(`Starting flood fill with ${queue.length / 2} seed pixels...`);

    // BFS Flood Fill from outside
    let head = 0;
    let clearedCount = 0;

    const dx = [1, -1, 0, 0, 1, -1, 1, -1];
    const dy = [0, 0, 1, -1, 1, 1, -1, -1];

    while (head < queue.length) {
      const cx = queue[head++];
      const cy = queue[head++];
      const cIdx = (cy * width + cx) << 2;

      // Make background pixel completely transparent
      this.data[cIdx + 3] = 0;
      clearedCount++;

      for (let i = 0; i < 8; i++) {
        const nx = cx + dx[i];
        const ny = cy + dy[i];
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          const nIndex = ny * width + nx;
          if (!visited[nIndex]) {
            const npIdx = nIndex << 2;
            const nr = this.data[npIdx];
            const ng = this.data[npIdx + 1];
            const nb = this.data[npIdx + 2];
            const na = this.data[npIdx + 3];

            if (isBackgroundCandidate(nr, ng, nb, na)) {
              visited[nIndex] = 1;
              queue.push(nx, ny);
            }
          }
        }
      }
    }

    console.log(`Cleared ${clearedCount} background pixels!`);

    // Also copy to all destination paths
    this.pack()
      .pipe(fs.createWriteStream(outputPath))
      .on("finish", () => {
        console.log(`Successfully saved transparent image to ${outputPath}`);
        fs.copyFileSync(outputPath, "./assets/小橘拿柚子.png");
        fs.copyFileSync(outputPath, "./public/assets/小橘拿柚子.png");
        fs.copyFileSync(outputPath, "./public/orange_cat_pomelo.png");
        fs.copyFileSync(outputPath, "./public/小橘拿柚子.png");
        console.log("All asset destinations updated!");
      });
  });
