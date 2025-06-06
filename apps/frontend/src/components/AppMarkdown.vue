<template>
	<!-- eslint-disable-next-line vue/no-v-html -->
	<div class="markdown-body" v-html="sanitizedHtml"></div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { marked } from "marked";
import DOMPurify from "dompurify";

const props = defineProps<{
	md: string;
}>();

const sanitizedHtml = computed(() => {
	return DOMPurify.sanitize(marked.parse(props.md, { async: false }));
});
</script>

<style>
.markdown-body {
	font-family:
		-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica,
		Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji";
	font-size: 16px;
	line-height: 1.5;
	word-wrap: break-word;

	--fgColor-danger: var(--ui-error);
	--color-danger-fg: var(--ui-text);
	--base-size-4: 0.25rem;
	--base-size-8: 0.5rem;
	--base-size-16: 1rem;
	--base-size-24: 1.5rem;
	--borderColor-default: var(--ui-border);
	--color-border-default: var(--ui-border);
	--fgColor-muted: var(--ui-text-muted);
	--color-fg-muted: var(--ui-text-muted);
	--base-text-weight-semibold: var(--font-weight-semibold);
	--fgColor-default: var(--ui-text);
	--color-fg-default: var(--ui-text);
	--borderColor-muted: var(--ui-border-muted);
	--color-border-muted: var(--ui-border-muted);
	--bgColor-default: var(--ui-bg);
	--color-canvas-default: var(--ui-bg);
	--bgColor-muted: var(--ui-bg-muted);
	--color-canvas-subtle: var(--ui-bg-muted);
	--bgColor-neutral-muted: var(--ui-bg-muted);
	--color-neutral-muted: var(--ui-bg-muted);
	--borderColor-accent-emphasis: var(--ui-border-accented);
	--color-accent-emphasis: var(--ui-border-accented);
}
.markdown-body::before {
	display: table;
	content: "";
}
.markdown-body::after {
	display: table;
	clear: both;
	content: "";
}
.markdown-body > *:first-child {
	margin-top: 0 !important;
}
.markdown-body > *:last-child {
	margin-bottom: 0 !important;
}
.markdown-body a {
	color: var(--ui-info);
	text-decoration: underline;
}
.markdown-body a:not([href]) {
	color: inherit;
	text-decoration: none;
}
.markdown-body .absent {
	color: var(--fgColor-danger, var(--color-danger-fg));
}
.markdown-body .anchor {
	float: left;
	padding-right: var(--base-size-4);
	margin-left: -20px;
	line-height: 1;
}
.markdown-body .anchor:focus {
	outline: none;
}
.markdown-body p,
.markdown-body blockquote,
.markdown-body ul,
.markdown-body ol,
.markdown-body dl,
.markdown-body table,
.markdown-body pre,
.markdown-body details {
	margin-top: 0;
	margin-bottom: var(--base-size-16);
}
.markdown-body hr {
	height: 0.25em;
	padding: 0;
	margin: var(--base-size-24) 0;
	background-color: var(--borderColor-default, var(--color-border-default));
	border: 0;
}
.markdown-body blockquote {
	padding: 0 1em;
	color: var(--fgColor-muted, var(--color-fg-muted));
	border-left: 0.25em solid
		var(--borderColor-default, var(--color-border-default));
}
.markdown-body blockquote > :first-child {
	margin-top: 0;
}
.markdown-body blockquote > :last-child {
	margin-bottom: 0;
}
.markdown-body h1,
.markdown-body h2,
.markdown-body h3,
.markdown-body h4,
.markdown-body h5,
.markdown-body h6 {
	margin-top: var(--base-size-16);
	margin-bottom: var(--base-size-16);
	font-weight: var(--base-text-weight-semibold, 600);
	line-height: 1.25;
}
.markdown-body h1 .octicon-link,
.markdown-body h2 .octicon-link,
.markdown-body h3 .octicon-link,
.markdown-body h4 .octicon-link,
.markdown-body h5 .octicon-link,
.markdown-body h6 .octicon-link {
	color: var(--fgColor-default, var(--color-fg-default));
	vertical-align: middle;
	visibility: hidden;
}
.markdown-body h1:hover .anchor,
.markdown-body h2:hover .anchor,
.markdown-body h3:hover .anchor,
.markdown-body h4:hover .anchor,
.markdown-body h5:hover .anchor,
.markdown-body h6:hover .anchor {
	text-decoration: none;
}
.markdown-body h1:hover .anchor .octicon-link,
.markdown-body h2:hover .anchor .octicon-link,
.markdown-body h3:hover .anchor .octicon-link,
.markdown-body h4:hover .anchor .octicon-link,
.markdown-body h5:hover .anchor .octicon-link,
.markdown-body h6:hover .anchor .octicon-link {
	visibility: visible;
}
.markdown-body h1 tt,
.markdown-body h1 code,
.markdown-body h2 tt,
.markdown-body h2 code,
.markdown-body h3 tt,
.markdown-body h3 code,
.markdown-body h4 tt,
.markdown-body h4 code,
.markdown-body h5 tt,
.markdown-body h5 code,
.markdown-body h6 tt,
.markdown-body h6 code {
	padding: 0 0.2em;
	font-size: inherit;
}
.markdown-body h1 {
	margin-top: calc(var(--base-size-16) * 2);
	padding-bottom: 0.3em;
	font-size: 2em;
	border-bottom: 1px solid var(--borderColor-muted, var(--color-border-muted));
}
.markdown-body h2 {
	margin-top: calc(var(--base-size-16) * 2);
	padding-bottom: 0.3em;
	font-size: 1.5em;
	border-bottom: 1px solid var(--borderColor-muted, var(--color-border-muted));
}
.markdown-body h3 {
	margin-top: calc(var(--base-size-16) * 1.5);
	font-size: 1.25em;
}
.markdown-body h4 {
	margin-top: calc(var(--base-size-16) * 1.375);
	font-size: 1em;
}
.markdown-body h5 {
	font-size: 0.875em;
}
.markdown-body h6 {
	font-size: 0.85em;
	color: var(--fgColor-muted, var(--color-fg-muted));
}

.markdown-body details summary {
	cursor: pointer;
}

.markdown-body summary h1,
.markdown-body summary h2,
.markdown-body summary h3,
.markdown-body summary h4,
.markdown-body summary h5,
.markdown-body summary h6 {
	display: inline-block;
}
.markdown-body summary h1 .anchor,
.markdown-body summary h2 .anchor,
.markdown-body summary h3 .anchor,
.markdown-body summary h4 .anchor,
.markdown-body summary h5 .anchor,
.markdown-body summary h6 .anchor {
	margin-left: -40px;
}
.markdown-body summary h1,
.markdown-body summary h2 {
	padding-bottom: 0;
	border-bottom: 0;
}
.markdown-body ul,
.markdown-body ol {
	padding-left: 2em;
	list-style-type: disc;
}
.markdown-body ul.no-list,
.markdown-body ol.no-list {
	padding: 0;
	list-style-type: none;
}
.markdown-body ol[type="a s"] {
	list-style-type: lower-alpha;
}
.markdown-body ol[type="A s"] {
	list-style-type: upper-alpha;
}
.markdown-body ol[type="i s"] {
	list-style-type: lower-roman;
}
.markdown-body ol[type="I s"] {
	list-style-type: upper-roman;
}
.markdown-body ol[type="1"] {
	list-style-type: decimal;
}
.markdown-body div > ol:not([type]) {
	list-style-type: decimal;
}
.markdown-body ul ul,
.markdown-body ul ol,
.markdown-body ol ol,
.markdown-body ol ul {
	margin-top: 0;
	margin-bottom: 0;
}
.markdown-body li > p {
	margin-top: var(--base-size-16);
}
.markdown-body li + li {
	margin-top: 0.25em;
}
.markdown-body dl {
	padding: 0;
}
.markdown-body dl dt {
	padding: 0;
	margin-top: var(--base-size-16);
	font-size: 1em;
	font-style: italic;
	font-weight: var(--base-text-weight-semibold, 600);
}
.markdown-body dl dd {
	padding: 0 var(--base-size-16);
	margin-bottom: var(--base-size-16);
}
.markdown-body table {
	display: block;
	width: 100%;
	width: max-content;
	max-width: 100%;
	overflow: auto;
	font-variant: tabular-nums;
}
.markdown-body table th {
	font-weight: var(--base-text-weight-semibold, 600);
}
.markdown-body table th,
.markdown-body table td {
	padding: 6px 13px;
	border: 1px solid var(--borderColor-default, var(--color-border-default));
}
.markdown-body table td > :last-child {
	margin-bottom: 0;
}
.markdown-body table tr {
	background-color: var(--bgColor-default, var(--color-canvas-default));
	border-top: 1px solid var(--borderColor-muted, var(--color-border-muted));
}
.markdown-body table tr:nth-child(2n) {
	background-color: var(--bgColor-muted, var(--color-canvas-subtle));
}
.markdown-body table img {
	background-color: transparent;
}
.markdown-body img {
	max-width: 100%;
	box-sizing: content-box;
}
.markdown-body img[align="right"] {
	padding-left: 20px;
}
.markdown-body img[align="left"] {
	padding-right: 20px;
}
.markdown-body .emoji {
	max-width: none;
	vertical-align: text-top;
	background-color: transparent;
}
.markdown-body span.frame {
	display: block;
	overflow: hidden;
}
.markdown-body span.frame > span {
	display: block;
	float: left;
	width: auto;
	padding: 7px;
	margin: 13px 0 0;
	overflow: hidden;
	border: 1px solid var(--borderColor-default, var(--color-border-default));
}
.markdown-body span.frame span img {
	display: block;
	float: left;
}
.markdown-body span.frame span span {
	display: block;
	padding: 5px 0 0;
	clear: both;
	color: var(--fgColor-default, var(--color-fg-default));
}
.markdown-body span.align-center {
	display: block;
	overflow: hidden;
	clear: both;
}
.markdown-body span.align-center > span {
	display: block;
	margin: 13px auto 0;
	overflow: hidden;
	text-align: center;
}
.markdown-body span.align-center span img {
	margin: 0 auto;
	text-align: center;
}
.markdown-body span.align-right {
	display: block;
	overflow: hidden;
	clear: both;
}
.markdown-body span.align-right > span {
	display: block;
	margin: 13px 0 0;
	overflow: hidden;
	text-align: right;
}
.markdown-body span.align-right span img {
	margin: 0;
	text-align: right;
}
.markdown-body span.float-left {
	display: block;
	float: left;
	margin-right: 13px;
	overflow: hidden;
}
.markdown-body span.float-left span {
	margin: 13px 0 0;
}
.markdown-body span.float-right {
	display: block;
	float: right;
	margin-left: 13px;
	overflow: hidden;
}
.markdown-body span.float-right > span {
	display: block;
	margin: 13px auto 0;
	overflow: hidden;
	text-align: right;
}
.markdown-body code,
.markdown-body tt {
	padding: 0.2em 0.4em;
	margin: 0;
	font-size: 85%;
	white-space: break-spaces;
	background-color: var(--bgColor-neutral-muted, var(--color-neutral-muted));
	border-radius: 6px;
}
.markdown-body code br,
.markdown-body tt br {
	display: none;
}
.markdown-body del code {
	text-decoration: inherit;
}
.markdown-body samp {
	font-size: 85%;
}
.markdown-body pre {
	word-wrap: normal;
}
.markdown-body pre code {
	font-size: 100%;
}
.markdown-body pre > code {
	padding: 0;
	margin: 0;
	word-break: normal;
	white-space: pre;
	background: transparent;
	border: 0;
}
.markdown-body .highlight {
	margin-bottom: var(--base-size-16);
}
.markdown-body .highlight pre {
	margin-bottom: 0;
	word-break: normal;
}
.markdown-body .highlight pre,
.markdown-body pre {
	padding: var(--base-size-16);
	overflow: auto;
	font-size: 85%;
	line-height: 1.45;
	color: var(--fgColor-default, var(--color-fg-default));
	background-color: var(--bgColor-muted, var(--color-canvas-subtle));
	border-radius: 6px;
}
.markdown-body pre code,
.markdown-body pre tt {
	display: inline;
	max-width: auto;
	padding: 0;
	margin: 0;
	overflow: visible;
	line-height: inherit;
	word-wrap: normal;
	background-color: transparent;
	border: 0;
}
.markdown-body .csv-data td,
.markdown-body .csv-data th {
	padding: 5px;
	overflow: hidden;
	font-size: 12px;
	line-height: 1;
	text-align: left;
	white-space: nowrap;
}
.markdown-body .csv-data .blob-num {
	padding: 10px var(--base-size-8) 9px;
	text-align: right;
	background: var(--bgColor-default, var(--color-canvas-default));
	border: 0;
}
.markdown-body .csv-data tr {
	border-top: 0;
}
.markdown-body .csv-data th {
	font-weight: var(--base-text-weight-semibold, 600);
	background: var(--bgColor-muted, var(--color-canvas-subtle));
	border-top: 0;
}
.markdown-body [data-footnote-ref]::before {
	content: "[";
}
.markdown-body [data-footnote-ref]::after {
	content: "]";
}
.markdown-body .footnotes {
	font-size: 12px;
	color: var(--fgColor-muted, var(--color-fg-muted));
	border-top: 1px solid var(--borderColor-default, var(--color-border-default));
}
.markdown-body .footnotes ol {
	padding-left: var(--base-size-16);
}
.markdown-body .footnotes ol ul {
	display: inline-block;
	padding-left: var(--base-size-16);
	margin-top: var(--base-size-16);
}
.markdown-body .footnotes li {
	position: relative;
}
.markdown-body .footnotes li:target::before {
	position: absolute;
	top: calc(var(--base-size-8) * -1);
	right: calc(var(--base-size-8) * -1);
	bottom: calc(var(--base-size-8) * -1);
	left: calc(var(--base-size-24) * -1);
	pointer-events: none;
	content: "";
	border: 2px solid
		var(--borderColor-accent-emphasis, var(--color-accent-emphasis));
	border-radius: 6px;
}
.markdown-body .footnotes li:target {
	color: var(--fgColor-default, var(--color-fg-default));
}
.markdown-body .footnotes .data-footnote-backref g-emoji {
	font-family: monospace;
}
</style>
