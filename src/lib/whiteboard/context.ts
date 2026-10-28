import { Editor } from "tldraw";

export function buildEditorContext(editor: Editor) {
	return {
		shapes: editor.getCurrentPageShapes().map((shape) => ({
			id: shape.id,
			type: shape.type === "geo" ? shape.props.geo : shape.type,
			text: editor.getShapeUtil(shape).getText(shape),
			bounds: editor.getShapePageBounds(shape),
		}))
	}

}
