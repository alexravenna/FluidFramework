/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

import { assert } from "@fluidframework/core-utils";
import { fail } from "../util";
import {
	ObjectNodeSchema,
	AllowedTypes,
	FieldNodeSchema,
	MapNodeSchema,
	FlexTreeNode,
	FlexTreeObjectNode,
	FlexTreeFieldNode,
	FlexTreeMapNode,
} from "../feature-libraries";
import { TreeObjectNode, TreeMapNode, TreeNode } from "./types";
import { TreeListNodeOld } from "./treeListNode";

/** Associates an FlexTreeNode with a target object  */
const targetSymbol = Symbol("FlexNodeTarget");
interface HasTarget {
	[targetSymbol]: TreeNode;
}

/**
 * This is intentionally a WeakMap, rather than a private symbol (e.g. like `targetSymbol`).
 * The map behaves essentially the same, except that performing a lookup in the map will not perform a property read/get on the key object (as is the case with a symbol).
 * Since `SharedTreeNodes` are proxies with non-trivial `get` traps, this choice is meant to prevent the confusion of the lookup passing through multiple objects
 * via the trap, or the trap not properly handling the special symbol, etc.
 */
const flexNodeMap = new WeakMap<TreeNode, FlexTreeNode>();

/**
 * Retrieves the flex node associated with the given target via {@link setFlexNode}.
 * @remarks Fails if the flex node has not been set.
 */
export function getFlexNode<TSchema extends ObjectNodeSchema>(
	target: TreeObjectNode<TSchema>,
): FlexTreeObjectNode;
export function getFlexNode<TTypes extends AllowedTypes>(
	target: TreeListNodeOld<TTypes>,
): FlexTreeFieldNode<FieldNodeSchema>;
export function getFlexNode<TSchema extends MapNodeSchema>(
	target: TreeMapNode<TSchema>,
): FlexTreeMapNode<TSchema>;
export function getFlexNode(target: TreeNode): FlexTreeNode;
export function getFlexNode(target: TreeNode): FlexTreeNode {
	return flexNodeMap.get(target) ?? fail("Target is not associated with an eflexdit node");
}

/**
 * Retrieves the flex node associated with the given target via {@link setFlexNode}, if any.
 */
export function tryGetFlexNode(target: unknown): FlexTreeNode | undefined {
	if (typeof target === "object" && target !== null) {
		return flexNodeMap.get(target as TreeNode);
	}
	return undefined;
}

/**
 * Retrieves the target associated with the given flex node via {@link setFlexNode}, if any.
 */
export function tryGetFlexNodeTarget(flexNode: FlexTreeNode): TreeNode | undefined {
	return (flexNode as Partial<HasTarget>)[targetSymbol];
}

/**
 * Associate the given target object and the given flex node.
 * @returns The target object
 * @remarks
 * This creates a 1:1 mapping between the target and tree node.
 * Either can be retrieved from the other via {@link getFlexNode}/{@link tryGetFlexNode} or {@link tryGetFlexNodeTarget}.
 * If the given target is already mapped to an flex node, the existing mapping will be overwritten.
 * If the given flex node is already mapped to a different target, this function will fail.
 */
export function setFlexNode<T extends TreeNode>(target: T, flexNode: FlexTreeNode): T {
	assert(
		tryGetFlexNodeTarget(flexNode) === undefined,
		0x7f5 /* Cannot associate an flex node with multiple targets */,
	);
	delete (flexNodeMap.get(target) as Partial<HasTarget>)?.[targetSymbol];
	flexNodeMap.set(target, flexNode);
	Object.defineProperty(flexNode, targetSymbol, { value: target, configurable: true });
	return target;
}