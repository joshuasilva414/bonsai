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
import ELK from "elkjs/lib/elk.bundled.js";
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
const elk = new ELK();

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

function CurriculumNodeCard({ data, selected }: NodeProps<CurriculumFlowNode>) {
	const { graphNode, isCollapsed, onToggle } = data;

	return (
		<div className="curriculum-map-node" data-level={graphNode.level}>
			<Handle type="target" position={Position.Left} isConnectable={false} />
			<span className="curriculum-map-node-level">
				{levelLabels[graphNode.level]}
			</span>
			<strong>{graphNode.name}</strong>
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
			<Handle type="source" position={Position.Right} isConnectable={false} />
		</div>
	);
}

const nodeTypes = { curriculum: CurriculumNodeCard };

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
						type: "smoothstep",
						markerEnd: { type: MarkerType.ArrowClosed },
					},
				]
			: [],
	);
	const layout = await elk.layout({
		id: "curriculum",
		layoutOptions: {
			"elk.algorithm": "layered",
			"elk.direction": "RIGHT",
			"elk.spacing.nodeNode": "34",
			"elk.layered.spacing.nodeNodeBetweenLayers": "92",
			"elk.layered.nodePlacement.strategy": "NETWORK_SIMPLEX",
		},
		children: nodes.map((node) => ({
			id: node.id,
			width: nodeWidth,
			height: nodeHeight,
		})),
		edges: edges.map((edge) => ({
			id: edge.id,
			sources: [edge.source],
			targets: [edge.target],
		})),
	});

	return {
		nodes: nodes.map((node) => {
			const position = layout.children?.find((child) => child.id === node.id);

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
		}),
		edges,
	};
}

export function CurriculumGraph({ course }: { course: CourseOutline }) {
	const graphNodes = useMemo(() => courseOutlineToGraphNodes(course), [course]);
	const [collapsedNodeIds, setCollapsedNodeIds] = useState<Set<string>>(
		() => new Set(),
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
						colorMode="system"
						ariaLabelConfig={{
							"node.a11yDescription.default":
								"Press Enter or Space to select this curriculum node.",
						}}
					>
						<Background gap={24} size={1} />
						<MiniMap
							className="curriculum-map-minimap"
							pannable
							zoomable
							nodeColor="var(--bonsai-green)"
						/>
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
						<span className="curriculum-map-inspector-level">
							{levelLabels[selectedNode.level]}
						</span>
						<h2>{selectedNode.name}</h2>
						<p>
							{selectedNode.childCount > 0
								? `${selectedNode.childCount} direct ${selectedNode.childCount === 1 ? "branch" : "branches"}`
								: "A learning objective at the edge of this course map."}
						</p>
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
