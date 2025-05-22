<script setup lang="ts">
import {
	DropdownMenuArrow,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuItemIndicator,
	DropdownMenuLabel,
	DropdownMenuPortal,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuRoot,
	DropdownMenuSeparator,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
} from "reka-ui";
import { ref } from "vue";

const toggleState = ref(false);
const availableFilters = ref([
	{
		label: "Author",
		icon: "i-lucide-user",
		options: [
			{
				label: "Kenda",
				sublabel: "1 pr",
				value: "1",
			},
			{
				label: "Carrell",
				sublabel: "5 prs",
				value: "2",
			},
		],
	},
	{
		label: "Labels",
		icon: "i-lucide-tags",
		options: [
			{
				label: "bug",
				sublabel: "3 prs",
				value: "bug",
			},
			{
				label: "dependencies",
				value: "dependencies",
			},
			{
				label: "chore",
				value: "chore",
			},
		],
	},
]);

const filters = ref(false);
</script>

<template>
	<DropdownMenuRoot v-model:open="toggleState">
		<DropdownMenuTrigger>
			<UButton icon="i-lucide-list-filter" color="neutral" variant="ghost">
				<span v-if="!filters"> Filter </span>
			</UButton>
		</DropdownMenuTrigger>

		<DropdownMenuPortal>
			<DropdownMenuContent
				class="w-50 bg-default border border-default rounded"
                align="start"
			>
				<DropdownMenuSub v-for="filter in availableFilters" :key="filter.label">
					<DropdownMenuSubTrigger
						class="flex items-center justify-between hover:bg-elevated rounded mx-1 my-1"
					>
						<div class="flex items-center gap-1">
							<UIcon :name="filter.icon" />
							{{ filter.label }}
						</div>
						<div>
							<UIcon name="radix-icons:chevron-right" />
						</div>
					</DropdownMenuSubTrigger>
					<DropdownMenuPortal>
						<DropdownMenuSubContent
							:side-offset="2"
							:align-offset="-5"
							class="bg-default border border-default rounded"
						>
							<DropdownMenuItem
								v-for="option in filter.options"
								:key="option.value"
								class="flex items-baseline gap-4"
							>
								{{ option.label }}
								<div class="text-muted text-sm">
									{{ option.sublabel }}
								</div>
							</DropdownMenuItem>
						</DropdownMenuSubContent>
					</DropdownMenuPortal>
				</DropdownMenuSub>
			</DropdownMenuContent>
		</DropdownMenuPortal>
	</DropdownMenuRoot>
</template>
