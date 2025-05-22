<script setup lang="ts">
import {
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuItemIndicator,
	DropdownMenuPortal,
	DropdownMenuRoot,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
} from "reka-ui";

defineProps<{
	availableFilters: {
		label: string;
		value: string;
		icon: string;
		options: {
			label: string;
			sublabel?: string;
			value: string;
		}[];
	}[];
}>();

const selectedFilters = defineModel<Map<string, boolean>>({
	default: new Map<string, boolean>(),
});

const handleFilterChange = (
	filterType: string,
	value: string,
	checked: boolean,
) => {
	const key = `${filterType}:${value}`;
	selectedFilters.value.set(key, checked);
};

const isFilterSelected = (filterType: string, value: string) => {
	const key = `${filterType}:${value}`;
	return selectedFilters.value.get(key) || false;
};
</script>

<template>
	<DropdownMenuRoot>
		<DropdownMenuTrigger>
			<UButton
				icon="i-lucide-list-filter"
				size="sm"
				color="neutral"
				variant="ghost"
			>
				<span v-if="selectedFilters.size === 0"> Filter </span>
			</UButton>
		</DropdownMenuTrigger>

		<DropdownMenuPortal>
			<DropdownMenuContent
				class="w-50 bg-default border border-default rounded p-1"
				align="start"
			>
				<DropdownMenuSub v-for="filter in availableFilters" :key="filter.value">
					<DropdownMenuSubTrigger
						class="flex items-center justify-between hover:bg-elevated data-[state=open]:bg-elevated rounded px-2 py-1.5 text-sm cursor-default select-none"
					>
						<div class="flex items-center gap-1 cursor-default select-none">
							<UIcon :name="filter.icon" />
							{{ filter.label }}
						</div>
						<div class="cursor-default select-none">
							<UIcon name="radix-icons:chevron-right" />
						</div>
					</DropdownMenuSubTrigger>
					<DropdownMenuPortal>
						<DropdownMenuSubContent
							:side-offset="2"
							:align-offset="-5"
							class="bg-default border border-default rounded p-1"
						>
							<DropdownMenuCheckboxItem
								v-for="option in filter.options"
								:key="option.value"
								:model-value="isFilterSelected(filter.value, option.value)"
								class="flex items-center group text-sm rounded hover:bg-elevated data-[state=open]:bg-elevated p-1.5 cursor-default select-none"
								@update:model-value="
									(checked) =>
										handleFilterChange(filter.value, option.value, checked)
								"
							>
								<DropdownMenuItemIndicator
									:force-mount="true"
									class="w-4 h-4 flex items-center justify-center cursor-default select-none"
								>
									<UCheckbox
										:model-value="isFilterSelected(filter.value, option.value)"
										:class="[
											isFilterSelected(filter.value, option.value)
												? 'opacity-100'
												: 'opacity-0 group-hover:opacity-100',
										]"
										class="transition-opacity cursor-default select-none"
										:ui="{
											base: 'hover:ring-primary',
										}"
										size="sm"
										@click.stop
										@update:model-value="
											(value: boolean | 'indeterminate') =>
												handleFilterChange(
													filter.value,
													option.value,
													value === true,
												)
										"
									/>
								</DropdownMenuItemIndicator>
								<div
									class="flex items-baseline pl-1 gap-2 cursor-default select-none"
								>
									{{ option.label }}
									<div class="text-muted text-xs cursor-default select-none">
										{{ option.sublabel }}
									</div>
								</div>
							</DropdownMenuCheckboxItem>
						</DropdownMenuSubContent>
					</DropdownMenuPortal>
				</DropdownMenuSub>
			</DropdownMenuContent>
		</DropdownMenuPortal>
	</DropdownMenuRoot>
</template>
