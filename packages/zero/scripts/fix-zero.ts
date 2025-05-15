const generatedSchema = Bun.file(
	Bun.resolveSync("../src/zero-schema.gen.ts", import.meta.dir),
);

// Replace the import statement for drizzle-zero.config with drizzle-zero.config.js
const generatedSchemaContent = await generatedSchema.text();

const updatedContent = generatedSchemaContent
	.replace(/\"\.\/drizzle-zero\.config\"/g, '"./drizzle-zero.config.js"')
	.replace(/biome-ignore-all/g, "biome-ignore: generated file");

await generatedSchema.write(updatedContent);
