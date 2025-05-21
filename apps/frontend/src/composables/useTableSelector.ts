import { watch, ref, toValue, type MaybeRefOrGetter, computed } from "vue";
import type { Table, Row } from "@tanstack/table-core";

export function useTableSelector<
	T extends { id: string } | { item: { id: string } },
>(
	table: MaybeRefOrGetter<{
		tableRef?: HTMLTableElement;
		tableApi?: Table<T>;
	} | null>,
	onSelect?: (row: Row<T>, e: Event) => void,
) {
	function getOriginal(
		// eslint-disable-next-line
		row: Row<any>,
	): T extends { item: unknown } ? T["item"] : T {
		if (
			row.original &&
			typeof row.original === "object" &&
			"item" in row.original
		) {
			return row.original.item;
		}

		return row.original;
	}

	const tableApi = computed(() => toValue(table)?.tableApi);
	const tableRef = computed(() => toValue(table)?.tableRef);

	const rows = computed(() => {
		if (!tableApi.value) {
			return [];
		}
		return tableApi.value?.getRowModel().rows ?? [];
	});

	watch(
		[tableRef, rows],
		([newTableRef, newRows]) => {
			if (!newTableRef) {
				return;
			}

			const tbody = newTableRef.querySelector("tbody");
			tbody?.addEventListener("mouseleave", () => handleRowHover());

			const rowEls = tbody?.querySelectorAll("tr");
			rowEls?.forEach((rowEl, idx) => {
				rowEl.addEventListener("hover", () => {
					const row = newRows[idx];
					handleRowHover(row);
				});

				rowEl.addEventListener("mousemove", () => {
					const row = newRows[idx];
					handleRowHover(row);
				});

				rowEl.addEventListener("click", (e) => {
					const row = newRows[idx];
					handleRowSelect(row, e);
				});

				if (newRows[idx]) {
					rowEl.setAttribute(
						"data-list-key",
						`${getOriginal(newRows[idx]).id}`,
					);
				}
			});
		},
		{ immediate: true, deep: true },
	);

	const hoveredRow = ref<{
		row: Row<T>;
		kind: "hover" | "focus";
	} | null>(null);

	watch([hoveredRow, tableRef], ([hoveredRow, newTableRef]) => {
		const rowEls = newTableRef?.querySelectorAll("tbody tr");

		for (const [idx, rowEl] of rowEls?.entries() ?? []) {
			const row = rows.value[idx];

			const isActive = row && row?.id === hoveredRow?.row?.id;

			if (isActive) {
				rowEl.setAttribute("data-focused", hoveredRow.kind);
			} else {
				rowEl.removeAttribute("data-focused");
			}
		}
	});

	function getVisibleRowCount() {
		return Math.floor(window.innerHeight / 52);
	}

	function pageUp() {
		moveSelection("up", getVisibleRowCount());
	}

	function pageDown() {
		moveSelection("down", getVisibleRowCount());
	}

	defineShortcuts({
		k: up,
		ArrowUp: up,
		j: down,
		ArrowDown: down,
		ctrl_u: pageUp,
		ctrl_d: pageDown,
		"g-g": () => setSelection(0),
		o: () => {
			if (!hoveredRow.value) {
				return;
			}

			const id = getOriginal(hoveredRow.value.row).id;
			document
				.querySelector(`[data-list-key="${id}"]`)
				?.querySelector("a")
				?.click();
		},
		shift_g: () => setSelection(rows.value.length - 1),
		Escape: () => {
			hoveredRow.value = null;
		},
	});

	watch(hoveredRow, (newVal) => {
		if (!newVal) {
			return;
		}

		const linkToFocus = tableRef.value
			?.querySelector(`[data-list-key="${getOriginal(newVal.row).id}"]`)
			?.querySelector("a");

		if (!linkToFocus) {
			// rowVirtualizer.value.scrollToIndex(newVal.row.index, {
			// 	align: "center",
			// 	behavior: "auto",
			// });
		} else {
			linkToFocus.focus();

			if (newVal.kind === "focus") {
				linkToFocus.scrollIntoView({
					block: "nearest",
					inline: "nearest",
				});
			}
		}
	});

	function setSelection(index: number) {
		if (index < 0 || index >= rows.value.length) {
			return;
		}

		hoveredRow.value = { row: rows.value[index], kind: "focus" };
	}

	function moveSelection(direction: "up" | "down", amount: number = 1) {
		if (!hoveredRow.value) {
			hoveredRow.value = { row: rows.value[0], kind: "focus" };
			return;
		}

		const currentIndex = rows.value.findIndex(
			(row) => row.id === hoveredRow.value?.row.id,
		);
		const newIndex =
			direction === "up"
				? Math.max(currentIndex - amount, 0)
				: Math.min(currentIndex + amount, rows.value.length - 1);

		hoveredRow.value = { row: rows.value[newIndex], kind: "focus" };
	}

	function up() {
		moveSelection("up");
	}

	function down() {
		moveSelection("down");
	}

	function handleRowHover(row?: Row<T>, e?: Event) {
		if (!row) {
			if (hoveredRow.value?.kind === "hover") {
				hoveredRow.value = null;
			}
			return;
		}

		if (hoveredRow.value && hoveredRow.value.row?.id === row.id) {
			return;
		}

		hoveredRow.value = { row, kind: e?.type === "focus" ? "focus" : "hover" };
	}

	function handleRowSelect(row: Row<T>, e: Event) {
		if (!onSelect) {
			return;
		}
		const target = e.target as HTMLElement;
		const isInteractive = target.closest("button") || target.closest("a");
		if (isInteractive) {
			return;
		}

		e.preventDefault();
		e.stopPropagation();

		onSelect(row, e);
	}

	return { hoveredRow, handleRowHover };
}
