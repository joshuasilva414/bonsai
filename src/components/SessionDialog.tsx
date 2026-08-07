import { Link } from "@tanstack/react-router";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";

export default function SessionDialog({
	children,
	curriculumNodeId,
}: {
	children: React.ReactElement;
	curriculumNodeId: string;
}) {
	return (
		<Dialog>
			<DialogTrigger render={children} nativeButton={false} />
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Start Session</DialogTitle>
					<DialogDescription>
						Choose which session type you want to use:
					</DialogDescription>
				</DialogHeader>
				<DialogFooter className="sm:justify-start">
					<Link
						to={"/session/textbook/$curriculumNodeId"}
						params={{ curriculumNodeId: curriculumNodeId }}
					>
						<p>Textbook</p>
					</Link>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
