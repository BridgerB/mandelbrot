import { error } from "@sveltejs/kit";

// Helper function to run a single command, for compilation
async function runCommand(cmd: string, args: string[]) {
  const command = new Deno.Command(cmd, { args });
  const { code, stderr } = await command.output();

  if (code !== 0) {
    const decoder = new TextDecoder();
    const errorMsg = `Error executing: ${cmd} ${args.join(" ")}
${decoder.decode(stderr)}`;
    console.error(errorMsg);
    throw new Error(errorMsg);
  }
}

// Helper to check if file exists
async function exists(filePath: string): Promise<boolean> {
  try {
    await Deno.stat(filePath);
    return true;
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      return false;
    }
    throw error;
  }
}

export async function GET() {
  const tmpDir = "./tmp"; // Still needed for the executable
  const cudaSrc = "./src/lib/server/cuda/mandelbrot.cu";
  const executable = `${tmpDir}/mandelbrot`;

  try {
    // 1. Ensure temp directory for executable exists
    await Deno.mkdir(tmpDir, { recursive: true });

    // 2. Compile the CUDA code if necessary
    const srcStat = await Deno.stat(cudaSrc);
    let exeStat: Deno.FileInfo | null = null;
    if (await exists(executable)) {
      exeStat = await Deno.stat(executable);
    }

    if (
      !exeStat ||
      !exeStat.mtime ||
      !srcStat.mtime ||
      srcStat.mtime > exeStat.mtime
    ) {
      console.log("Compiling CUDA code...");
      await runCommand("nvcc", ["-o", executable, cudaSrc, "-lcudart"]);
      console.log("Compilation finished.");
    }

    // 3. Spawn processes and pipe them together
    console.log("Generating and converting Mandelbrot set in memory...");

    const generator = new Deno.Command(executable, {
      stdout: "piped",
      stderr: "piped",
    }).spawn();

    const converter = new Deno.Command("convert", {
      args: ["ppm:-", "png:-"], // Read PPM from stdin, write PNG to stdout
      stdin: "piped",
      stdout: "piped",
      stderr: "piped",
    }).spawn();

    // Pipe generator's stdout to converter's stdin
    generator.stdout.pipeTo(converter.stdin);

    // Wait for processes to finish and check for errors
    const [genStatus, conStatus, pngData, genErr, conErr] = await Promise.all([
      generator.status,
      converter.status,
      new Response(converter.stdout).arrayBuffer(),
      generator.stderr.pipeTo(new WritableStream()), // Consume stderr
      converter.stderr.pipeTo(new WritableStream()),
    ]);

    if (!genStatus.success) {
      throw new Error("Mandelbrot generator process failed.");
    }
    if (!conStatus.success) {
      throw new Error("ImageMagick convert process failed.");
    }

    console.log("In-memory generation and conversion finished.");

    // 4. Return the final PNG data
    return new Response(pngData, {
      headers: {
        "Content-Type": "image/png",
      },
    });
  } catch (e: any) {
    console.error("Failed to generate Mandelbrot set:", e.message);
    throw error(
      500,
      "Failed to generate Mandelbrot set. Check server logs for details.",
    );
  }
}
