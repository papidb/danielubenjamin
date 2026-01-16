import type { Plugin } from "unified";
import { visit } from "unist-util-visit";
import type { Root, ElementContent } from "hast";
import { h } from "hastscript";

const rehypeFigure: Plugin<[], Root> = () => {
	return (tree: Root) => {
		visit(tree, "element", (node, _index, parent) => {
			if (node.tagName !== "p" || !parent || parent.type !== "root") return;

			const children = node.children.filter(child => !(child.type === "text" && child.value.trim() === ""));

			if (children.length === 0) return;

			const firstChild = children[0];
			if (firstChild.type !== "element" || firstChild.tagName !== "img") return;
			if (!firstChild.properties.src || !firstChild.properties.alt) return;

			const imgElement = firstChild;
			const altText = String(imgElement.properties.alt);
			const remainingChildren = children.slice(1) as ElementContent[];

			node.tagName = "figure";

			const figcaptionChildren: ElementContent[] = [{ type: "text", value: altText }];
			if (remainingChildren.length > 0) {
				figcaptionChildren.push({ type: "text", value: " " });
				figcaptionChildren.push(...remainingChildren);
			}

			node.children = [h("img", { ...imgElement.properties }), h("figcaption", figcaptionChildren)] as ElementContent[];
		});
	};
};

export default rehypeFigure;
