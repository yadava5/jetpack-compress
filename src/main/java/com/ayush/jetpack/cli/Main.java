package com.ayush.jetpack.cli;

import com.ayush.jetpack.core.GzipDecompressor;
import com.ayush.jetpack.core.ParallelGzipCompressor;
import com.ayush.jetpack.io.MappedInput;
import com.ayush.jetpack.vector.VectorizedAdler32;

import java.io.BufferedInputStream;
import java.io.BufferedOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.zip.Deflater;

/**
 * Command-line entry point for jetpack-compress.
 *
 * <pre>
 *   jetpack compress   &lt;input&gt; [output] [-l LEVEL] [-b BLOCK_BYTES]
 *   jetpack decompress &lt;input&gt; [output]
 *   jetpack adler      &lt;input&gt;
 *   jetpack info
 * </pre>
 *
 * Must run with the incubating Vector module enabled:
 * {@code java --add-modules=jdk.incubator.vector -jar jetpack-compress.jar ...}
 */
public final class Main {

    private Main() {
    }

    public static void main(String[] args) {
        try {
            System.exit(run(args));
        } catch (IOException e) {
            System.err.println("error: " + e.getMessage());
            System.exit(1);
        }
    }

    private static int run(String[] args) throws IOException {
        if (args.length == 0 || isHelp(args[0])) {
            printUsage();
            return args.length == 0 ? 2 : 0;
        }
        return switch (args[0]) {
            case "compress" -> compress(args);
            case "decompress" -> decompress(args);
            case "adler" -> adler(args);
            case "info" -> info();
            default -> {
                System.err.println("unknown command: " + args[0]);
                printUsage();
                yield 2;
            }
        };
    }

    private static int compress(String[] args) throws IOException {
        int level = Deflater.DEFAULT_COMPRESSION;
        int blockSize = ParallelGzipCompressor.DEFAULT_BLOCK_SIZE;
        Path input = null;
        Path output = null;

        for (int i = 1; i < args.length; i++) {
            String a = args[i];
            switch (a) {
                case "-l", "--level" -> level = Integer.parseInt(args[++i]);
                case "-b", "--block" -> blockSize = Integer.parseInt(args[++i]);
                default -> {
                    if (input == null) {
                        input = Path.of(a);
                    } else if (output == null) {
                        output = Path.of(a);
                    } else {
                        System.err.println("unexpected argument: " + a);
                        return 2;
                    }
                }
            }
        }
        if (input == null) {
            System.err.println("compress: missing <input>");
            return 2;
        }
        if (output == null) {
            output = Path.of(input.toString() + ".gz");
        }

        long inSize = Files.size(input);
        long start = System.nanoTime();
        new ParallelGzipCompressor(level, blockSize).compressFile(input, output);
        long ms = (System.nanoTime() - start) / 1_000_000;
        long outSize = Files.size(output);

        double ratio = inSize == 0 ? 0.0 : (double) outSize / inSize;
        double mbps = ms == 0 ? Double.NaN : (inSize / 1e6) / (ms / 1000.0);
        System.out.printf(
                "compressed %s (%,d bytes) -> %s (%,d bytes)  ratio=%.3f  %d ms  %.1f MB/s%n",
                input, inSize, output, outSize, ratio, ms, mbps);
        return 0;
    }

    private static int decompress(String[] args) throws IOException {
        if (args.length < 2) {
            System.err.println("decompress: missing <input>");
            return 2;
        }
        Path input = Path.of(args[1]);
        Path output;
        if (args.length >= 3) {
            output = Path.of(args[2]);
        } else if (input.toString().endsWith(".gz")) {
            String s = input.toString();
            output = Path.of(s.substring(0, s.length() - 3));
        } else {
            output = Path.of(input.toString() + ".out");
        }

        long start = System.nanoTime();
        try (InputStream in = new BufferedInputStream(Files.newInputStream(input), 1 << 16);
             OutputStream out = new BufferedOutputStream(Files.newOutputStream(output), 1 << 16)) {
            GzipDecompressor.decompress(in, out);
        }
        long ms = (System.nanoTime() - start) / 1_000_000;
        System.out.printf("decompressed %s -> %s (%,d bytes)  %d ms%n",
                input, output, Files.size(output), ms);
        return 0;
    }

    private static int adler(String[] args) throws IOException {
        if (args.length < 2) {
            System.err.println("adler: missing <input>");
            return 2;
        }
        Path input = Path.of(args[1]);
        // Vectorized checksum read straight from the memory-mapped file (FFM + Vector API together).
        try (MappedInput mapped = MappedInput.open(input)) {
            int checksum = VectorizedAdler32.vector(mapped.segment(), 0L, mapped.size());
            System.out.printf("adler32(vector) %08x  %s  (%,d bytes, %d-byte SIMD stride)%n",
                    checksum, input, mapped.size(), VectorizedAdler32.strideBytes());
        }
        return 0;
    }

    private static int info() {
        System.out.printf("jetpack-compress%n");
        System.out.printf("  java.version         = %s%n", System.getProperty("java.version"));
        System.out.printf("  availableProcessors  = %d%n", Runtime.getRuntime().availableProcessors());
        System.out.printf("  vector SIMD stride   = %d bytes%n", VectorizedAdler32.strideBytes());
        System.out.printf("  default block size   = %d bytes%n", ParallelGzipCompressor.DEFAULT_BLOCK_SIZE);
        return 0;
    }

    private static boolean isHelp(String a) {
        return a.equals("-h") || a.equals("--help") || a.equals("help");
    }

    private static void printUsage() {
        System.out.print("""
                jetpack-compress -- parallel, gzip-compatible compression (JDK 25)

                usage:
                  jetpack compress   <input> [output] [-l LEVEL(0-9)] [-b BLOCK_BYTES]
                  jetpack decompress <input> [output]
                  jetpack adler      <input>
                  jetpack info

                run with:
                  java --add-modules=jdk.incubator.vector -jar jetpack-compress.jar <command> ...
                """);
    }
}
