# @fluidframework/eslint-config-fluid Changelog

## [5.8.0](https://github.com/microsoft/FluidFramework/releases/tag/eslint-config-fluid_v5.8_0)

Promotes the following rules from the `strict` ruleset to the `recommended` ruleset:

-   [@typescript-eslint/consistent-type-exports](https://typescript-eslint.io/rules/consistent-type-exports/)
-   [@typescript-eslint/consistent-type-imports](https://typescript-eslint.io/rules/consistent-type-imports/)
-   [@typescript-eslint/no-import-type-side-effects](https://typescript-eslint.io/rules/no-import-type-side-effects/)

## [5.7.4](https://github.com/microsoft/FluidFramework/releases/tag/eslint-config-fluid_v5.7.4)

Updates the contexts in which `jsdoc/require-jsdoc` is applied to make it less overzealous.
Specifically, removes the "VariableDeclaration" context, which would incorrectly trigger for variables that were not exported.

### Example

```typescript
/**
 * foo
 */
export function foo(): void {
	// Before the fix, because the outer scope, `foo`, was exported, this variable `bar` would be incorrectly flagged as needing a JSDoc/TSDoc comment.
	// After the fix, variables inside exported functions, like `bar`, are no longer flagged.
	const bar = "baz";
	...
}
```

## [5.7.3](https://github.com/microsoft/FluidFramework/releases/tag/eslint-config-fluid_v5.7.3)

Added support for two new patterns in the no-unchecked-record-access ESLint rule:

1. **Nullish Coalescing Assignment Recognition**

    - The rule now recognizes nullish coalescing assignment (`??=`) as a valid safety check
    - Properties accessed after a nullish coalescing assignment will not trigger warnings

2. **Else Block Assignment Handling**
    - Added detection for property assignments in else blocks of existence checks
    - Example pattern now supported:
        ```typescript
        if ("key" in obj) {
        	// use obj.key
        } else {
        	obj.key = defaultValue;
        	// use obj.key
        }
        ```
    - The rule understands that after the else block assignment, the property is safe to use
    - Works with both direct property access and computed property access

## [5.7.2](https://github.com/microsoft/FluidFramework/releases/tag/eslint-config-fluid_v5.7.2)

Disabled the [unicorn/no-array-push-push](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-array-push-push.md) rule, which reports false positives for methods named "push" on non-array objects.

## [5.6.0](https://github.com/microsoft/FluidFramework/releases/tag/eslint-config-fluid_v5.6.0)

### New config for use with Biome linter

A new strict-biome config is available that disables all rules that Biome's recommended config includes.
This config is intended to be used in projects that use both eslint and Biome for linting.
This config is considered experimental.

### Auto-fix behavior change for @typescript-eslint/consistent-type-exports

Update auto-fix policy for `@typescript-eslint/consistent-type-exports` to prefer inline `type` annotations, rather than splitting exports into type-only and non-type-only groups.
This makes it easier to tell at a glance how the auto-fix changes affect individual exports when a list of exports is large.
It also makes it easier to detect issues in edge-cases where the the rule is applied incorrectly.

E.g.:

```typescript
export { type Foo, Bar } from "./baz.js";
```

instead of:

```typescript
export type { Foo } from "./baz.js";
export { Bar } from "./baz.js";
```

## [5.5.1](https://github.com/microsoft/FluidFramework/releases/tag/eslint-config-fluid_v5.5.1)

### Disabled rules

The formatting-related rules below have been disabled in all configs because we use biome or prettier to enforce
formatting conventions. In addition, most of these rules are now deprecated because linters are decreasing their focus
on formatting-related rules in favor of dedicated formatting tools.

#### typescript-eslint

-   @typescript-eslint/comma-spacing
-   @typescript-eslint/func-call-spacing
-   @typescript-eslint/keyword-spacing
-   @typescript-eslint/member-delimiter-style
-   @typescript-eslint/object-curly-spacing
-   @typescript-eslint/semi
-   @typescript-eslint/space-before-function-paren
-   @typescript-eslint/space-infix-ops
-   @typescript-eslint/type-annotation-spacing

#### eslint

All rules below are deprecated. See <https://eslint.org/docs/latest/rules/#deprecated>

-   array-bracket-spacing
-   arrow-spacing
-   block-spacing
-   dot-location
-   jsx-quotes
-   key-spacing
-   space-unary-ops
-   switch-colon-spacing

### Better test pattern support

Update rule overrides for test code to better support patterns in the repo.
Namely, adds the allowance to "\*\*/tests" directories.

## [5.4.0](https://github.com/microsoft/FluidFramework/releases/tag/eslint-config-fluid_v5.4.0)

### New no-unchecked-record-access rule

Enabled new no-unchecked-record-access rule to enforce safe property access on index signature types.

### Disabled rules

The following rules have been disabled in all configs because they conflict with formatter settings:

-   [@typescript-eslint/brace-style](https://typescript-eslint.io/rules/brace-style)
-   [unicorn/number-literal-case](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v48.0.1/docs/rules/number-literal-case.md)

The following rules have been disabled for test code:

-   [unicorn/prefer-module](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v48.0.1/docs/rules/prefer-module.md)

The following rules have been disabled due to frequency of false-positives reported:

-   [unicorn/no-useless-spread](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v48.0.1/docs/rules/no-useless-spread.md)

### @typescript-eslint/explicit-function-return-type changes

The [allowExpressions](https://typescript-eslint.io/rules/explicit-function-return-type/#allowexpressions) option for
the @typescript-eslint/explicit-function-return-type rule has been set to `true`.

### @typescript-eslint/no-explicit-any changes

The [ignoreRestArgs](https://typescript-eslint.io/rules/no-explicit-any#ignorerestargs) option for
the @typescript-eslint/no-explicit-any rule has been set to `true`.

### import/no-internal-modules changes

All imports from @fluid-experimental packages are now permitted.

## [5.3.0](https://github.com/microsoft/FluidFramework/releases/tag/eslint-config-fluid_v5.3.0)

The import/order rule is enabled with the following settings:

```json
[
	"error",
	{
		"newlines-between": "always",
		"alphabetize": {
			"order": "asc",
			"caseInsensitive": false
		}
	}
]
```

### eslint-import-resolver-typescript preferred over node

Lint configurations previously specified both the `node` and `typescript` [resolvers](https://github.com/import-js/eslint-plugin-import?tab=readme-ov-file#resolvers), with the `node` resolver taking precedence.

The precedence has been reversed in this release: [eslint-import-resolver-typescript](https://github.com/import-js/eslint-import-resolver-typescript) is now the preferred resolver.

This may result in lint rules dependent on imported _types_ (rather than values) to correctly apply, e.g. `import/no-deprecated`.

### allow-ff-test-exports condition enabled

The typescript import resolver now enables the "allow-ff-test-exports" condition, which adds support for linting files which reference FluidFramework test-only exports,
such as id-compressor and merge-tree.

## [5.2.0](https://github.com/microsoft/FluidFramework/releases/tag/eslint-config-fluid_v5.2.0)

The import/order rule is now disabled in all configs.

## [5.1.0](https://github.com/microsoft/FluidFramework/releases/tag/eslint-config-fluid_v5.1.0)

Enables new API trimming rules.

## [5.0.0](https://github.com/microsoft/FluidFramework/releases/tag/eslint-config-fluid_v5.0.0)

Adds eslint-plugin-fluid to eslint-config-fluid. This new dependency adds new Fluid-specific rules.

## [4.0.0](https://github.com/microsoft/FluidFramework/releases/tag/eslint-config-fluid_v4.0.0)

Deprecates this package's `minimal` configuration.
Consumers of that configuration will need to update their imports to refer to the renamed module: `minimal-deprecated.js`.

## [3.0.0](https://github.com/microsoft/FluidFramework/releases/tag/eslint-config-fluid_v3.0.0)

### Update eslint-related dependencies

eslint has been updated to version ~8.49.0. eslint plugins have also been updated to the latest version.

### Update prettier

prettier has been updated to version ~3.0.3.

### Update #16699 typescript-eslint

typescript-eslint has been updated to version ~6.7.2.

## [2.1.0](https://github.com/microsoft/FluidFramework/releases/tag/eslint-config-fluid_v2.1.0)

### Enable the import-no-deprecated rule

The [import/no-deprecated](https://github.com/import-js/eslint-plugin-import/blob/main/docs/rules/no-deprecated.md) rule
is now enabled for all configs except test files.
