# TSP.SIM — Traveling Salesman Problem Visualizer

## Group Members — Group 4, Section 2

| # | Name | Student ID |
|---|------|------------|
| 1 | **Natnael Zemene** | GUR/02204/16 |
| 2 | Meron Kifle | GUR/01196/16 |
| 3 | Hilina Shambel | GUR/01604/16 |
| 4 | Lidiya Assefa | GUR/02780/16 |
| 5 | Eden Shewaye | GUR/01134/16 |
| 6 | Mulugeta Fissiha | GUR/01919/16 |

**Group project — Algorithms course**

An interactive, browser-based tool our team built to **solve and visualize** the classic **Traveling Salesman Problem (TSP)** on a small map of five U.S. cities. Switch between four fundamental algorithm families, watch tours build in real time, and compare **optimality**, **speed**, and **search behavior** side by side.

> **Problem statement:** Given a set of cities and the cost to travel between each pair, find the shortest route that visits every city exactly once and returns to the starting city.

The app is **fully responsive** — it works on desktop, tablet, and mobile browsers (portrait and landscape).

---

## Table of Contents

- [Group Members — Group 4, Section 2](#group-members--group-4-section-2)
- [Live Demo](#live-demo)
- [Responsive Design](#responsive-design)
- [Features](#features)
- [The Instance](#the-instance)
- [Algorithms](#algorithms)
  - [1. Brute Force](#1-brute-force)
  - [2. Backtracking](#2-backtracking)
  - [3. Dynamic Programming (Held–Karp)](#3-dynamic-programming-heldkarp)
  - [4. Greedy / Nearest Neighbor](#4-greedy--nearest-neighbor)
- [Algorithm Comparison](#algorithm-comparison)
- [How to Run Locally](#how-to-run-locally)
- [Project Structure](#project-structure)
- [UI Guide](#ui-guide)
- [Complexity at a Glance](#complexity-at-a-glance)
- [Learning Path](#learning-path)
- [Limitations](#limitations)
- [Tech Stack](#tech-stack)
- [License](#license)

---

## Live Demo

After deployment, open your hosted URL and load `index.html`.

For local testing on a phone, run a static server on your machine and open your computer’s LAN IP (e.g. `http://192.168.1.x:8080/index.html`) from the same Wi‑Fi network.

---

## Responsive Design

The layout adapts automatically; no separate mobile build is required.

| Breakpoint | Layout behavior |
|------------|-----------------|
| **Desktop (>1024px)** | Classic HUD: left controls, center map, right stats/tree, footer metrics |
| **Tablet (≤1024px)** | Map on top; controls and stats in two columns below; page scrolls vertically |
| **Mobile (≤768px)** | Single column; **☰ menu** for algorithm tabs; touch-friendly buttons (44px min) |
| **Small phone (≤480px)** | Compact controls; simplified legend and footer; full-width action buttons |
| **Landscape phone** | Side-by-side panels with a taller map row when height is limited |

**Mobile tips**

1. Tap **☰** in the nav bar to switch algorithms (Brute Force, Backtracking, DP, Greedy).
2. Use the **zoom bar** on the map (bottom-right on phones; top-left zoom badges are hidden on very small screens).
3. Scroll down to reach pseudocode, the exploration tree, live stats, and the result card.
4. Footer stats scroll horizontally if they do not fit on one row.

Canvases resize on window/orientation changes and when the mobile browser chrome shows or hides (via `visualViewport`).

---

## Features

| Feature | Description |
|--------|-------------|
| **Four solvers** | Brute force, backtracking, Held–Karp DP, and greedy nearest neighbor |
| **Animated map** | Cities, edge weights, current path, best path, and rejected edges |
| **Search tree** | Live exploration / choice tree with zoom, fit, and minimap |
| **Pseudocode sync** | Highlighted pseudocode tracks the active step |
| **Recursion stack** | Frame-by-frame stack for backtracking |
| **DP memo panel** | Subset states and cache hits for dynamic programming |
| **Controls** | Run, pause, resume, stop, reset, speed slider, auto vs step mode |
| **Statistics** | Nodes explored, recursive calls, tours checked, execution time, complexity chart |
| **Interactivity** | Pan/zoom graph, drag cities, tooltips with distances, fullscreen |
| **Responsive UI** | Adaptive grid, mobile nav menu, scrollable panels, touch targets |

---

## The Instance

This demo fixes **n = 5** cities and a symmetric distance matrix (tour costs are edge sums plus return to start):

| ID | City | Role |
|----|------|------|
| **S** | San Francisco | Fixed start city (all algorithms begin here) |
| **N** | New York | |
| **D** | Dallas | |
| **C** | Chicago | |
| **A** | Atlanta | |

Distances are abstract units (not real-world miles), chosen so the graph is readable and all algorithms finish quickly in the browser.

**Tour cost** for path `p₀ → p₁ → … → pₙ₋₁ → p₀`:

```
cost = Σ d(pᵢ, pᵢ₊₁) + d(pₙ₋₁, p₀)
```

---

## Algorithms

Each method answers the same question—*what is the shortest closed tour?*—but trades **correctness guarantees**, **time**, and **memory** differently.

---

### 1. Brute Force

**Idea:** Enumerate every valid permutation of cities (with the start fixed to remove rotational symmetry) and keep the tour with minimum cost.

**How it works in this project:**

1. Fix **S** as the starting city.
2. Generate all permutations of `{N, D, C, A}` → **(n − 1)! = 24** tours.
3. For each permutation, animate the salesman traveling edge by edge, compute total cost including the return edge to **S**.
4. Update the global best whenever a cheaper complete tour is found; otherwise flash rejected edges.

**Properties:**

| | |
|---|---|
| **Optimality** | Guaranteed optimal |
| **Time** | O((n − 1)!) — factorial growth |
| **Space** | O(n) for the current path / recursion stack |
| **Best for** | Teaching correctness; only practical for very small n |

**When to use:** You need the true optimum and n is tiny (typically n ≤ 10–12 depending on hardware).

**Pseudocode sketch:**

```
for each permutation π of cities (start fixed):
    cost ← sum of edges along π + return to start
    best ← min(best, cost)
```

---

### 2. Backtracking

**Idea:** Build tours depth-first like brute force, but **abandon (prune)** any partial path whose cost already exceeds the best complete tour found so far.

**How it works in this project:**

1. Start at **S** with `cost = 0`, `visited = {S}`.
2. At each step, try extending the path to an unvisited city.
3. **Pruning rule:** If `partial_cost ≥ best_complete_cost`, stop exploring that branch (shown as “PRUNING BRANCH”).
4. When the path includes all cities, add the return edge to **S** and update the best if improved.
5. **Backtrack:** Remove the last city from the path and try the next choice (animated in red).

**Properties:**

| | |
|---|---|
| **Optimality** | Guaranteed optimal (still explores the same search space in the worst case) |
| **Time** | O((n − 1)!) worst case; often much better with strong pruning |
| **Space** | O(n) for path + visited set + recursion stack |
| **Best for** | Showing branch-and-bound intuition without changing the optimal answer |

**Key insight:** Backtracking is brute force with an **early exit**. Worst-case complexity is unchanged, but average-case performance on many instances improves dramatically.

**Pseudocode sketch:**

```
function backtrack(path, visited, cost):
    if cost ≥ best: return          // prune
    if |path| = n:
        update best with cost + d(last, start)
        return
    for each unvisited city c:
        visit c; backtrack(...)
        unvisit c                   // backtrack
```

---

### 3. Dynamic Programming (Held–Karp)

**Idea:** Avoid recomputing the same subproblems. Define `dp[mask][i]` = minimum cost to visit exactly the set of cities encoded in `mask`, **ending at city i**.

This is the classic **Held–Karp** algorithm (1962)—the standard exact TSP algorithm for moderate n before branch-and-cut solvers dominate.

**State definition:**

- `mask` — bitmask of visited cities (bit `k` set ⇔ city `k` visited)
- `i` — current ending city index
- `dp[mask][i]` — min cost to visit all cities in `mask`, finishing at `i`

**Transitions:**

```
dp[mask ∪ {j}][j] = min over i ∈ mask (
    dp[mask][i] + dist(i, j)
)
```

**Base case:** `dp[{start}][start] = 0`

**Answer:**

```
min over i ≠ start of dp[all_cities][i] + dist(i, start)
```

**How it works in this project:**

1. Fill the DP table in increasing order of subset size (`mask` from 1 to 2ⁿ − 1).
2. Show each relaxation on the map; highlight **cache hits** when a state is revisited.
3. Reconstruct the optimal tour by following parent pointers from the best final state.

**Properties:**

| | |
|---|---|
| **Optimality** | Guaranteed optimal |
| **Time** | O(n² · 2ⁿ) |
| **Space** | O(n · 2ⁿ) |
| **Best for** | Exact TSP up to roughly n ≈ 20–23 in practice (memory-bound) |

**Key insight:** Factorial brute force explores **paths**; DP aggregates over **subsets**, sharing work between many paths that visit the same set of cities in different orders.

**Compared to brute force for n = 5:**

- Brute force: ~24 tours  
- Held–Karp: ~n² · 2ⁿ = 25 · 32 = 800 state updates (still instant in JS)

For n = 20, Held–Karp is feasible; brute force is not.

---

### 4. Greedy / Nearest Neighbor

**Idea:** Never look ahead globally—at each step, go to the **closest unvisited** city. When all cities are visited, return to the start.

**How it works in this project:**

1. Start at **S**.
2. Repeatedly scan unvisited cities, pick minimum `d(current, next)`, animate the move, accumulate cost.
3. Return to **S** and report the tour (may **not** be optimal).

**Properties:**

| | |
|---|---|
| **Optimality** | **Not** guaranteed; can be arbitrarily bad on crafted instances |
| **Time** | O(n²) per tour build |
| **Space** | O(n) |
| **Best for** | Fast approximations, heuristics, and contrast with exact methods |

**Key insight:** Greedy is what many real systems use when n is large—TSP is NP-hard, so exact methods do not scale. Nearest neighbor is a baseline heuristic; production systems often add 2-opt, Christofides, or metaheuristics (simulated annealing, genetic algorithms).

**Pseudocode sketch:**

```
path ← [start]; visited ← {start}
while |path| < n:
    next ← argmin_{c ∉ visited} d(current, c)
    path.append(next); visited.add(next)
return path + edge back to start
```

---

## Algorithm Comparison

| Method | Optimal? | Time | Space | Exploration style |
|--------|----------|------|-------|-------------------|
| Brute Force | Yes | O((n−1)!) | O(n) | Full enumeration |
| Backtracking | Yes | O((n−1)!) worst | O(n) | DFS + pruning |
| Held–Karp DP | Yes | O(n²·2ⁿ) | O(n·2ⁿ) | Subset DP |
| Greedy (NN) | No | O(n²) | O(n) | Local choice |

```
n small ──────────────────────────────────────────────► n large

Brute / Backtrack          DP (exact)              Greedy (fast)
     │                          │                         │
     └─ teach optimality        └─ teach DP / NP-hard    └─ teach heuristics
```

---

## How to Run Locally

No build step or dependencies required. ES modules require either opening via a local server or using a browser that allows `file://` module loading (a static server is recommended).

**Option A — Open directly**

```text
Open index.html in a modern browser (Chrome, Firefox, Edge, Safari).
```

**Option B — Local static server (recommended)**

From the repository root (`Algorithm/`):

```bash
# Python 3
python -m http.server 8080

# Node (if npx available)
npx serve .
```

Then visit: `http://localhost:8080/index.html`

---

## Project Structure

```text
Algorithm/
├── index.html              # Application shell and layout
├── css/
│   └── TSP.css             # Cyberpunk HUD styling and grid layout
├── js/
│   ├── data.js             # Cities, distance table, d()
│   ├── state.js            # Shared mutable application state
│   ├── graph.js            # Canvases, rendering, orbs, resize, mouse events
│   ├── main.js             # Init, run dispatcher, event listeners
│   ├── ui/
│   │   ├── tree.js         # Exploration tree layout and controls
│   │   └── controls.js     # Pseudocode, stats, reset, result UI
│   └── algorithms/
│       ├── bruteForce.js   # Brute-force enumeration
│       ├── backtracking.js # Backtracking with pruning
│       ├── heldKarp.js     # Held–Karp dynamic programming
│       └── greedy.js       # Greedy nearest neighbor
└── README.md               # This file
```

---

## UI Guide

1. **Choose an algorithm** — tabs in the top navigation bar (on phones, open the **☰** menu first).
2. **Run** — start animation; use **Pause** / **Resume** / **Stop** as needed.
3. **Step mode** — toggle *Step*, then press **Next Step** to advance one algorithmic step.
4. **Speed** — slider from slow (learning) to fast (overview).
5. **Left panel** — pseudocode, recursion stack (backtracking), city legend.
6. **Center** — geographic graph; zoom, pan, drag cities for experimentation.
7. **Right panel** — search tree, current path, live stats, DP table (DP mode), result card.
8. **Footer** — aggregate metrics and mini cost chart.

**Color legend (map):**

- Yellow — current city  
- Green — visited  
- Cyan — current partial path  
- Red dashed — rejected / pruned edge  
- Gold — best (optimal) tour  

---

## Complexity at a Glance

For **n** cities (start fixed):

| Algorithm | Time | Space |
|-----------|------|-------|
| Brute Force | Θ((n−1)!) | O(n) |
| Backtracking | O((n−1)!) worst | O(n) |
| Held–Karp | O(n² · 2ⁿ) | O(n · 2ⁿ) |
| Nearest Neighbor | O(n²) | O(n) |

TSP is **NP-hard**: no known polynomial-time algorithm solves all instances optimally unless P = NP. The visualizer makes that tradeoff tangible.

---

## Learning Path

Suggested order for readers using this as a **guideline**:

1. **Greedy** — intuitive, fast; notice when the result differs from “obvious” best tours.
2. **Brute Force** — see every tour; understand why factorial growth matters.
3. **Backtracking** — same correctness, fewer nodes; connect pruning to branch-and-bound.
4. **Dynamic Programming** — subset states; bridge to Held–Karp and why n ≈ 20 is a practical exact limit.

---

## Limitations

- Fixed **5-city** instance (hardcoded in `js/data.js`); not a general TSP solver for arbitrary n or custom graphs.
- Brute force and backtracking are educational at this n; they do not scale.
- Greedy may report a suboptimal tour by design.
- Requires network access for **Google Fonts** (Orbitron, JetBrains Mono, Rajdhani) unless fonts are self-hosted.
- Requires a browser with ES module support; use a local static server when `file://` module loading is restricted.

---

## Tech Stack

- **HTML5** — structure, viewport meta tag, canvas elements  
- **CSS3** — CSS Grid + media queries, glassmorphism HUD, mobile nav drawer  
- **Vanilla JavaScript** — algorithms, Canvas 2D rendering, async animation loop, resize handling  
- **No frameworks, no bundler, no backend**

---

## License

Add a license file (e.g. MIT) if you plan to publish or open-source the repository.

---

## Acknowledgments

Built by our **Algorithms** study group as an interactive visualization for classical TSP methods: enumeration, backtracking, dynamic programming (Held–Karp), and greedy heuristics.

**Team use:** Present live demos from a laptop or projector (desktop layout), or let classmates open the same URL on phones/tablets during review sessions — the UI reflows automatically.
