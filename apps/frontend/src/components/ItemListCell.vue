<script setup lang="ts" generic="T extends RowData">
import type { Cell, RowData } from "@tanstack/table-core";
import { computed } from "vue";
import { FlexRender } from "@tanstack/vue-table";
import { useRouter } from "#imports";

const props = defineProps<{
	cell: Cell<T, unknown>;
	link?: string;
	ui?: unknown;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	td: (opts: any) => string;
}>();

const emit = defineEmits<{
	focus: [event: Event];
}>();

const cellClass = computed(() => {
	return props.td({
		class: [
			"table-cell",
			props.ui,
			props.cell.column.columnDef.meta?.class?.td,
		],
		pinned: !!props.cell.column.getIsPinned(),
	});
});

const router = useRouter();

function isPrimaryMouseButton(e: MouseEvent) {
	return !(e.ctrlKey || e.metaKey || e.altKey || e.shiftKey || e.button !== 0);
}
</script>

<template>
	<td
		:key="cell.id"
		:data-pinned="cell.column.getIsPinned()"
		:class="link ? 'contents' : cellClass"
	>
		<slot :name="`${cell.column.id}-cell`" v-bind="cell.getContext()">
			<router-link
				v-if="link"
				:to="link"
				:class="cellClass"
				class="hover:text-unset"
				:tabindex="props.cell.column.getIndex() === 0 ? 0 : -1"
				@focus="emit('focus', $event)"
				@mousedown="
					if (isPrimaryMouseButton($event)) {
						$event.preventDefault();
						router.push(link);
					}
				"
			>
				<FlexRender
					:render="cell.column.columnDef.cell"
					:props="cell.getContext()"
				/>
			</router-link>
			<FlexRender
				v-else
				:render="cell.column.columnDef.cell"
				:props="cell.getContext()"
			/>
		</slot>
	</td>
</template>
