# Project: Mandelbrot Set Generator with CUDA

## Project Overview

This project is a web application that generates and displays a high-resolution (4096x4096) Mandelbrot set image. It uses a SvelteKit frontend and a custom SvelteKit API route for the backend.

The core of the project is a CUDA kernel that performs the computationally intensive Mandelbrot set calculation on a GPU, enabling fast generation. The backend orchestrates the process by compiling and running the CUDA code, and then converting the raw output into a PNG image in-memory before sending it to the client.

The development environment is managed by Nix, ensuring all necessary dependencies like the CUDA toolkit, Deno, and ImageMagick are available.

## Key Technologies & Architecture

*   **Frontend:** SvelteKit, Vite, TypeScript
*   **Backend:** SvelteKit API route running on the Deno runtime.
*   **GPU Computation:** A C++/CUDA kernel (`mandelbrot.cu`) calculates the Mandelbrot set.
*   **Image Processing:** ImageMagick (`convert` utility) is used for on-the-fly image format conversion.
*   **Environment Management:** Nix Flakes (`flake.nix`) define the development shell with all required dependencies.

### Workflow

1.  The Svelte frontend makes a request to the `/api/mandelbrot.png` endpoint.
2.  The API route (`+server.ts`) receives the request.
3.  It checks if the CUDA source (`mandelbrot.cu`) has been compiled. If not, or if the source file is newer, it compiles it with `nvcc` into an executable in the `./tmp` directory.
4.  The compiled executable is run. It computes the Mandelbrot set on the GPU and writes the raw image data in PPM format to its standard output.
5.  The standard output of the CUDA program is piped directly to the standard input of the ImageMagick `convert` command.
6.  `convert` transforms the PPM data into a PNG image, which it writes to its standard output.
7.  The API route streams this final PNG data back to the browser in the HTTP response.
8.  The Svelte frontend displays the received image.

## Building and Running

### 1. Environment Setup (Nix Users)

The recommended way to set up the development environment is by using Nix. This will automatically provide the correct versions of the CUDA toolkit, Deno, and ImageMagick.

```sh
# Enter the development shell
nix develop
```

### 2. Install Dependencies

Once the environment is set up, install the Node.js dependencies.

```sh
npm install
```

### 3. Running the Application

Start the development server. The CUDA code will be compiled automatically on the first API request.

```sh
# Run the SvelteKit development server
npm run dev

# Or to open in a browser automatically
npm run dev -- --open
```

### Other Scripts

*   **`npm run build`**: Creates a production build of the application.
*   **`npm run preview`**: Previews the production build.
*   **`npm run check`**: Runs Svelte's type checker.

## Development Conventions

*   **Backend Runtime:** The backend API routes are written in TypeScript and are intended to be run with the Deno runtime. This is evident from the use of `Deno.*` APIs in `src/routes/api/mandelbrot.png/+server.ts`.
*   **CUDA Code:** The CUDA kernel is a self-contained program that takes no arguments and writes the resulting image data to standard output.
*   **On-the-Fly Compilation:** The CUDA code is compiled just-in-time. The compiled executable is stored in the `tmp/` directory, which is appropriately git-ignored.
*   **In-Memory Piping:** The application avoids writing intermediate files to disk by piping the output of the generator process directly to the image converter.
*   **TypeScript:** The project uses TypeScript with strict settings for type safety.
