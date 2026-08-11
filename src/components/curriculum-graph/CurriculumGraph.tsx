import { Link } from "@tanstack/react-router";
import {
	Background,
	Controls,
	type Edge,
	Handle,
	MarkerType,
	MiniMap,
	type Node,
	type NodeProps,
	Position,
	ReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { ChevronRight } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { CourseOutline } from "#/functions/courses";
import {
	type CurriculumGraphNode,
	courseOutlineToGraphNodes,
	visibleCurriculumGraphNodes,
} from "#/lib/curriculum-graph";

const nodeWidth = 220;
const nodeHeight = 88;
const radialNodeSpacing = 260;
const radialRingSpacing = 380;
const minimumFirstRingRadius = 520;

interface CurriculumNodeData extends Record<string, unknown> {
	graphNode: CurriculumGraphNode;
	isCollapsed: boolean;
	onToggle: (nodeId: string) => void;
}

type CurriculumFlowNode = Node<CurriculumNodeData, "curriculum">;

const levelLabels = {
	subject: "Subject",
	topic: "Topic",
	subtopic: "Subtopic",
	objective: "Objective",
} as const;

function toRomanNumeral(value: number) {
	const numerals = [
		[1000, "m"],
		[900, "cm"],
		[500, "d"],
		[400, "cd"],
		[100, "c"],
		[90, "xc"],
		[50, "l"],
		[40, "xl"],
		[10, "x"],
		[9, "ix"],
		[5, "v"],
		[4, "iv"],
		[1, "i"],
	] as const;
	let remainder = value;
	let result = "";

	for (const [amount, numeral] of numerals) {
		while (remainder >= amount) {
			result += numeral;
			remainder -= amount;
		}
	}

	return result;
}

function toAlphabeticOrder(value: number) {
	let remainder = value;
	let result = "";

	while (remainder > 0) {
		remainder -= 1;
		result = String.fromCharCode(97 + (remainder % 26)) + result;
		remainder = Math.floor(remainder / 26);
	}

	return result;
}

function formatNodeOrder(graphNode: CurriculumGraphNode) {
	switch (graphNode.level) {
		case "topic":
			return `${toRomanNumeral(graphNode.siblingOrder)}.`;
		case "subtopic":
			return `${toAlphabeticOrder(graphNode.siblingOrder)})`;
		case "objective":
			return `${graphNode.siblingOrder}.`;
		case "subject":
			return null;
	}
}

function CurriculumNodeCard({ data, selected }: NodeProps<CurriculumFlowNode>) {
	const { graphNode, isCollapsed, onToggle } = data;
	const orderLabel = formatNodeOrder(graphNode);

	return (
		<div className="curriculum-map-node" data-level={graphNode.level}>
			{Object.values(Position).map((position) => (
				<Handle
					key={`target-${position}`}
					id={`target-${position}`}
					type="target"
					position={position}
					isConnectable={false}
				/>
			))}
			<strong>
				{orderLabel ? (
					<span className="curriculum-map-node-order">{orderLabel}</span>
				) : null}
				{graphNode.name}
			</strong>
			{graphNode.childCount > 0 ? (
				<button
					className="nodrag nopan curriculum-map-node-toggle"
					type="button"
					onClick={(event) => {
						event.stopPropagation();
						onToggle(graphNode.id);
					}}
					aria-label={`${isCollapsed ? "Expand" : "Collapse"} ${graphNode.name}`}
					aria-expanded={!isCollapsed}
				>
					<ChevronRight aria-hidden="true" />
					{graphNode.childCount}
				</button>
			) : null}
			{selected ? <span className="sr-only">Selected</span> : null}
			{Object.values(Position).map((position) => (
				<Handle
					key={`source-${position}`}
					id={`source-${position}`}
					type="source"
					position={position}
					isConnectable={false}
				/>
			))}
		</div>
	);
}

const nodeTypes = { curriculum: CurriculumNodeCard };

function connectionSide(
	from: { x: number; y: number },
	to: { x: number; y: number },
) {
	const deltaX = to.x - from.x;
	const deltaY = to.y - from.y;

	if (Math.abs(deltaX) > Math.abs(deltaY)) {
		return deltaX > 0 ? Position.Right : Position.Left;
	}

	return deltaY > 0 ? Position.Bottom : Position.Top;
}

const oppositePosition = {
	[Position.Top]: Position.Bottom,
	[Position.Right]: Position.Left,
	[Position.Bottom]: Position.Top,
	[Position.Left]: Position.Right,
} as const;

async function layoutGraph(
	nodes: readonly CurriculumGraphNode[],
	onToggle: (nodeId: string) => void,
	collapsedNodeIds: ReadonlySet<string>,
): Promise<{ nodes: CurriculumFlowNode[]; edges: Edge[] }> {
	const visibleNodeIds = new Set(nodes.map((node) => node.id));
	const edges = nodes.flatMap((node) =>
		node.parentId && visibleNodeIds.has(node.parentId)
			? [
					{
						id: `${node.parentId}-${node.id}`,
						source: node.parentId,
						target: node.id,
						type: "default",
						markerEnd: { type: MarkerType.ArrowClosed },
					},
				]
			: [],
	);
	const childrenByParentId = new Map<string, CurriculumGraphNode[]>();
	for (const node of nodes) {
		if (!node.parentId) continue;
		const siblings = childrenByParentId.get(node.parentId) ?? [];
		siblings.push(node);
		childrenByParentId.set(node.parentId, siblings);
	}

	const leafCounts = new Map<string, number>();
	function countLeaves(nodeId: string): number {
		const children = childrenByParentId.get(nodeId) ?? [];
		const count = Math.max(
			1,
			children.reduce((total, child) => total + countLeaves(child.id), 0),
		);
		leafCounts.set(nodeId, count);
		return count;
	}

	const root = nodes.find((node) => !node.parentId);
	const totalLeafCount = root ? countLeaves(root.id) : 1;
	const firstRingRadius = Math.max(
		minimumFirstRingRadius,
		(totalLeafCount * radialNodeSpacing) / (2 * Math.PI),
	);
	const positions = new Map<string, { x: number; y: number }>();

	function positionBranch(
		node: CurriculumGraphNode,
		depth: number,
		startAngle: number,
		endAngle: number,
	) {
		const angle = (startAngle + endAngle) / 2;
		const radius =
			depth === 0 ? 0 : firstRingRadius + (depth - 1) * radialRingSpacing;
		positions.set(node.id, {
			x: Math.cos(angle) * radius - nodeWidth / 2,
			y: Math.sin(angle) * radius - nodeHeight / 2,
		});

		const children = childrenByParentId.get(node.id) ?? [];
		let nextAngle = startAngle;
		for (const child of children) {
			const childSpan =
				((endAngle - startAngle) * (leafCounts.get(child.id) ?? 1)) /
				(leafCounts.get(node.id) ?? 1);
			positionBranch(child, depth + 1, nextAngle, nextAngle + childSpan);
			nextAngle += childSpan;
		}
	}

	if (root) positionBranch(root, 0, -Math.PI / 2, (3 * Math.PI) / 2);

	const flowNodes: CurriculumFlowNode[] = nodes.map((node) => {
		const position = positions.get(node.id);

		return {
			id: node.id,
			type: "curriculum",
			position: { x: position?.x ?? 0, y: position?.y ?? 0 },
			data: {
				graphNode: node,
				isCollapsed: collapsedNodeIds.has(node.id),
				onToggle,
			},
			ariaLabel: `${levelLabels[node.level]}: ${node.name}`,
		};
	});
	const nodesById = new Map(flowNodes.map((node) => [node.id, node]));

	return {
		nodes: flowNodes,
		edges: edges.map((edge) => {
			const source = nodesById.get(edge.source);
			const target = nodesById.get(edge.target);
			if (!source || !target) return edge;

			const sourceSide = connectionSide(source.position, target.position);
			return {
				...edge,
				sourceHandle: `source-${sourceSide}`,
				targetHandle: `target-${oppositePosition[sourceSide]}`,
			};
		}),
	};
}

export function CurriculumGraph({ course }: { course: CourseOutline }) {
	const graphNodes = useMemo(() => courseOutlineToGraphNodes(course), [course]);
	const [collapsedNodeIds, setCollapsedNodeIds] = useState<Set<string>>(
		() =>
			new Set(
				graphNodes
					.filter((node) => node.id !== course.rootId && node.childCount > 0)
					.map((node) => node.id),
			),
	);
	const [selectedNodeId, setSelectedNodeId] = useState(course.rootId);
	const [flowNodes, setFlowNodes] = useState<CurriculumFlowNode[]>([]);
	const [flowEdges, setFlowEdges] = useState<Edge[]>([]);
	const [isLayoutPending, setIsLayoutPending] = useState(true);
	const [layoutError, setLayoutError] = useState<string | null>(null);

	const toggleNode = useCallback((nodeId: string) => {
		setCollapsedNodeIds((current) => {
			const next = new Set(current);
			if (next.has(nodeId)) next.delete(nodeId);
			else next.add(nodeId);
			return next;
		});
	}, []);

	useEffect(() => {
		let cancelled = false;
		const visibleNodes = visibleCurriculumGraphNodes(
			graphNodes,
			collapsedNodeIds,
		);
		setIsLayoutPending(true);
		setLayoutError(null);

		void layoutGraph(visibleNodes, toggleNode, collapsedNodeIds)
			.then(({ nodes, edges }) => {
				if (cancelled) return;
				setFlowNodes(nodes);
				setFlowEdges(edges);
			})
			.catch(() => {
				if (cancelled) return;
				setLayoutError("The curriculum map could not be arranged.");
			})
			.finally(() => {
				if (cancelled) return;
				setIsLayoutPending(false);
			});

		return () => {
			cancelled = true;
		};
	}, [collapsedNodeIds, graphNodes, toggleNode]);

	const selectedNode = graphNodes.find((node) => node.id === selectedNodeId);

	return (
		<div className="curriculum-map-workspace">
			<div className="curriculum-map-canvas" aria-busy={isLayoutPending}>
				{flowNodes.length > 0 ? (
					<ReactFlow
						nodes={flowNodes}
						edges={flowEdges}
						nodeTypes={nodeTypes}
						onNodeClick={(_, node) => setSelectedNodeId(node.id)}
						onSelectionChange={({ nodes }) => {
							const selectedNode = nodes.at(-1);
							if (selectedNode) setSelectedNodeId(selectedNode.id);
						}}
						nodesDraggable={false}
						nodesConnectable={false}
						elementsSelectable
						fitView
						fitViewOptions={{ padding: 0.18, maxZoom: 1.15 }}
						minZoom={0.25}
						maxZoom={1.6}
						ariaLabelConfig={{
							"node.a11yDescription.default":
								"Press Enter or Space to select this curriculum node.",
						}}
					>
						<Background gap={24} size={1} />
						{/* <MiniMap
							className="curriculum-map-minimap"
							pannable
							zoomable
							nodeColor="var(--bonsai-green)"
						/> */}
						<Controls showInteractive={false} />
					</ReactFlow>
				) : null}
				{isLayoutPending ? (
					<output className="curriculum-map-layout-status">
						Arranging curriculum…
					</output>
				) : null}
				{layoutError ? (
					<div className="curriculum-map-error" role="alert">
						{layoutError} Reload the page to try again.
					</div>
				) : null}
			</div>

			<aside className="curriculum-map-inspector" aria-label="Selected node">
				{selectedNode ? (
					<>
						<div className="curriculum-map-inspector-copy">
							<span className="curriculum-map-inspector-level">
								{levelLabels[selectedNode.level]}
							</span>
							<h2>{selectedNode.name}</h2>
							<p>
								{selectedNode.childCount > 0
									? `${selectedNode.childCount} direct ${selectedNode.childCount === 1 ? "branch" : "branches"}`
									: "A learning objective at the edge of this course map."}
							</p>
						</div>
						<Link
							className="curriculum-map-study-link"
							to="/session/textbook/$curriculumNodeId"
							params={{ curriculumNodeId: selectedNode.id }}
						>
							Study from here
							<ChevronRight aria-hidden="true" />
						</Link>
					</>
				) : (
					<p>Select a node to inspect it.</p>
				)}
			</aside>
		</div>
	);
}
