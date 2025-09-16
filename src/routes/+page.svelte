<script lang="ts">
    let imageUrl: string | null = null;
    let loading = false;
    let error: string | null = null;

    async function generateMandelbrot() {
        loading = true;
        error = null;
        imageUrl = null;

        try {
            // Use a timestamp to prevent browser caching
            const url = `/api/mandelbrot.png?t=${new Date().getTime()}`;
            const response = await fetch(url);

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || `Error: ${response.status} ${response.statusText}`);
            }

            const blob = await response.blob();
            imageUrl = URL.createObjectURL(blob);

        } catch (e: any) {
            console.error(e);
            error = e.message;
        } finally {
            loading = false;
        }
    }
</script>

<svelte:head>
    <title>CUDA Mandelbrot Set</title>
</svelte:head>

<main>
    <h1>CUDA-Powered Mandelbrot Set</h1>
    <p>Click the button to generate a 4096x4096 Mandelbrot set using a CUDA kernel.</p>
    <p>The backend API streams the data between the CUDA program and an ImageMagick converter, all in memory.</p>

    <div class="controls">
        <button on:click={generateMandelbrot} disabled={loading}>
            {#if loading}
                Generating...
            {:else}
                Generate Mandelbrot Set
            {/if}
        </button>
    </div>

    {#if loading}
        <div class="placeholder">
            <p>Loading... this may take a few seconds.</p>
            <p>The CUDA code is compiled on the first run.</p>
        </div>
    {/if}

    {#if error}
        <div class="error">
            <h2>Error</h2>
            <pre>{error}</pre>
        </div>
    {/if}

    {#if imageUrl}
        <div class="image-container">
            <img src={imageUrl} alt="Mandelbrot Set" />
        </div>
    {/if}
</main>

<style>
    main {
        font-family: sans-serif;
        text-align: center;
        max-width: 1200px;
        margin: 2rem auto;
    }
    .controls {
        margin: 2rem 0;
    }
    button {
        font-size: 1.2rem;
        padding: 0.8rem 1.5rem;
        border-radius: 8px;
        border: 1px solid #ccc;
        background-color: #f0f0f0;
        cursor: pointer;
        transition: background-color 0.2s;
    }
    button:hover {
        background-color: #e0e0e0;
    }
    button:disabled {
        cursor: not-allowed;
        opacity: 0.6;
    }
    .placeholder, .error {
        border: 2px dashed #ccc;
        padding: 4rem;
        margin-top: 2rem;
        border-radius: 8px;
    }
    .error {
        border-color: #ff8a8a;
        background-color: #fff5f5;
        color: #c53030;
        text-align: left;
        white-space: pre-wrap;
    }
    .image-container {
        margin-top: 2rem;
    }
    img {
        max-width: 100%;
        height: auto;
        border: 1px solid #eee;
        border-radius: 8px;
    }
</style>