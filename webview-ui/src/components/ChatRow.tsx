import { VSCodeButton, VSCodeProgressRing } from "@vscode/webview-ui-toolkit/react"
import React from "react"
import Markdown from "react-markdown"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { ClaudeAsk, ClaudeMessage, ClaudeSay, ClaudeSayTool } from "../../../src/shared/ExtensionMessage"
import { COMMAND_OUTPUT_STRING } from "../../../src/shared/combineCommandSequences"
import { SyntaxHighlighterStyle } from "../utils/getSyntaxHighlighterStyleFromTheme"
import CodeBlock from "./CodeBlock"
import Thumbnails from "./Thumbnails"
import { ApiProvider } from "../../../src/shared/api"

interface ChatRowProps {
	message: ClaudeMessage
	syntaxHighlighterStyle: SyntaxHighlighterStyle
	isExpanded: boolean
	onToggleExpand: () => void
	lastModifiedMessage?: ClaudeMessage
	isLast: boolean
	apiProvider?: ApiProvider
}

const ChatRow: React.FC<ChatRowProps> = ({
	message,
	syntaxHighlighterStyle,
	isExpanded,
	onToggleExpand,
	lastModifiedMessage,
	isLast,
	apiProvider,
}) => {
	const cost = message.text != null && message.say === "api_req_started" ? JSON.parse(message.text).cost : undefined
	const apiRequestFailedMessage =
		isLast && lastModifiedMessage?.ask === "api_req_failed" // if request is retried then the latest message is a api_req_retried
			? lastModifiedMessage?.text
			: undefined
	const isCommandExecuting =
		isLast && lastModifiedMessage?.ask === "command" && lastModifiedMessage?.text?.includes(COMMAND_OUTPUT_STRING)

	const getIconAndTitle = (type: ClaudeAsk | ClaudeSay | undefined): [JSX.Element | null, JSX.Element | null] => {
		const ProgressIndicator = (
			<div
				style={{
					width: "16px",
					height: "16px",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
				}}>
				<div style={{ transform: "scale(0.55)", transformOrigin: "center" }}>
					<VSCodeProgressRing />
				</div>
			</div>
		)

		switch (type) {
			case "request_limit_reached":
				return [
					<span className="codicon codicon-error text-error" />,
					<h3 className="text-error">Max Requests Reached</h3>,
				]
			case "error":
				return [<span className="codicon codicon-error text-error" />, <h3 className="text-error">Error</h3>]
			case "command":
				return [
					isCommandExecuting ? ProgressIndicator : <span className="codicon codicon-terminal text-alt" />,
					<h3 className="text-alt">Claude wants to execute this command:</h3>,
				]
			case "completion_result":
				return [
					<span className="codicon codicon-check text-success" />,
					<h3 className="text-success">Task Completed</h3>,
				]
			case "api_req_started":
				return [
					cost ? (
						<span className="codicon codicon-check text-success" />
					) : apiRequestFailedMessage ? (
						<span className="codicon codicon-error text-error" />
					) : (
						ProgressIndicator
					),
					cost ? (
						<h3 className="text-success">API Request Complete</h3>
					) : apiRequestFailedMessage ? (
						<h3 className="text-error">API Request Failed</h3>
					) : (
						<h3 className="text-alt">Making API Request...</h3>
					),
				]
			case "followup":
				return [
					<span className="codicon codicon-question text-alt" />,
					<h3 className="text-alt">Claude has a question:</h3>,
				]
			default:
				return [null, null]
		}
	}

	const renderMarkdown = (markdown: string = "") => {
		// react-markdown lets us customize elements, so here we're using their example of replacing code blocks with SyntaxHighlighter. However when there are no language matches (` or ``` without a language specifier) then we default to a normal code element for inline code. Code blocks without a language specifier shouldn't be a common occurrence as we prompt Claude to always use a language specifier.
		// when claude wraps text in thinking tags, he doesnt use line breaks so we need to insert those ourselves to render markdown correctly
		const parsed = markdown.replace(/<thinking>([\s\S]*?)<\/thinking>/g, (match, content) => {
			return `_<thinking>_\n\n${content}\n\n_</thinking>_`
		})
		return (
			<div style={{ wordBreak: "break-word", overflowWrap: "anywhere" }}>
				<Markdown
					children={parsed}
					components={{
						p(props) {
							const { style, ...rest } = props
							return (
								<p
									style={{
										...style,
										margin: 0,
										marginTop: 0,
										marginBottom: 0,
										whiteSpace: "pre-wrap",
										wordBreak: "break-word",
										overflowWrap: "anywhere",
									}}
									{...rest}
								/>
							)
						},
						ol(props) {
							const { style, ...rest } = props
							return (
								<ol
									style={{
										...style,
										padding: "0 0 0 20px",
										margin: "10px 0",
										wordBreak: "break-word",
										overflowWrap: "anywhere",
									}}
									{...rest}
								/>
							)
						},
						ul(props) {
							const { style, ...rest } = props
							return (
								<ul
									style={{
										...style,
										padding: "0 0 0 20px",
										margin: "10px 0",
										wordBreak: "break-word",
										overflowWrap: "anywhere",
									}}
									{...rest}
								/>
							)
						},
						// https://github.com/remarkjs/react-markdown?tab=readme-ov-file#use-custom-components-syntax-highlight
						code(props) {
							const { children, className, node, ...rest } = props
							const match = /language-(\w+)/.exec(className || "")
							return match ? (
								<SyntaxHighlighter
									{...(rest as any)} // will be passed down to pre
									PreTag="div"
									children={String(children).replace(/\n$/, "")}
									language={match[1]}
									style={{
										...syntaxHighlighterStyle,
										'code[class*="language-"]': {
											background: "var(--vscode-editor-background)",
										},
										'pre[class*="language-"]': {
											background: "var(--vscode-editor-background)",
										},
									}}
									customStyle={{
										overflowX: "auto",
										overflowY: "hidden",
										maxWidth: "100%",
										margin: 0,
										padding: "10px",
										// important to note that min-width: max-content is not required here how it is in CodeBlock.tsx
										borderRadius: 3,
										border: "1px solid var(--vscode-sideBar-border)",
										fontSize: "var(--vscode-editor-font-size)",
										lineHeight: "var(--vscode-editor-line-height)",
										fontFamily: "var(--vscode-editor-font-family)",
									}}
								/>
							) : (
								<code
									{...rest}
									className={className}
									style={{
										whiteSpace: "pre-line",
										wordBreak: "break-word",
										overflowWrap: "anywhere",
									}}>
									{children}
								</code>
							)
						},
					}}
				/>
			</div>
		)
	}

	const renderContent = () => {
		const [icon, title] = getIconAndTitle(message.type === "ask" ? message.ask : message.say)

		switch (message.type) {
			case "say":
				switch (message.say) {
					case "api_req_started":
						return (
							<>
								<div className="flex-line">
									{icon}
									{title}
									{cost && <code className="text-light">${Number(cost)?.toFixed(4)}</code>}
									<div className="flex-1" />
									<VSCodeButton
										appearance="icon"
										aria-label="Toggle Details"
										onClick={onToggleExpand}>
										<span className={`codicon codicon-chevron-${isExpanded ? "up" : "down"}`} />
									</VSCodeButton>
								</div>
								{cost == null && apiRequestFailedMessage && (
									<>
										<div className="text-error">{apiRequestFailedMessage}</div>
										{/* {apiProvider === "kodu" && (
											<div
												style={{
													display: "flex",
													alignItems: "center",
													backgroundColor:
														"color-mix(in srgb, var(--vscode-errorForeground) 20%, transparent)",
													color: "var(--vscode-editor-foreground)",
													padding: "6px 8px",
													borderRadius: "3px",
													margin: "10px 0 0 0",
													fontSize: "12px",
												}}>
												<i
													className="codicon codicon-warning"
													style={{
														marginRight: 6,
														fontSize: 16,
														color: "var(--vscode-errorForeground)",
													}}></i>
												<span>
													Uh-oh, this could be a problem on Kodu's end. We've been alerted and
													will resolve this ASAP. You can also{" "}
													<a
														href="https://discord.gg/claudedev"
														style={{ color: "inherit", textDecoration: "underline" }}>
														contact us on discord
													</a>
													.
												</span>
											</div>
										)} */}
									</>
								)}
							</>
						)
					case "api_req_finished":
						return null // we should never see this message type
					case "text":
						return <div>{renderMarkdown(message.text)}</div>
					case "user_feedback":
						return (
							<div style={{ display: "flex", alignItems: "start", gap: "8px" }}>
								<span className="codicon codicon-account" style={{marginTop:"2px"}} />
								<div style={{ display: "grid", gap: "8px" }}>
									<div>{message.text}</div>
									{message.images && message.images.length > 0 && (
										<Thumbnails images={message.images} />
									)}
								</div>
							</div>
						)
					case "user_feedback_diff":
						const tool = JSON.parse(message.text || "{}") as ClaudeSayTool
						return (
							<div
								style={{
									backgroundColor: "var(--vscode-editor-inactiveSelectionBackground)",
									borderRadius: "3px",
									padding: "8px",
									whiteSpace: "pre-line",
									wordWrap: "break-word",
								}}>
								<span
									style={{
										display: "block",
										fontStyle: "italic",
										marginBottom: "8px",
										opacity: 0.8,
									}}>
									The user made the following changes:
								</span>
								<CodeBlock
									diff={tool.diff!}
									path={tool.path!}
									syntaxHighlighterStyle={syntaxHighlighterStyle}
									isExpanded={isExpanded}
									onToggleExpand={onToggleExpand}
								/>
							</div>
						)
					case "error":
						return (
							<>
								{title && (
									<h3 className="flex-line text-error">
										{icon}
										{title}
									</h3>
								)}
								<p>{message.text}</p>
							</>
						)
					case "completion_result":
						return (
							<>
								<h3 className="flex-line text-success">
									{icon}
									{title}
								</h3>
								<div className="text-success">{renderMarkdown(message.text)}</div>
							</>
						)
					case "tool":
						return renderTool(message)
					default:
						return (
							<>
								{title && (
									<h3 className="flex-line">
										{icon}
										{title}
									</h3>
								)}
								<div>{renderMarkdown(message.text)}</div>
							</>
						)
				}
			case "ask":
				switch (message.ask) {
					case "tool":
						return renderTool(message)
					case "request_limit_reached":
						return (
							<>
								<h3 className="flex-line">
									{icon}
									{title}
								</h3>
								<div className="text-error">{message.text}</div>
							</>
						)
					case "command":
						const splitMessage = (text: string) => {
							const outputIndex = text.indexOf(COMMAND_OUTPUT_STRING)
							if (outputIndex === -1) {
								return { command: text, output: "" }
							}
							return {
								command: text.slice(0, outputIndex).trim(),
								output: text.slice(outputIndex + COMMAND_OUTPUT_STRING.length).trim(),
							}
						}

						const { command, output } = splitMessage(message.text || "")
						return (
							<>
								<h3 className="flex-line">
									{icon}
									{title}
								</h3>
								<div>
									<div>
										<CodeBlock
											code={command}
											language="shell-session"
											syntaxHighlighterStyle={syntaxHighlighterStyle}
											isExpanded={isExpanded}
											onToggleExpand={onToggleExpand}
										/>
									</div>

									{output && (
										<>
											<div style={{ margin: "10px 0 10px 0" }}>{COMMAND_OUTPUT_STRING}</div>
											<CodeBlock
												code={output}
												language="shell-session"
												syntaxHighlighterStyle={syntaxHighlighterStyle}
												isExpanded={isExpanded}
												onToggleExpand={onToggleExpand}
											/>
										</>
									)}
								</div>
							</>
						)
					case "completion_result":
						if (message.text) {
							return (
								<>
									<h3 className="flex-line">
										{icon}
										{title}
									</h3>
									<div className="text-success">{renderMarkdown(message.text)}</div>
								</>
							)
						} else {
							return null // Don't render anything when we get a completion_result ask without text
						}
					case "followup":
						return (
							<>
								{title && (
									<h3 className="flex-line">
										{icon}
										{title}
									</h3>
								)}
								<div>{renderMarkdown(message.text)}</div>
							</>
						)
				}
		}
	}

	const renderTool = (message: ClaudeMessage) => {
		const tool = JSON.parse(message.text || "{}") as ClaudeSayTool
		const toolIcon = (name: string) => <span className={`codicon codicon-${name} text-alt`} />

		switch (tool.tool) {
			case "editedExistingFile":
				return (
					<>
						<div className="flex-line">
							{toolIcon("edit")}
							<h3 className="text-alt">Claude wants to edit this file:</h3>
						</div>
						<CodeBlock
							diff={tool.diff!}
							path={tool.path!}
							syntaxHighlighterStyle={syntaxHighlighterStyle}
							isExpanded={isExpanded}
							onToggleExpand={onToggleExpand}
						/>
					</>
				)
			case "newFileCreated":
				return (
					<>
						<h3 className="flex-line text-alt">{toolIcon("new-file")}Claude wants to create a new file:</h3>
						<CodeBlock
							code={tool.content!}
							path={tool.path!}
							syntaxHighlighterStyle={syntaxHighlighterStyle}
							isExpanded={isExpanded}
							onToggleExpand={onToggleExpand}
						/>
					</>
				)
			case "readFile":
				return (
					<>
						<h3 className="flex-line text-alt">
							{toolIcon("file-code")}
							{message.type === "ask" ? "Claude wants to read this file:" : "Claude read this file:"}
						</h3>
						<CodeBlock
							code={tool.content!}
							path={tool.path!}
							syntaxHighlighterStyle={syntaxHighlighterStyle}
							isExpanded={isExpanded}
							onToggleExpand={onToggleExpand}
						/>
					</>
				)
			case "listFilesTopLevel":
				return (
					<>
						<h3 className="flex-line text-alt">
							{toolIcon("folder-opened")}
							{message.type === "ask"
								? "Claude wants to view the top level files in this directory:"
								: "Claude viewed the top level files in this directory:"}
						</h3>
						<CodeBlock
							code={tool.content!}
							path={tool.path!}
							language="shell-session"
							syntaxHighlighterStyle={syntaxHighlighterStyle}
							isExpanded={isExpanded}
							onToggleExpand={onToggleExpand}
						/>
					</>
				)
			case "listFilesRecursive":
				return (
					<>
						<h3 className="flex-line text-alt">
							{toolIcon("folder-opened")}
							{message.type === "ask"
								? "Claude wants to recursively view all files in this directory:"
								: "Claude recursively viewed all files in this directory:"}
						</h3>
						<CodeBlock
							code={tool.content!}
							path={tool.path!}
							language="shell-session"
							syntaxHighlighterStyle={syntaxHighlighterStyle}
							isExpanded={isExpanded}
							onToggleExpand={onToggleExpand}
						/>
					</>
				)
			case "listCodeDefinitionNames":
				return (
					<>
						<h3 className="flex-line text-alt">
							{toolIcon("file-code")}
							{message.type === "ask"
								? "Claude wants to view source code definition names used in this directory:"
								: "Claude viewed source code definition names used in this directory:"}
						</h3>
						<CodeBlock
							code={tool.content!}
							path={tool.path!}
							syntaxHighlighterStyle={syntaxHighlighterStyle}
							isExpanded={isExpanded}
							onToggleExpand={onToggleExpand}
						/>
					</>
				)
			case "searchFiles":
				return (
					<>
						<h3 className="text-alt">
							{toolIcon("search")}
							{message.type === "ask" ? (
								<>
									Claude wants to search this directory for <code>{tool.regex}</code>:
								</>
							) : (
								<>
									Claude searched this directory for <code>{tool.regex}</code>:
								</>
							)}
						</h3>
						<CodeBlock
							code={tool.content!}
							path={tool.path! + (tool.filePattern ? `/(${tool.filePattern})` : "")}
							language="plaintext"
							syntaxHighlighterStyle={syntaxHighlighterStyle}
							isExpanded={isExpanded}
							onToggleExpand={onToggleExpand}
						/>
					</>
				)
			default:
				return null
		}
	}

	// NOTE: we cannot return null as virtuoso does not support it, so we must use a separate visibleMessages array to filter out messages that should not be rendered

	return (
		<section>
			{renderContent()}
			{isExpanded && message.say === "api_req_started" && (
				<div style={{ marginTop: "10px" }}>
					<CodeBlock
						code={JSON.stringify(JSON.parse(message.text || "{}").request, null, 2)}
						language="json"
						syntaxHighlighterStyle={syntaxHighlighterStyle}
						isExpanded={true}
						onToggleExpand={onToggleExpand}
					/>
				</div>
			)}
		</section>
	)
}

export default ChatRow
