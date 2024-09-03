import { VSCodeButton, VSCodeLink } from "@vscode/webview-ui-toolkit/react"
import { ApiConfiguration } from "../../../src/shared/api"

interface AnnouncementProps {
	version: string
	hideAnnouncement: () => void
	apiConfiguration?: ApiConfiguration
	vscodeUriScheme?: string
}
/*
You must update the latestAnnouncementId in ClaudeDevProvider for new announcements to show to users. This new id will be compared with whats in state for the 'last announcement shown', and if it's different then the announcement will render. As soon as an announcement is shown, the id will be updated in state. This ensures that announcements are not shown more than once, even if the user doesn't close it themselves.
*/
const Announcement = ({ version, hideAnnouncement, apiConfiguration, vscodeUriScheme }: AnnouncementProps) => {
	return (
		<section>
			<div className="flex-line">
				<h3 className="flex-line uppercase text-alt">
					<span className="codicon text-alt codicon-bell-dot"></span>New in v{version}
				</h3>
				<div className="flex-1" />
				<VSCodeButton appearance="icon" onClick={hideAnnouncement}>
					<span className="codicon codicon-close"></span>
				</VSCodeButton>
			</div>
			<ul style={{ margin: "0 0 8px", paddingLeft: "12px" }}>
				<li>
					New terminal emulator! When Claude runs commands, you can now type directly in the terminal (+
					support for Python environments)
				</li>
				<li>
					<b>You can now edit Claude's changes before accepting!</b> When he edits or creates a file, you can
					modify his changes directly in the right side of the diff view (+ hover over the 'Revert Block'
					arrow button in the center to undo "<code>{"// rest of code here"}</code>" shenanigans)
				</li>
				<li>
					Adds support for reading .pdf and .docx files (try "turn my business_plan.docx into a company
					website")
				</li>
				<li>
					Adds new <code>search_files</code> tool that lets Claude perform regex searches in your project,
					making it easy for him to refactor code, address TODOs and FIXMEs, remove dead code, and more!
				</li>
			</ul>
			<div>
				Follow me for more updates!{" "}
				<VSCodeLink href="https://x.com/sdrzn" style={{ display: "inline" }}>
					@sdrzn
				</VSCodeLink>
			</div>
		</section>
	)
}

export default Announcement
