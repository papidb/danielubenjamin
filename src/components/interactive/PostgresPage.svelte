<script lang="ts">
import { onMount } from "svelte";
import gsap from "gsap";

interface Tuple {
	id: number;
	user_id: number;
	name: string;
	age: number;
	isDead: boolean;
}

let {
	maxTuples = 8,
	animationSpeed = 0.4
}: {
	maxTuples?: number;
	animationSpeed?: number;
} = $props();

const names = ["Alice", "Bob", "Charlie", "Diana", "Eve", "Frank", "Grace", "Henry", "Ivy", "Jack"];

let tuples = $state<Tuple[]>([]);
let nextId = $state(1);
let container: HTMLElement;
let prefersReducedMotion = $state(false);

let liveCount = $derived(tuples.filter(t => !t.isDead).length);
let deadCount = $derived(tuples.filter(t => t.isDead).length);
let usedPercent = $derived(Math.min(100, tuples.length * (100 / maxTuples)));
let deadPercent = $derived(Math.min(100, deadCount * (100 / maxTuples)));
let freePercent = $derived(Math.max(0, 100 - usedPercent));
let isNearFull = $derived(usedPercent >= 80);
let isFull = $derived(tuples.length >= maxTuples);

function getDuration(base: number): number {
	return prefersReducedMotion ? 0 : base * animationSpeed;
}

function generateTuple(): Tuple {
	const id = nextId++;
	return {
		id,
		user_id: id,
		name: names[Math.floor(Math.random() * names.length)],
		age: Math.floor(Math.random() * 50) + 18,
		isDead: false
	};
}

function insertTuple() {
	if (isFull) return;

	const newTuple = generateTuple();
	tuples = [...tuples, newTuple];

	requestAnimationFrame(() => {
		const tupleEl = container?.querySelector(`[data-tuple-id="${newTuple.id}"]`);
		const pointerEl = container?.querySelector(`[data-pointer-id="${newTuple.id}"]`);

		if (tupleEl) {
			gsap.from(tupleEl, {
				x: 50,
				opacity: 0,
				duration: getDuration(1),
				ease: "power2.out"
			});
		}

		if (pointerEl) {
			gsap.from(pointerEl, {
				width: 0,
				opacity: 0,
				duration: getDuration(0.75),
				ease: "power1.out"
			});
		}
	});
}

function deleteTuple(id: number) {
	const tuple = tuples.find(t => t.id === id);
	if (!tuple || tuple.isDead) return;

	tuples = tuples.map(t => (t.id === id ? { ...t, isDead: true } : t));
}

function vacuum() {
	const deadTupleEls = container?.querySelectorAll(".tuple-dead");

	if (deadTupleEls && deadTupleEls.length > 0) {
		gsap.to(deadTupleEls, {
			height: 0,
			opacity: 0,
			marginBottom: 0,
			paddingTop: 0,
			paddingBottom: 0,
			duration: getDuration(1),
			stagger: getDuration(0.25),
			ease: "power2.inOut",
			onComplete: () => {
				tuples = tuples.filter(t => !t.isDead);
			}
		});
	}
}

function reset() {
	const allTupleEls = container?.querySelectorAll(".tuple-item");

	if (allTupleEls && allTupleEls.length > 0) {
		gsap.to(allTupleEls, {
			opacity: 0,
			x: -20,
			duration: getDuration(0.75),
			stagger: getDuration(0.125),
			ease: "power1.in",
			onComplete: () => {
				tuples = [];
				nextId = 1;
			}
		});
	} else {
		tuples = [];
		nextId = 1;
	}
}

function handleKeydown(event: KeyboardEvent) {
	if (event.target !== container && !container?.contains(event.target as Node)) return;

	switch (event.key.toLowerCase()) {
		case "i":
			insertTuple();
			break;
		case "v":
			vacuum();
			break;
		case "r":
			reset();
			break;
	}
}

onMount(() => {
	prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

	const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
	const handler = (e: MediaQueryListEvent) => {
		prefersReducedMotion = e.matches;
	};
	mediaQuery.addEventListener("change", handler);

	return () => {
		mediaQuery.removeEventListener("change", handler);
		gsap.killTweensOf(container?.querySelectorAll("*"));
	};
});
</script>

<div bind:this={container} class="postgres-page my-6 rounded-lg border-2 border-gray-300 p-4 transition-colors dark:border-gray-600" class:!border-amber-500={isNearFull && !isFull} class:!border-red-500={isFull} tabindex="0" role="application" aria-label="Interactive Postgres Page Visualization" onkeydown={handleKeydown}>
	<div class="mb-4 flex flex-wrap items-center justify-between gap-2">
		<h4 class="text-sm font-bold">Postgres Page (8KB)</h4>
		<div class="flex gap-2">
			<button onclick={insertTuple} disabled={isFull} class="rounded bg-green-600 px-3 py-1 text-xs font-medium text-white transition-opacity hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50" aria-label="Insert new row (keyboard: I)"> Insert Row </button>
			<button onclick={vacuum} disabled={deadCount === 0} class="rounded bg-amber-600 px-3 py-1 text-xs font-medium text-white transition-opacity hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50" aria-label="Vacuum dead tuples (keyboard: V)"> Vacuum </button>
			<button onclick={reset} disabled={tuples.length === 0} class="rounded bg-gray-600 px-3 py-1 text-xs font-medium text-white transition-opacity hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50" aria-label="Reset page (keyboard: R)"> Reset </button>
		</div>
	</div>

	<div class="page-structure relative flex min-h-80 flex-col overflow-hidden rounded border border-gray-300 bg-gray-50 dark:border-gray-600 dark:bg-gray-900">
		<div class="page-header flex items-center justify-between bg-purple-100 px-3 py-2 dark:bg-purple-900">
			<span class="text-xs font-medium">Page Header</span>
			<span class="text-xs opacity-70">24 bytes</span>
		</div>

		<div class="line-pointers border-b border-gray-300 bg-blue-50 px-3 py-2 dark:border-gray-600 dark:bg-blue-950">
			<div class="mb-1 text-xs font-medium">Line Pointers</div>
			<div class="flex min-h-6 flex-wrap gap-1">
				{#each tuples as tuple (tuple.id)}
					<div data-pointer-id={tuple.id} class="pointer-item flex items-center gap-1 rounded px-1.5 py-0.5 text-xs" class:bg-blue-100={!tuple.isDead} class:text-blue-800={!tuple.isDead} class:dark:bg-blue-900={!tuple.isDead} class:dark:text-blue-200={!tuple.isDead} class:bg-red-100={tuple.isDead} class:text-red-800={tuple.isDead} class:dark:bg-red-900={tuple.isDead} class:dark:text-red-200={tuple.isDead} class:line-through={tuple.isDead}>
						<span class="opacity-70">lp{tuple.id}</span>
						<span class="text-[10px]">→</span>
					</div>
				{/each}
				{#if tuples.length === 0}
					<span class="text-xs italic opacity-50">No pointers</span>
				{/if}
			</div>
		</div>

		<div class="free-space flex flex-1 items-center justify-center bg-gray-100 transition-all dark:bg-gray-800" style="min-height: {Math.max(20, freePercent)}px">
			<div class="text-center">
				<div class="text-xs font-medium opacity-70">Free Space</div>
				<div class="text-lg font-bold">{freePercent.toFixed(0)}%</div>
			</div>
		</div>

		<div class="tuples-area flex flex-col-reverse gap-1 border-t border-gray-300 bg-gray-50 p-2 dark:border-gray-600 dark:bg-gray-900">
			{#if tuples.length === 0}
				<div class="py-4 text-center text-xs italic opacity-50">No tuples - click "Insert Row" to add data</div>
			{:else}
				{#each tuples as tuple (tuple.id)}
					<button data-tuple-id={tuple.id} class="tuple-item flex items-center justify-between rounded px-3 py-2 text-left text-xs transition-colors" class:bg-green-100={!tuple.isDead} class:dark:bg-green-900={!tuple.isDead} class:hover:bg-green-200={!tuple.isDead} class:dark:hover:bg-green-800={!tuple.isDead} class:cursor-pointer={!tuple.isDead} class:tuple-dead={tuple.isDead} class:bg-red-100={tuple.isDead} class:dark:bg-red-900={tuple.isDead} class:cursor-not-allowed={tuple.isDead} onclick={() => deleteTuple(tuple.id)} disabled={tuple.isDead} aria-label={tuple.isDead ? `Dead tuple ${tuple.id}` : `Click to delete tuple ${tuple.id}`}>
						<span class="tuple-data font-mono" class:line-through={tuple.isDead} class:opacity-50={tuple.isDead}>
							({tuple.user_id}, '{tuple.name}', {tuple.age})
						</span>
						{#if tuple.isDead}
							<span class="ml-2 rounded bg-red-200 px-1.5 py-0.5 text-[10px] font-medium text-red-800 dark:bg-red-800 dark:text-red-200">DEAD</span>
						{/if}
					</button>
				{/each}
			{/if}
		</div>
	</div>

	<div class="mt-3 flex flex-wrap justify-between gap-2 text-xs">
		<div class="flex gap-3">
			<span>Live: <strong class="text-green-600 dark:text-green-400">{liveCount}</strong></span>
			<span>Dead: <strong class="text-red-600 dark:text-red-400">{deadCount}</strong></span>
		</div>
		<div class="flex gap-3">
			<span>Used: <strong>{usedPercent.toFixed(0)}%</strong></span>
			{#if deadPercent > 0}
				<span class="text-red-600 dark:text-red-400">Bloat: {deadPercent.toFixed(0)}%</span>
			{/if}
		</div>
	</div>

	<p class="mt-2 text-xs opacity-60">Click on a tuple to mark it as deleted. Use Vacuum to reclaim dead space.</p>
</div>
