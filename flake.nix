{
  description = "A SvelteKit app with a CUDA-powered Mandelbrot generator";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
  };

  outputs = {
    self,
    nixpkgs,
  }: let
    system = "x86_64-linux";
    pkgs = import nixpkgs {
      inherit system;
      config = {
        allowUnfree = true;
        cudaSupport = true;
      };
    };
  in {
    devShells.x86_64-linux.default = pkgs.mkShell {
      buildInputs = with pkgs; [
        # Deno for SvelteKit
        deno

        # CUDA toolkit for compilation
        cudaPackages.cuda_nvcc
        cudaPackages.cuda_cudart

        # For image conversion
        imagemagick
      ];
    };
  };
}
