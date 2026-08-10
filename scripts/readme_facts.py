#!/usr/bin/env python3
"""Verify — and repair — every number this project asserts about itself.

WHY THIS EXISTS

This repository's whole pitch is that its numbers terminate in something you
can open. The README says so in as many words: "Every number on this page
terminates in a file you can open or a command you can run." That promise is
only as good as the last person who edited a sentence, and a prose document has
no mechanism that makes a stale figure *fail*.

The specific hazard here is not staleness, it is CONTAMINATION. Two JMH runs
are committed side by side:

    benchmarks/jmh-results-rigorous.json   3 forks   422.0 MB/s   6.378x
    benchmarks/jmh-results.json            1 fork    454.9 MB/s   6.892x

Both are real. Only one is quoted in the table, on purpose — the slower,
tighter one. The two pairs are close enough to look like typos of each other
and far enough apart to matter, so a well-meaning edit that "corrects" 422 to
455, or 2.80x to 2.9x, produces a document that is internally consistent,
sourced to a committed artifact, and wrong. There is no way to catch that by
reading. There is a very easy way to catch it by dividing two numbers in a
file, which is what this script does.

THE DESIGN, AND WHY IT IS NOT MARKERS

The obvious approach is to fence each number in an HTML comment and regenerate
it. That fails here: the counts appear inside a mermaid diagram, where an HTML
comment is a syntax error, and inside a TypeScript module the web app imports,
where an HTML comment is not a comment at all.

Instead each fact declares the SITES where it is asserted, as regexes that
capture the digits. The checker recomputes the fact and compares.

The load-bearing rule is this:

    A SITE REGEX THAT MATCHES ZERO TIMES IS A FAILURE.

Not a skip. A failure. If a claim is reworded so its regex no longer matches,
the fact has escaped its check and the file has silently stopped being
verified. A checker that quietly passes when it can no longer find what it was
checking is not a checker.

CROSS-FILE SITES ARE THE POINT, NOT A BONUS

`web/src/data/facts.ts` is the deployed landing page's single source of truth,
and it restates most of this README. Its own header comment currently claims
its throughput figures come from "the quick JMH run" while the values in it are
the rigorous ones — a comment that, taken at its word, instructs the next
editor to paste the retired pair back in. A number repeated in a second file is
a number that gets corrected in one file and not the other, so facts.ts and
benchmarks/ENVIRONMENT.md are checked as first-class site files.

TWO CLASSES OF FACT

  static   — recomputable cheaply, offline, with no build:

             * from source — `DEFAULT_BLOCK_SIZE`, the `LEVELS[]` array in
               RoundTripTest, `<maven.compiler.release>`, the coverage floor
               in ci.yml.

             * from a COMMITTED RUN ARTIFACT — benchmarks/jmh-results*.json are
               records of runs that already happened, are in git, and are the
               files the README cites by name. Reading them costs a JSON parse,
               so every throughput, ratio and error bar is RECOMPUTED from the
               raw scores on every run rather than trusted. They are
               deliberately NOT copied into docs/readme-facts.json: duplicating
               a committed artifact into a second committed file just creates a
               second place for the same number to drift.

  recorded — require executing something that is not in git: `mvn verify`,
             whose surefire XML and JaCoCo XML both land under target/, which
             is gitignored. Read from docs/readme-facts.json, which carries
             each value, the command behind it, the date and the machine.

THE BENCHMARKS ARE NEVER RE-RUN BY THIS SCRIPT

`--record` runs the suite and the coverage pass. It does NOT run JMH, and there
is no flag to make it. benchmarks/ENVIRONMENT.md pins the measurement to
OpenJDK 25.0.3 (Homebrew) on an M1 Pro and says plainly that a different JDK or
SIMD width "yields a different ratio; that is a different measurement, not a
correction". Throughput is a property of a machine. A number produced here on
some other JDK would overwrite a carefully-scoped artifact with an unscoped
one, look like a fix, and be a regression. CI does not benchmark either, for
the same reason.

WHAT THIS SCRIPT DELIBERATELY DOES NOT ASSERT

Whether the suite passed. `--record` writes the pass/fail/skip breakdown into
`suiteOutcome`, and nothing reads it back. A green artifact must never be
mistakable for a green suite: --record keeps the counts from a failing run on
purpose, so without that block a red run and a clean one would leave identical
files behind. Asserting "Failures: 0" is CI's job — `ci.yml`'s "Summarise the
suite" step already does it, against the run that just happened, which is the
only place the assertion means anything.

WHY PYTHON

This is a Maven project with a Vite SPA beside it; neither is a natural home
for a repo-wide script, and adding a Node dependency to check the Java README
would be backwards. `ci.yml` already inlines python3 twice, for exactly this
kind of XML-reading work. python3 ships on every GitHub runner. Stdlib only:
no pip install, so the CI job is a checkout and one command.

USAGE
  python3 scripts/readme_facts.py            # --check: verify, exit 1 on drift
  python3 scripts/readme_facts.py --write    # rewrite the numbers in place
  python3 scripts/readme_facts.py --record   # mvn verify, refresh the artifact
"""

from __future__ import annotations

import glob
import json
import math
import os
import platform
import re
import subprocess
import sys
import xml.etree.ElementTree as ET
from datetime import date
from decimal import Decimal, ROUND_HALF_UP

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ARTIFACT = os.path.join(REPO, "docs", "readme-facts.json")
ARTIFACT_REL = "docs/readme-facts.json"

README = "README.md"
FACTS_TS = "web/src/data/facts.ts"
ENVIRONMENT_MD = "benchmarks/ENVIRONMENT.md"

RIGOROUS = "benchmarks/jmh-results-rigorous.json"
QUICK = "benchmarks/jmh-results.json"


# ── helpers ──────────────────────────────────────────────────────────────


def read(rel):
    with open(os.path.join(REPO, rel), encoding="utf-8") as fh:
        return fh.read()


def die(msg):
    sys.stderr.write(f"\n  x {msg}\n\n")
    sys.exit(1)


def read_json(rel):
    try:
        with open(os.path.join(REPO, rel), encoding="utf-8") as fh:
            return json.load(fh)
    except FileNotFoundError:
        die(f"{rel} is missing. It is a committed artifact the README cites by name.")
    except json.JSONDecodeError as exc:
        die(f"{rel} is not valid JSON ({exc}).")


def grep1(rel, pattern):
    """The single capture of `pattern` in `rel`, or a loud failure.

    Every ground-truth lookup goes through here rather than a bare
    `re.search(...).group(1)`. A renamed constant should name itself and its
    file, not raise AttributeError on None from inside a lambda.
    """
    m = re.search(pattern, read(rel), re.MULTILINE)
    if not m:
        die(f"{rel}: /{pattern}/ matched nothing.\n"
            f"      This is the SOURCE of a documented claim, not a site. The constant\n"
            f"      it reads was renamed or moved, so the claim has no ground truth left.")
    return m.group(1)


CARDINALS = [
    "zero", "one", "two", "three", "four", "five", "six", "seven", "eight",
    "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen",
    "sixteen", "seventeen", "eighteen", "nineteen", "twenty",
]
ORDINALS = [
    "zeroth", "first", "second", "third", "fourth", "fifth", "sixth",
    "seventh", "eighth", "ninth", "tenth",
]


def to_word(n, ordinal=False):
    table = ORDINALS if ordinal else CARDINALS
    i = int(round(float(n)))
    return table[i] if 0 <= i < len(table) else str(n)


def round_half_up(value, decimals):
    """Round the way a person writing a README rounds.

    Python's round() is banker's rounding and float formatting inherits the
    binary representation, so f"{86.05:.1f}" is "86.0". Documents round half
    up. Getting this backwards produces a checker that demands you make a
    correct document incorrect.
    """
    q = Decimal(1).scaleb(-decimals) if decimals else Decimal(1)
    return Decimal(str(float(value))).quantize(q, rounding=ROUND_HALF_UP)


def sci(value, mantissa_dp=3):
    """JMH scores the way the README's Score column prints them: `4.220e8`.

    Not `%e` -- that pads the exponent and emits a sign (`4.220e+08`). The
    trailing zero in `4.220` is significant to the claim and is kept.
    """
    value = float(value)
    exp = int(math.floor(math.log10(abs(value))))
    m = round_half_up(value / (10 ** exp), mantissa_dp)
    if m >= 10:  # 9.9996e8 rounds to 10.000e8; renormalise
        m, exp = m / 10, exp + 1
    return f"{m:.{mantissa_dp}f}e{exp}"


def fmt(value, decimals=None, commas=False, word=False, ordinal=False,
        scientific=False):
    """Render a fact the way a site expects to see it.

    Comparison is always between FORMATTED STRINGS, never between floats.
    Every figure here has its own precision -- 2.8x in prose and 2.80x in the
    table, 6.4x here and 6.38x there, 68.1%, 4.220e8 -- and float equality has
    nothing useful to say about any of them. Precision is therefore a property
    of the SITE, not only of the fact.
    """
    if word or ordinal:
        return to_word(value, ordinal=ordinal)
    if scientific:
        return sci(value)
    if decimals is None:
        n = int(round_half_up(value, 0))
        return f"{n:,}" if commas else str(n)
    return f"{round_half_up(value, decimals):.{decimals}f}"


def site(pattern, file=README, decimals="inherit", word=False, ordinal=False,
         commas="auto", scientific=False):
    """One place a fact is asserted.

    `pattern` MUST contain exactly one capture group, around the number. That
    is enforced at startup rather than trusted: a second group silently shifts
    which digits get compared, which fails as a checker without failing as a
    program.
    """
    return {"pattern": pattern, "file": file, "decimals": decimals,
            "word": word, "ordinal": ordinal, "commas": commas,
            "scientific": scientific}


FACTS = {}


def add(fid, describe, kind, sites, compute=None, decimals=None,
        scientific=False):
    FACTS[fid] = {"describe": describe, "kind": kind, "sites": sites,
                  "compute": compute, "decimals": decimals,
                  "scientific": scientific}


# ── the committed JMH artifacts ──────────────────────────────────────────
#
# Everything in the Benchmarks table is derived from these two files at check
# time. Nothing in the table is typed into this script, which is what makes it
# impossible to "correct" the rigorous figures into the quick ones without the
# arithmetic disagreeing.

_jmh_cache = {}


def jmh(rel):
    if rel not in _jmh_cache:
        data = read_json(rel)
        by_name = {}
        for b in data:
            by_name[b["benchmark"].rsplit(".", 1)[-1]] = b
        for needed in ("scalar", "vector", "jdkIntrinsic",
                       "singleThreadedJdk", "parallelVirtualThreads"):
            if needed not in by_name:
                die(f"{rel}: no benchmark named {needed!r}. The table this file "
                    f"backs cannot be checked against a run that did not measure it.")
        _jmh_cache[rel] = by_name
    return _jmh_cache[rel]


def score(rel, name):
    return jmh(rel)[name]["primaryMetric"]["score"]


def score_error(rel, name):
    return jmh(rel)[name]["primaryMetric"]["scoreError"]


def ci_pct(rel, name):
    return 100.0 * score_error(rel, name) / score(rel, name)


def run_field(rel, key):
    """A JMH run-configuration field, asserted to be uniform across benchmarks.

    A JSON that mixes fork counts is not "a 3-fork run" and the sentence
    describing it as one is wrong, so this refuses to pick the first value.
    """
    values = {b[key] for b in jmh(rel).values()}
    if len(values) != 1:
        die(f"{rel}: benchmarks disagree about {key} ({sorted(values)}). "
            f"The prose describing this as a single run configuration is wrong.")
    return values.pop()


# ── source-derived computations ──────────────────────────────────────────


def java_int_array_len(rel, name):
    body = grep1(rel, r"int\[\]\s+" + name + r"\s*=\s*\{([^}]*)\}")
    return len([x for x in body.split(",") if x.strip()])


def java_int_array_min(rel, name):
    body = grep1(rel, r"int\[\]\s+" + name + r"\s*=\s*\{([^}]*)\}")
    vals = []
    for raw in body.split(","):
        raw = raw.strip()
        m = re.fullmatch(r"(\d+)\s*<<\s*(\d+)", raw)
        if m:
            vals.append(int(m.group(1)) << int(m.group(2)))
        elif re.fullmatch(r"-?\d+", raw):
            vals.append(int(raw))
    return min(v for v in vals if v > 0)


def default_block_size():
    shift = grep1("src/main/java/com/ayush/jetpack/core/ParallelGzipCompressor.java",
                  r"DEFAULT_BLOCK_SIZE\s*=\s*1\s*<<\s*(\d+)")
    return 1 << int(shift)


def bench_bytes(rel, const):
    a, b, c = re.search(r"" + const + r"\s*=\s*(\d+)\s*\*\s*(\d+)\s*\*\s*(\d+)",
                        read(rel)).groups()
    return int(a) * int(b) * int(c)


def env_field(pattern):
    m = re.search(pattern, read(ENVIRONMENT_MD))
    if not m:
        die(f"{ENVIRONMENT_MD}: /{pattern}/ matched nothing. The machine table "
            f"the README's 'Reference machine' bullet list mirrors has changed shape.")
    return m.group(1)


# ── the facts ────────────────────────────────────────────────────────────

# -- the benchmark table: Score column, recomputed from the rigorous JSON --

# Per row: (JMH method, README table-row prefix, unit, divisor, README decimals,
#           facts.ts bar id, facts.ts key, facts.ts decimals).
#
# The facts.ts columns are not decoration. That module is what the DEPLOYED page
# draws its bars from, and it prints some of these to fewer places than the
# README does -- `gbps: 14.1` against the README's `14.06 GB/s`. Checking only
# the README would leave the six numbers a visitor actually sees unverified,
# which is exactly where a "correction" to the retired 455 / 4.38 pair would
# land: in the file nobody re-reads because it looks like config.
BENCH_TABLE = [
    ("scalar", r"`Adler32\.scalar` \(pure Java\)", "GB", 1e9, 2, "scalar", "gbps", 2),
    ("vector", r"`Adler32\.vector` \(Vector API\)", "GB", 1e9, 2, "vector", "gbps", 2),
    ("jdkIntrinsic", r"`Adler32\.jdkIntrinsic` \(`java\.util\.zip\.Adler32`\)", "GB", 1e9, 2,
     "intrinsic", "gbps", 1),
    ("singleThreadedJdk", r"`Compression\.singleThreadedJdk` \(level 6\)", "MB", 1e6, 1,
     "single", "mbps", 1),
    ("parallelVirtualThreads", r"`Compression\.parallelVirtualThreads` \(level 6\)", "MB", 1e6, 1,
     "parallel", "mbps", 1),
]

for _name, _row, _unit, _div, _dp, _bar, _key, _ts_dp in BENCH_TABLE:
    _head = r"\| " + _row + r" \| "
    add(f"score_{_name}",
        f"the {_name} score in {RIGOROUS}",
        "static",
        [site(_head + r"([\d.]+e\d+) B/s")],
        (lambda n=_name: score(RIGOROUS, n)), scientific=True)

    add(f"throughput_{_name}",
        f"the {_name} throughput ({_unit}/s) from {RIGOROUS}",
        "static",
        [site(_head + r"[\d.]+e\d+ B/s \| \*\*([\d.]+) " + _unit + r"/s\*\*"),
         site(r"id: '" + _bar + r"',[\s\S]{0,220}?" + _key + r": ([\d.]+),",
              file=FACTS_TS, decimals=_ts_dp)],
        (lambda n=_name, d=_div: score(RIGOROUS, n) / d), decimals=_dp)

# -- the two ratios that are the entire point of the project --------------
#
# Both are RECOMPUTED from the raw rigorous scores. If someone pastes the
# retired quick-run pair (455 MB/s, 6.89x, 2.9x, 4.38 GB/s) into any of these
# sites, the division disagrees and --check names the line.

add("vectorOverScalar",
    "Adler32.vector / Adler32.scalar in the rigorous JMH run",
    "static",
    [site(r"\*\*([\d.]+)x faster\s+than the equivalent scalar Java\*\*", decimals=1),
     site(r"\*\*([\d.]+)x over scalar\*\*", decimals=2),
     site(r"\*vector vs scalar Java\* \(([\d.]+)x\)", decimals=1),
     site(r"the ([\d.]+)× SIMD result", decimals=2),
     site(r"on the measured \*\*([\d.]+)×\*\*", decimals=1),
     site(r"the ([\d.]+)× and [\d.]+× figures", decimals=2),
     site(r"([\d.]+)x vector over scalar Java", decimals=2),
     site(r"label: 'Adler32\.vector',[\s\S]{0,200}?mult: ([\d.]+),",
          file=FACTS_TS, decimals=1),
     site(r"headline: '([\d.]+)×',\s*\n\s*headlineSub: 'vector over scalar",
          file=FACTS_TS, decimals=1)],
    lambda: score(RIGOROUS, "vector") / score(RIGOROUS, "scalar"))

add("parallelOverSingle",
    "parallelVirtualThreads / singleThreadedJdk in the rigorous JMH run",
    "static",
    [site(r"\*\*([\d.]+)x over single-thread\*\*", decimals=1),
     site(r"the ([\d.]+)× parallel result", decimals=1),
     site(r"the [\d.]+× and ([\d.]+)× figures", decimals=1),
     site(r"\*\*([\d.]+)x parallel over single-thread", decimals=1),
     site(r"\([\d.]+x against ([\d.]+)x on the same code\)", decimals=2),
     site(r"label: 'parallelVirtualThreads',[\s\S]{0,220}?mult: ([\d.]+),",
          file=FACTS_TS, decimals=1),
     site(r"headline: '([\d.]+)×',\s*\n\s*headlineSub: 'parallel over single-thread",
          file=FACTS_TS, decimals=1)],
    lambda: score(RIGOROUS, "parallelVirtualThreads")
    / score(RIGOROUS, "singleThreadedJdk"))

add("jdkIntrinsicOverScalar",
    "Adler32.jdkIntrinsic / Adler32.scalar in the rigorous JMH run",
    "static",
    [site(r"label: 'Adler32\.jdkIntrinsic',[\s\S]{0,200}?mult: ([\d.]+),",
          file=FACTS_TS, decimals=1)],
    lambda: score(RIGOROUS, "jdkIntrinsic") / score(RIGOROUS, "scalar"))

# -- the quick run, quoted on purpose as the one NOT in the table ---------

add("quickParallelThroughput",
    f"the parallelVirtualThreads throughput in {QUICK} (the retired 1-fork run)",
    "static",
    [site(r"reads higher on the parallel figure \(([\d.]+) MB/s")],
    lambda: score(QUICK, "parallelVirtualThreads") / 1e6, decimals=1)

add("quickParallelOverSingle",
    f"parallel / single-thread in {QUICK} (the retired 1-fork run)",
    "static",
    [site(r"reads higher on the parallel figure \([\d.]+ MB/s, ([\d.]+)x\)"),
     site(r"\(([\d.]+)x against [\d.]+x on the same code\)")],
    lambda: score(QUICK, "parallelVirtualThreads") / score(QUICK, "singleThreadedJdk"),
    decimals=2)

# -- error bars -----------------------------------------------------------

add("parallelCiPct",
    "the 99.9% CI half-width on parallelVirtualThreads, as a percentage of score",
    "static",
    [site(r"99\.9% CI ±([\d.]+)%\)", decimals=1),
     site(r"a ±([\d.]+)% error whisker", decimals=1),
     site(r"= ([\d.]+)%; the quick run's own whisker", decimals=2),
     site(r"99\.9% CI ±([\d.]+)%'", file=FACTS_TS, decimals=1),
     site(r"errorPct: ([\d.]+),", file=FACTS_TS, decimals=0)],
    lambda: ci_pct(RIGOROUS, "parallelVirtualThreads"))

add("parallelScoreErrorMb",
    "the parallelVirtualThreads 99.9% CI half-width in MB/s",
    "static",
    [site(r"whisker on the rigorous-run parallel number \(([\d.]+) /")],
    lambda: score_error(RIGOROUS, "parallelVirtualThreads") / 1e6, decimals=1)

add("quickParallelCiPct",
    f"the 99.9% CI half-width on parallelVirtualThreads in {QUICK}",
    "static",
    [site(r"quick run's own whisker is ([\d.]+)% on a different score")],
    lambda: ci_pct(QUICK, "parallelVirtualThreads"), decimals=2)

add("singleCiPct",
    "the 99.9% CI half-width on singleThreadedJdk, rigorous run",
    "static",
    [site(r"span ±([\d.]+)% \(single-threaded\)", file=FACTS_TS, decimals=1)],
    lambda: ci_pct(RIGOROUS, "singleThreadedJdk"))

add("vectorCiPct",
    "the 99.9% CI half-width on Adler32.vector, rigorous run",
    "static",
    [site(r"to ±([\d.]+)% \(the vectorised checksum\)", file=FACTS_TS, decimals=1),
     site(r"the rigorous run pulls\s+those to ±[\d.]+%, ±([\d.]+)% and ±[\d.]+%\.",
          file=ENVIRONMENT_MD, decimals=1)],
    lambda: ci_pct(RIGOROUS, "vector"))

add("jdkIntrinsicCiPct",
    "the 99.9% CI half-width on Adler32.jdkIntrinsic, rigorous run",
    "static",
    [site(r"those to ±([\d.]+)%, ±[\d.]+% and ±[\d.]+%\.", file=ENVIRONMENT_MD,
          decimals=1)],
    lambda: ci_pct(RIGOROUS, "jdkIntrinsic"))

add("scalarCiPct",
    "the 99.9% CI half-width on Adler32.scalar, rigorous run",
    "static",
    [site(r"those to ±[\d.]+%, ±[\d.]+% and ±([\d.]+)%\.", file=ENVIRONMENT_MD,
          decimals=1)],
    lambda: ci_pct(RIGOROUS, "scalar"))

for _fid, _name, _pat in [
    ("quickJdkIntrinsicCiPct", "jdkIntrinsic",
     r"reaches ±([\d.]+)% \(`jdkIntrinsic`\)"),
    ("quickVectorCiPct", "vector", r"±([\d.]+)% \(`vector`\) and"),
    ("quickScalarCiPct", "scalar", r"and ±([\d.]+)% \(`scalar`\)"),
]:
    add(_fid, f"the 99.9% CI half-width on Adler32.{_name} in {QUICK}", "static",
        [site(_pat, file=ENVIRONMENT_MD, decimals=1)],
        (lambda n=_name: ci_pct(QUICK, n)))

# -- run configuration ----------------------------------------------------

add("rigorousForks",
    f"the fork count recorded in {RIGOROUS}",
    "static",
    [site(r"\*\*rigorous run\*\* — (\d+) forks"),
     site(r"(\d+) JMH forks, \d+ warmup \+ \d+ measurement iterations",
          file=FACTS_TS)],
    lambda: run_field(RIGOROUS, "forks"))

add("quickForks",
    f"the fork count recorded in {QUICK}",
    "static",
    [site(r"The quick (\d+)-fork run is committed beside it"),
     site(r"the (\d+)-fork run, committed \*beside\*")],
    lambda: run_field(QUICK, "forks"))

add("rigorousWarmupIterations",
    f"warmupIterations recorded in {RIGOROUS}",
    "static",
    [site(r"forks, (\d+)x2 s warmup"),
     site(r"\d+ JMH forks, (\d+) warmup \+ \d+ measurement iterations", file=FACTS_TS)],
    lambda: run_field(RIGOROUS, "warmupIterations"))

add("rigorousMeasurementIterations",
    f"measurementIterations recorded in {RIGOROUS}",
    "static",
    [site(r"s warmup, (\d+)x2 s measurement"),
     site(r"\d+ JMH forks, \d+ warmup \+ (\d+) measurement iterations", file=FACTS_TS)],
    lambda: run_field(RIGOROUS, "measurementIterations"))

add("jmhVersion",
    "the jmh.version property in pom.xml",
    "static",
    [site(r"JMH ([\d.]+), throughput mode"),
     site(r"harness: 'JMH ([\d.]+) · throughput mode", file=FACTS_TS),
     site(r"\| JMH \| ([\d.]+) \(", file=ENVIRONMENT_MD)],
    lambda: grep1("pom.xml", r"<jmh\.version>([\d.]+)</jmh\.version>"))

add("benchmarkJdkVersion",
    f"the jdkVersion recorded inside {RIGOROUS}",
    "static",
    [site(r"OpenJDK \*\*([\d.]+)\*\* \(Homebrew\)"),
     site(r"OpenJDK ([\d.]+) \(Homebrew\), plus an explicit list"),
     site(r"jvm: 'OpenJDK ([\d.]+) \(Homebrew\)'", file=FACTS_TS),
     site(r"re-run under OpenJDK ([\d.]+)\)", file=FACTS_TS),
     site(r"\| JDK \| \*\*OpenJDK ([\d.]+)\*\* \(Homebrew\)", file=ENVIRONMENT_MD)],
    lambda: run_field(RIGOROUS, "jdkVersion"))

# -- the machine, sourced from benchmarks/ENVIRONMENT.md ------------------

add("cores",
    "physical cores, per benchmarks/ENVIRONMENT.md",
    "static",
    [site(r"Apple Silicon \(arm64\), (\d+) cores"),
     site(r"\((\d+) cores; 99\.9% CI"),
     site(r"M1 Pro, (\d+) cores \(\dP \+ \dE\)"),
     site(r"· (\d+) cores · 128-bit SIMD", file=FACTS_TS),
     site(r"cores: (\d+), // Apple M1 Pro", file=FACTS_TS),
     site(r"block-parallel, level 6, (\d+) cores", file=FACTS_TS)],
    lambda: int(env_field(r"\| Cores \| (\d+) logical")))

add("coresIdle",
    "cores left idle by a single-threaded DEFLATE loop (cores - 1)",
    "static",
    [site(r"idle: (\d+),", file=FACTS_TS)],
    lambda: int(env_field(r"\| Cores \| (\d+) logical")) - 1)

add("simdBits",
    "SIMD width in bits, per benchmarks/ENVIRONMENT.md",
    "static",
    [site(r"\*\*(\d+)-bit SIMD \(16-byte stride, NEON\)\*\*"),
     site(r"On a (\d+)-bit-SIMD machine the Vector API"),
     site(r"· (\d+)-bit SIMD, 16-byte NEON stride", file=FACTS_TS)],
    lambda: int(env_field(r"\| SIMD \| (\d+)-bit NEON")))

add("simdStrideBytes",
    "SIMD stride in bytes, per benchmarks/ENVIRONMENT.md",
    "static",
    [site(r"128-bit SIMD \((\d+)-byte stride, NEON\)"),
     site(r"jdk\.incubator\.vector · (\d+)-byte NEON stride"),
     site(r"vectorized Adler-32 \((\d+)-byte NEON stride\)"),
     site(r"128-bit SIMD, (\d+)-byte NEON stride", file=FACTS_TS),
     site(r"(\d+)-byte SIMD stride", file=FACTS_TS)],
    lambda: int(env_field(r"\*\*(\d+)-byte stride\*\*")))

# -- source constants -----------------------------------------------------

add("jdkRelease",
    "maven.compiler.release in pom.xml",
    "static",
    [site(r'alt="JDK (\d+)"'),
     site(r"badge/JDK-(\d+)-orange"),
     site(r"## JDK (\d+) features used"),
     site(r"Requires \*\*JDK (\d+)\*\* and Maven"),
     site(r"Compile and test on JDK (\d+)", file=".github/workflows/ci.yml"),
     site(r"jdk: 'JDK (\d+)'", file=FACTS_TS),
     site(r"/\*\* JDK (\d+) platform features", file=FACTS_TS)],
    lambda: grep1("pom.xml",
                  r"<maven\.compiler\.release>(\d+)</maven\.compiler\.release>"))

add("defaultBlockSizeBytes",
    "ParallelGzipCompressor.DEFAULT_BLOCK_SIZE",
    "static",
    [site(r"-b (\d+)")],
    default_block_size)

add("defaultBlockSizeMiB",
    "ParallelGzipCompressor.DEFAULT_BLOCK_SIZE in MiB",
    "static",
    [site(r"fixed-size blocks, default (\d+) MiB"),
     site(r"split into fixed-size blocks \(default (\d+) MiB\)")],
    lambda: default_block_size() // (1 << 20))

add("fuzzTrials",
    "randomized trials in Adler32Test",
    "static",
    [site(r"and (\d+) randomized fuzz trials"),
     site(r"and (\d+) randomized fuzz trials", file=FACTS_TS)],
    lambda: int(grep1("src/test/java/com/ayush/jetpack/Adler32Test.java",
                      r"trial < (\d+); trial\+\+")))

add("roundTripLevels",
    "entries in RoundTripTest.LEVELS",
    "static",
    [site(r"times (\w+)\s+compression levels", word=True),
     site(r"× (\d+) levels ×", file=FACTS_TS)],
    lambda: java_int_array_len("src/test/java/com/ayush/jetpack/RoundTripTest.java",
                               "LEVELS"))

add("roundTripBlockSizes",
    "entries in RoundTripTest.BLOCK_SIZES",
    "static",
    [site(r"times (\w+) block sizes", word=True),
     site(r"× \d+ levels × (\d+) block sizes", file=FACTS_TS)],
    lambda: java_int_array_len("src/test/java/com/ayush/jetpack/RoundTripTest.java",
                               "BLOCK_SIZES"))

add("roundTripSmallestBlock",
    "the smallest entry in RoundTripTest.BLOCK_SIZES",
    "static",
    [site(r"including (\d+)-byte blocks that force many parallel")],
    lambda: java_int_array_min("src/test/java/com/ayush/jetpack/RoundTripTest.java",
                               "BLOCK_SIZES"))

add("adlerBufferMiB",
    "Adler32Benchmark.BUFFER_BYTES in MiB",
    "static",
    [site(r"buffer: '(\d+) MiB random buffer'", file=FACTS_TS)],
    lambda: bench_bytes("src/jmh/java/com/ayush/jetpack/bench/Adler32Benchmark.java",
                        "BUFFER_BYTES") // (1 << 20))

add("compressionCorpusMiB",
    "CompressionBenchmark.CORPUS_BYTES in MiB",
    "static",
    [site(r"corpus: '(\d+) MiB mixed corpus", file=FACTS_TS)],
    lambda: bench_bytes("src/jmh/java/com/ayush/jetpack/bench/CompressionBenchmark.java",
                        "CORPUS_BYTES") // (1 << 20))

add("coverageFloor",
    "the FLOOR constant in .github/workflows/ci.yml",
    "static",
    [site(r"fails below a (\d+)% floor"),
     site(r"exits non-zero below a \*\*(\d+)%\*\* floor")],
    lambda: int(float(grep1(".github/workflows/ci.yml", r"FLOOR = ([\d.]+)"))))

# -- recorded: the suite --------------------------------------------------

add("testsTotal",
    "tests in target/surefire-reports/*.xml",
    "recorded",
    [site(r'alt="Tests: (\d+) passing"'),
     site(r"badge/tests-(\d+)%20passing"),
     site(r"all \*\*(\d+) tests pass\*\*"),
     site(r"`Tests run: (\d+), Failures: 0"),
     site(r"runs the (\d+) tests \*\*and\*\*"),
     site(r"`mvn test` runs (\d+) tests:"),
     site(r"# (\d+) tests \(JUnit 5\)"),
     site(r"CI ±5\.0%\), the (\d+)\s+tests, and the honest"),
     site(r"k: '(\d+)', v: 'tests green'", file=FACTS_TS),
     site(r"mono: 'Tests run: (\d+) · Failures: 0", file=FACTS_TS),
     site(r"^  total: (\d+),", file=FACTS_TS)])

SUITES = [
    ("RoundTripTest", "testsRoundTrip"),
    ("Adler32Test", "testsAdler32"),
    ("Crc32CombineTest", "testsCrc32Combine"),
    ("CrossToolTest", "testsCrossTool"),
    ("MappedInputTest", "testsMappedInput"),
]

for _cls, _fid in SUITES:
    add(_fid, f"tests in {_cls}, per its surefire XML", "recorded",
        [site(r"name: '" + _cls + r"',\s*\n\s*count: (\d+),", file=FACTS_TS)])

# -- recorded: coverage ---------------------------------------------------

add("coverageLines",
    "blended line coverage from target/site/jacoco/jacoco.xml",
    "recorded",
    [site(r"\| \*\*Total\*\* \| \*\*([\d.]+)%\*\* lines"),
     site(r"The blended ([\d.]+)% is the least informative"),
     site(r"\| \*\*([\d.]+)% lines / [\d.]+% branches\*\* \|")],
    decimals=1)

add("coverageBranches",
    "blended branch coverage from target/site/jacoco/jacoco.xml",
    "recorded",
    [site(r"\*\*[\d.]+%\*\* lines · ([\d.]+)% branches"),
     site(r"\| \*\*[\d.]+% lines / ([\d.]+)% branches\*\* \|")],
    decimals=1)

PACKAGES = [
    ("com/ayush/jetpack/vector", "coveragePackageVector", r"`com\.ayush\.jetpack\.vector`", 1),
    ("com/ayush/jetpack/core", "coveragePackageCore", r"`com\.ayush\.jetpack\.core`", 1),
    ("com/ayush/jetpack/io", "coveragePackageIo", r"`com\.ayush\.jetpack\.io`", 1),
    ("com/ayush/jetpack/cli", "coveragePackageCli", r"`com\.ayush\.jetpack\.cli`", 1),
]

for _pkg, _fid, _row, _dp in PACKAGES:
    _sites = [site(r"\| " + _row + r" \| \*{0,2}([\d.]+)%", decimals=_dp)]
    if _fid == "coveragePackageVector":
        # The README argues about this number a second time in prose: it is the
        # reason the project exists, and the reason the blended figure is the
        # least useful one on the page. The restatement is checked too, because
        # a table corrected in isolation leaves the paragraph beside it wrong.
        _sites.append(
            site(r"package is the reason this project exists and it sits at ([\d.]+)%",
                 decimals=_dp))
    add(_fid, f"line coverage of {_pkg}, per jacoco.xml", "recorded", _sites,
        decimals=_dp)


# ── invariants ───────────────────────────────────────────────────────────

INVARIANTS = [
    ("the per-suite test counts sum to the stated total",
     lambda f: sum(f[fid] for _, fid in SUITES) == f["testsTotal"],
     lambda f: (" + ".join(str(f[fid]) for _, fid in SUITES) +
                f" = {sum(f[fid] for _, fid in SUITES)}, not {f['testsTotal']}. "
                f"A test class was added or removed since the last --record.")),

    # The trap this whole file exists to prevent. The table quotes the rigorous
    # run; the quick run reads HIGHER on the parallel figure, and the README
    # says so in two places. If that ordering ever inverts, either the artifacts
    # were swapped or one of them was regenerated -- and the paragraph
    # explaining "the table above deliberately quotes the slower, tighter one"
    # is then false prose, which no amount of digit-rewriting fixes.
    ("the quick 1-fork run reads higher than the rigorous run, as the README says",
     lambda f: f["quickParallelOverSingle"] > f["parallelOverSingle"],
     lambda f: (f"quick {f['quickParallelOverSingle']:.3f}x is not above rigorous "
                f"{f['parallelOverSingle']:.3f}x. The two committed JMH files no "
                f"longer stand in the relationship the Benchmarks section describes.")),

    ("the rigorous run really has more forks than the quick one",
     lambda f: f["rigorousForks"] > f["quickForks"],
     lambda f: (f"rigorous has {f['rigorousForks']} forks and quick has "
                f"{f['quickForks']}. 'Rigorous' is a claim about the run "
                f"configuration, not a filename.")),

    ("the table's throughputs and its ratio are the same measurement",
     lambda f: (f"{round_half_up(f['throughput_parallelVirtualThreads'] / f['throughput_singleThreadedJdk'], 1)}"
                == f"{round_half_up(f['parallelOverSingle'], 1)}"),
     lambda f: (f"{f['throughput_parallelVirtualThreads']:.1f} MB/s over "
                f"{f['throughput_singleThreadedJdk']:.1f} MB/s is not "
                f"{f['parallelOverSingle']:.2f}x -- a throughput and a ratio in the "
                f"same row came from different runs.")),

    ("the JDK intrinsic is faster than the Vector API port, which is faster than scalar",
     lambda f: (f["throughput_jdkIntrinsic"] > f["throughput_vector"]
                > f["throughput_scalar"]),
     lambda f: (f"intrinsic {f['throughput_jdkIntrinsic']} / vector "
                f"{f['throughput_vector']} / scalar {f['throughput_scalar']} GB/s. "
                f"The README presents the intrinsic as a reference 'not beaten'; "
                f"if that stops being true the sentence changes, not the number.")),

    ("the CI floor sits below the measured coverage, deliberately",
     lambda f: f["coverageFloor"] < f["coverageLines"],
     lambda f: (f"the gate is {f['coverageFloor']}% and coverage is "
                f"{f['coverageLines']}%. A gate pinned at or above the measured "
                f"value turns every honest refactor red, which is exactly what the "
                f"README says it was set to avoid.")),

    ("the blended total really is dragged down by the untested CLI",
     lambda f: (f["coveragePackageCli"] < f["coverageLines"]
                < f["coveragePackageVector"]),
     lambda f: (f"cli {f['coveragePackageCli']}%, blended {f['coverageLines']}%, "
                f"vector {f['coveragePackageVector']}%. The README's paragraph -- "
                f"'the hot path is at 99% and the CLI shim is untested' -- is an "
                f"argument about this ordering. If it inverts, rewrite the "
                f"paragraph rather than the digits.")),

    ("the smallest RoundTrip block is small enough to force many parallel blocks",
     lambda f: f["roundTripSmallestBlock"] < f["defaultBlockSizeBytes"],
     lambda f: (f"{f['roundTripSmallestBlock']} is not below the default "
                f"{f['defaultBlockSizeBytes']}")),
]


# ── resolve ──────────────────────────────────────────────────────────────


def load_artifact():
    if not os.path.exists(ARTIFACT):
        die(f"{ARTIFACT_REL} is missing.\n"
            f"      Recorded facts (test counts, coverage) have no source without it --\n"
            f"      target/ is gitignored, so nothing about a run survives in the tree.\n"
            f"      Run: python3 scripts/readme_facts.py --record")
    with open(ARTIFACT, encoding="utf-8") as fh:
        return json.load(fh)


def resolve():
    artifact = load_artifact()
    values = {}
    for fid, f in FACTS.items():
        if f["kind"] == "static":
            values[fid] = f["compute"]()
        else:
            rec = artifact.get("facts", {}).get(fid)
            if rec is None:
                die(f'fact "{fid}" is recorded, but {ARTIFACT_REL} has no entry for it.\n'
                    f"      Run: python3 scripts/readme_facts.py --record")
            values[fid] = rec["value"]
    return values, artifact


# ── check / write ────────────────────────────────────────────────────────


def validate_sites():
    problems = []
    for fid, f in FACTS.items():
        for s in f["sites"]:
            try:
                groups = re.compile(s["pattern"], re.MULTILINE).groups
            except re.error as exc:
                problems.append(f"{fid}: {s['pattern']!r} is not a valid regex ({exc})")
                continue
            if groups != 1:
                problems.append(
                    f"{fid}: site {s['pattern']!r} has {groups} capture groups, "
                    f"must have exactly 1 (around the number)")
            if not os.path.exists(os.path.join(REPO, s["file"])):
                problems.append(f"{fid}: site names {s['file']}, which does not exist")
    if problems:
        sys.stderr.write("\n  The fact table itself is malformed:\n\n")
        for p in problems:
            sys.stderr.write(f"  x {p}\n")
        sys.stderr.write("\n")
        sys.exit(2)


def run(mode):
    validate_sites()
    values, artifact = resolve()
    problems = []
    rewrites = 0
    files = {}

    def load(rel):
        if rel not in files:
            files[rel] = {"text": read(rel), "dirty": False}
        return files[rel]

    def line_of(text, index):
        return text.count("\n", 0, index) + 1

    for fid, f in FACTS.items():
        expected = values[fid]
        for s in f["sites"]:
            entry = load(s["file"])
            matches = list(re.finditer(s["pattern"], entry["text"], re.MULTILINE))

            # The rule that makes this a checker and not a decoration.
            if not matches:
                problems.append(
                    f"{fid}: a claim site in {s['file']} matched NOTHING.\n"
                    f"      pattern  {s['pattern']}\n"
                    f"      The sentence was reworded and this fact is no longer verified\n"
                    f"      anywhere. Update the pattern in scripts/readme_facts.py, or\n"
                    f"      delete the site if the claim is genuinely gone.")
                continue

            dp = f["decimals"] if s["decimals"] == "inherit" else s["decimals"]

            def wanted(found, _s=s, _dp=dp, _f=f, _expected=expected):
                if isinstance(_expected, str) and not (_s["word"] or _s["ordinal"]):
                    return _expected
                w = fmt(_expected, decimals=_dp, word=_s["word"],
                        ordinal=_s["ordinal"],
                        scientific=f["scientific"] or s["scientific"],
                        commas=("," in found) if _s["commas"] == "auto"
                        else bool(_s["commas"]))
                if (_s["word"] or _s["ordinal"]) and found[:1].isupper():
                    w = w.capitalize()
                return w

            if mode == "write":
                # Every rewrite shifts the offset of everything after it, so the
                # file is re-scanned after each edit instead of being edited from
                # a stale snapshot -- and the loop keeps going until the pattern
                # has no mismatches left. Stopping after the first hit would fix
                # one occurrence of a pattern that matches several, which is
                # precisely the failure this whole tool exists to catch: a
                # correction that reached three sites out of four.
                converged = False
                for _ in range(500):
                    hit = next((mm for mm in
                                re.finditer(s["pattern"], entry["text"], re.MULTILINE)
                                if mm.group(1) != wanted(mm.group(1))), None)
                    if hit is None:
                        converged = True
                        break
                    lo, hi = hit.span(1)
                    entry["text"] = (entry["text"][:lo] + wanted(hit.group(1))
                                     + entry["text"][hi:])
                    entry["dirty"] = True
                    rewrites += 1
                if not converged:
                    problems.append(
                        f"{fid}: --write did not converge on {s['file']}.\n"
                        f"      pattern  {s['pattern']}\n"
                        f"      The replacement it writes does not satisfy the pattern that\n"
                        f"      found it, so every pass re-edits the same text. Fix the site.")
                continue

            for m in matches:
                found = m.group(1)
                want = wanted(found)
                if found == want:
                    continue
                problems.append(
                    f"{fid}: {s['file']}:{line_of(entry['text'], m.start())} says "
                    f"{found}, but {f['describe']} is {want}.\n"
                    f"      context  {m.group(0).strip()[:100]}")

    for name, holds, explain in INVARIANTS:
        try:
            ok = holds(values)
        except KeyError as exc:
            problems.append(f"invariant '{name}' references a fact that is gone: {exc}")
            continue
        if not ok:
            problems.append(f"invariant broken -- {name}\n      {explain(values)}")

    # The README prints the date the coverage table was measured. That date is
    # itself a claim, so it is checked against the artifact rather than
    # trusted: otherwise the percentages can be refreshed while the date stays
    # put, which reads as more provenance than actually exists.
    readme = load(README)
    date_re = re.compile(r"writes a JaCoCo report\. Measured on\s*\n?(\d{4}-\d{2}-\d{2})")
    dm = date_re.search(readme["text"])
    if not dm:
        problems.append(
            f"the coverage measurement-date sentence no longer matches its pattern "
            f"({date_re.pattern}).\n"
            f"      A coverage figure without its date is a number with no provenance.")
    elif dm.group(1) != artifact.get("recordedAt"):
        if mode == "write":
            span = dm.span(1)
            readme["text"] = readme["text"][:span[0]] + artifact["recordedAt"] \
                + readme["text"][span[1]:]
            readme["dirty"] = True
            rewrites += 1
        else:
            problems.append(
                f"README says coverage was measured on {dm.group(1)}, but "
                f"{ARTIFACT_REL} was recorded {artifact.get('recordedAt')}.")

    if mode == "write":
        written = []
        for rel, entry in files.items():
            if not entry["dirty"]:
                continue
            with open(os.path.join(REPO, rel), "w", encoding="utf-8") as fh:
                fh.write(entry["text"])
            written.append(rel)
        print("  v Everything already agrees with the source. Nothing rewritten."
              if rewrites == 0 else
              f"  v rewrote {rewrites} number{'' if rewrites == 1 else 's'} in "
              f"{', '.join(written)}.")
        if problems:
            sys.stderr.write("\n  Some problems cannot be fixed by rewriting a number:\n\n")
            for p in problems:
                sys.stderr.write(f"  x {p}\n\n")
            sys.exit(1)
        return

    if problems:
        sys.stderr.write(f"\n  The docs disagree with the code in {len(problems)} place(s):\n\n")
        for p in problems:
            sys.stderr.write(f"  x {p}\n\n")
        sys.stderr.write(
            "  Fix by re-running the source of truth, not by editing prose:\n"
            "    python3 scripts/readme_facts.py --record   # if the suite or coverage moved\n"
            "    python3 scripts/readme_facts.py --write    # then apply to the docs\n"
            "  The JMH figures are NOT re-recordable here on purpose -- see the header.\n\n")
        sys.exit(1)

    n_sites = sum(len(f["sites"]) for f in FACTS.values())
    print(f"  v {len(FACTS)} facts, asserted at {n_sites} sites across {len(files)} file(s), "
          f"all agree with the code ({len(INVARIANTS)} invariants hold).")


# ── record ───────────────────────────────────────────────────────────────

RECORD_CMD = "mvn -B -DskipTests=false verify -DskipITs"


def parse_surefire():
    """Sum target/surefire-reports/*.xml, per class and overall.

    Counted per FILE rather than from Maven's stdout summary: the console line
    is easy to parse and easy to lose to a `-q`, and the per-class breakdown
    that web/src/data/facts.ts publishes only exists here. Parameterised tests
    expand at runtime -- 27 annotated methods become 72 executions -- which is
    exactly why this is a recorded fact and not a grep for @Test.
    """
    paths = sorted(glob.glob(os.path.join(REPO, "target/surefire-reports/*.xml")))
    if not paths:
        raise RuntimeError(
            "no surefire XML was produced. A green build that collected nothing is "
            "not a pass, and recording zero would be worse than recording nothing.")
    per_class, total = {}, {"tests": 0, "failures": 0, "errors": 0, "skipped": 0}
    for p in paths:
        root = ET.parse(p).getroot()
        cls = os.path.basename(p)[len("TEST-"):-len(".xml")].rsplit(".", 1)[-1]
        per_class[cls] = int(root.get("tests", 0))
        for k in total:
            total[k] += int(root.get(k, 0))
    return per_class, total


def parse_jacoco():
    path = os.path.join(REPO, "target/site/jacoco/jacoco.xml")
    if not os.path.exists(path):
        raise RuntimeError("target/site/jacoco/jacoco.xml is missing -- the coverage "
                           "agent did not attach. Do not record a number from a run "
                           "that measured nothing.")
    root = ET.parse(path).getroot()

    def counters(node):
        return {c.get("type"): (int(c.get("covered")), int(c.get("missed")))
                for c in node.findall("counter")}

    overall = counters(root)
    lc, lm = overall["LINE"]
    bc, bm = overall["BRANCH"]
    if lc + lm == 0:
        raise RuntimeError("jacoco recorded no lines at all -- the agent detached.")
    packages = {}
    for p in root.findall("package"):
        c = counters(p)
        if "LINE" in c:
            cov, miss = c["LINE"]
            packages[p.get("name")] = 100.0 * cov / (cov + miss)
    return {
        "lines": 100.0 * lc / (lc + lm),
        "branches": 100.0 * bc / (bc + bm),
        "packages": packages,
    }


def record():
    print(f"  -> {RECORD_CMD}")
    print("     (JMH is deliberately NOT run: benchmarks/ENVIRONMENT.md pins those")
    print("      figures to OpenJDK 25.0.3 on an M1 Pro, and a ratio measured on any")
    print("      other machine is a different experiment, not a correction.)")
    proc = subprocess.run(RECORD_CMD.split(), cwd=REPO, capture_output=True, text=True)

    per_class, total = parse_surefire()
    cov = parse_jacoco()

    facts = {
        "testsTotal": {"value": total["tests"], "command": RECORD_CMD},
    }
    for cls, fid in SUITES:
        if cls not in per_class:
            raise RuntimeError(
                f"{cls} produced no surefire XML. web/src/data/facts.ts publishes a "
                f"per-suite count for it, so recording the total while silently "
                f"dropping the breakdown would leave that file unverifiable.")
        facts[fid] = {"value": per_class[cls],
                      "command": f"{RECORD_CMD} (target/surefire-reports/*.{cls}.xml)"}

    facts["coverageLines"] = {"value": round(cov["lines"], 4),
                              "command": f"{RECORD_CMD} -> target/site/jacoco/jacoco.xml"}
    facts["coverageBranches"] = {"value": round(cov["branches"], 4),
                                 "command": f"{RECORD_CMD} -> target/site/jacoco/jacoco.xml"}
    for pkg, fid, _row, _dp in PACKAGES:
        if pkg not in cov["packages"]:
            raise RuntimeError(f"jacoco.xml has no package {pkg}.")
        facts[fid] = {"value": round(cov["packages"][pkg], 4),
                      "command": f"{RECORD_CMD} -> jacoco.xml, package {pkg}"}

    artifact = {
        "$comment": (
            "Recorded facts for README.md and web/src/data/facts.ts -- the figures "
            "that require executing something whose output is not in git (target/ is "
            "gitignored). Regenerate with `python3 scripts/readme_facts.py --record`, "
            "then apply with `--write`. Do not hand-edit: the point of this file is "
            "that these numbers have a command behind them. The JMH throughput "
            "figures are deliberately ABSENT -- they are read straight from the "
            "committed benchmarks/jmh-results*.json, which are scoped to one machine "
            "and one JDK, and this script will not re-measure them."),
        "recordedAt": date.today().isoformat(),
        "machine": f"{platform.system().lower()}-{platform.machine()}, "
                   f"python {platform.python_version()}",
        "jdk": _java_version(),
        "facts": facts,
        # Recorded but deliberately NOT asserted anywhere. A green artifact must
        # not be mistakable for a green suite: --record keeps the counts from a
        # failing run on purpose, so without this block a red run and a clean
        # one would leave identical files behind. Asserting "Failures: 0" is
        # ci.yml's "Summarise the suite" step, against the run that just
        # happened, which is the only place that assertion means anything.
        "suiteOutcome": {
            "command": RECORD_CMD,
            "mavenExitCode": proc.returncode,
            "tests": total["tests"],
            "failures": total["failures"],
            "errors": total["errors"],
            "skipped": total["skipped"],
            "allGreen": (total["failures"] == 0 and total["errors"] == 0
                         and total["tests"] > 0),
            "note": ("CrossToolTest self-skips when gzip(1) is absent from PATH, so a "
                     "skipped count above zero here describes the environment, not a "
                     "regression."),
        },
    }
    os.makedirs(os.path.dirname(ARTIFACT), exist_ok=True)
    with open(ARTIFACT, "w", encoding="utf-8") as fh:
        json.dump(artifact, fh, indent=2)
        fh.write("\n")
    print(f"\n  v wrote {ARTIFACT_REL} (recorded {artifact['recordedAt']})")
    if not artifact["suiteOutcome"]["allGreen"]:
        print("    ! the suite was NOT green during this run -- the counts are real "
              "but they describe a failing build.")
    print("    Now run: python3 scripts/readme_facts.py --write")


def _java_version():
    try:
        out = subprocess.run(["java", "-version"], capture_output=True, text=True)
        first = (out.stderr or out.stdout).splitlines()[0]
        return first.strip()
    except Exception:  # noqa: BLE001
        return "unknown"


# ── main ─────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    arg = sys.argv[1] if len(sys.argv) > 1 else "--check"
    if arg == "--record":
        record()
    elif arg == "--write":
        run("write")
    elif arg == "--check":
        run("check")
    else:
        sys.stderr.write(f"unknown option {arg}\n"
                         f"usage: readme_facts.py [--check|--write|--record]\n")
        sys.exit(2)
