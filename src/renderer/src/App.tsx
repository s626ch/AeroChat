import { Routes, Route, HashRouter } from "react-router-dom";
import Login from "@renderer/pages/Login";
import Home from "@renderer/pages/Home";
import { Context } from "@renderer/util";
import { useEffect, useState } from "react";
import { State, Status } from "../../shared/types/index";
import {
	addDispatchListener,
	createWindow,
	getState,
	removeGatewayListener,
	setGatewayState,
} from "./util/ipc";
import {
	GatewayDispatchEvents,
	PresenceUpdateStatus,
} from "discord-api-types/v9";
import Notification from "./pages/Notification";
const { ipcRenderer }: { ipcRenderer: any } = window.require("electron");
import defaultPfp from "@renderer/assets/login/sample-pfp.png";
import ContextMenu from "./pages/ContextMenu";
import Message from "./pages/Message";
import { DiscordUtil } from "./classes/DiscordUtil";
import ContactCard from "./pages/ContactCard";
import Options from "./pages/Options";
import { ErrorBoundary } from "@sentry/react";
import CommandLink from "./components/CommandLink";
const remote = window.require(
	"@electron/remote",
) as typeof import("@electron/remote");
const Store = window.require(
	"electron-store",
) as typeof import("electron-store");

function Error() {
	const win = remote.getCurrentWindow();
	win.setMinimumSize(375, 600);
	win.setMaximumSize(375, 600);
	win.setTitle("An error occured");
	win.setSize(375, 600);
	// play the error sound
	return (
		<div className="error">
			<h1>info</h1>
			hi hello hi!! an error has occured which we can't recover from.
			<br />
			please contact me on discord <b>(notnullptr)</b> for assistance. to be
			extra helpful, follow the steps below:
			<ol>
				<li>
					open dev tools ( <kbd data-key="Control">ctrl</kbd> +{" "}
					<kbd data-key="Shift">shift</kbd> + <kbd data-key="i">i</kbd> , or by
					clicking{" "}
					<a
						onClick={() => {
							ipcRenderer.send("open-dev-tools");
						}}
					>
						here
					</a>
					)
				</li>
				<li>take a screenshot of the console</li>
				<li>send me the screenshot</li>
			</ol>
			<h1>actions</h1>
			<CommandLink title="reload" onClick={window.location.reload} />
			<CommandLink
				title="open dev tools"
				onClick={() => {
					ipcRenderer.send("open-dev-tools");
				}}
			/>
			<CommandLink
				title="add me on discord"
				description="opens the discord app and displays my profile, so you can add me for assistance."
				onClick={() => {
					remote.shell.openExternal(
						"https://discord.com/users/1053012491006910504",
					);
				}}
			/>
			<CommandLink
				title="join the discord server"
				description="does the same as above, but instead joins the nostalgia '09 discord server for assistance."
				onClick={() => remote.shell.openExternal("https://discord.gg/9QZ2M2Y")}
			/>
			<CommandLink
				title="exit"
				onClick={() => {
					remote.app.quit();
				}}
			/>
		</div>
	);
}

function App(): JSX.Element {
	// on ctrl + shift + i
	const store = new Store();
	useEffect(() => {
		(async () => {
			[
				(await import("@renderer/assets/ui-elements/checkbox/check.png"))
					.default,
				(await import("@renderer/assets/ui-elements/checkbox/check-hover.png"))
					.default,
				(await import("@renderer/assets/ui-elements/checkbox/check-active.png"))
					.default,
				(
					await import(
						"@renderer/assets/ui-elements/checkbox/check-disabled.png"
					)
				).default,
				(
					await import(
						"@renderer/assets/ui-elements/checkbox/check-checked.png"
					)
				).default,
				(
					await import(
						"@renderer/assets/ui-elements/checkbox/check-checked-hover.png"
					)
				).default,
				(
					await import(
						"@renderer/assets/ui-elements/checkbox/check-checked-active.png"
					)
				).default,
				(
					await import(
						"@renderer/assets/ui-elements/checkbox/check-checked-disabled.png"
					)
				).default,
				(
					await import(
						"@renderer/assets/ui-elements/checkbox/check-indeterminate.png"
					)
				).default,
				(
					await import(
						"@renderer/assets/ui-elements/checkbox/check-indeterminate-hover.png"
					)
				).default,
				(
					await import(
						"@renderer/assets/ui-elements/checkbox/check-indeterminate-active.png"
					)
				).default,
				(
					await import(
						"@renderer/assets/ui-elements/checkbox/check-indeterminate-disabled.png"
					)
				).default,
			].forEach((url) => {
				const img = new Image();
				img.src = url;
				img.style.opacity = "0";
				img.style.position = "absolute";
				img.style.pointerEvents = "none";
				img.style.zIndex = "-1";
				document.body.appendChild(img);
			});
		})();
	}, []);
	useEffect(() => {
		function keyDown(e: KeyboardEvent) {
			const kbd = document.querySelector(`kbd[data-key="${e.key}"]`);
			console.log(e.key, kbd);
			if (!kbd) return;
			kbd.classList.add("active");
		}
		function keyUp(e: KeyboardEvent) {
			const kbd = document.querySelector(`kbd[data-key="${e.key}"]`);
			if (!kbd) return;
			kbd.classList.remove("active");
		}
		window.addEventListener("keydown", keyDown);
		window.addEventListener("keyup", keyUp);
		return () => {
			window.removeEventListener("keydown", keyDown);
			window.removeEventListener("keyup", keyUp);
		};
	}, []);
	useEffect(() => {
		function keyDown(e: KeyboardEvent) {
			if (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "i")) {
				const kbds = Array.from(document.querySelectorAll("kbd"));
				kbds.forEach((kbd) => kbd.classList.remove("active"));
				ipcRenderer.send("open-dev-tools");
			}
		}
		function mouseDown() {
			ipcRenderer.send("close-ctx", window.location.hash);
		}
		window.addEventListener("keydown", keyDown);
		window.addEventListener("mousedown", mouseDown);
		return () => {
			window.removeEventListener("keydown", keyDown);
			window.removeEventListener("mousedown", mouseDown);
		};
	}, []);
	const initialState = getState();
	const [reactState, setReactState] = useState<State>(initialState as State);
	function setState(newState: State) {
		setGatewayState(newState);
		setReactState(newState);
	}
	useEffect(() => {
		ipcRenderer.on("set-state", (_, state) => {
			setReactState(state);
		});
		return () => {
			ipcRenderer.removeAllListeners("set-state");
		};
	}, []);
	useEffect(() => {
		DiscordUtil.updateState(reactState);
	}, [reactState]);
	useEffect(() => {
		const ids = [
			addDispatchListener(GatewayDispatchEvents.PresenceUpdate, (d) => {
				const mutState = { ...reactState };
				if (d.guild_id) {
					if (!mutState.ready?.merged_presences?.guilds) return;
					const guildIndex = mutState.ready.guilds.findIndex(
						(g) => g.id === d.guild_id,
					);
					if (guildIndex === -1) return;
					const guild = mutState.ready?.merged_presences?.guilds[guildIndex];
					const memberIndex = guild.findIndex((m) => m.user_id === d.user.id);
					if (memberIndex !== -1)
						mutState.ready?.merged_presences?.guilds[guildIndex].splice(
							memberIndex,
							1,
						);
					const { user, ...rest } = d;
					mutState.ready?.merged_presences?.guilds[guildIndex].push({
						...(rest as any),
						user_id: d.user.id,
					});
				}
				if (!mutState?.ready?.merged_presences?.friends) return;
				let friend = mutState.ready?.merged_presences?.friends.find(
					(f) => (f.user?.id || f.user_id) === d.user.id,
				);
				if (!friend) {
					mutState.ready?.merged_presences?.friends.push(d as any);
					setReactState(mutState);
					return;
				}
				if (mutState.ready?.merged_presences?.friends)
					mutState.ready.merged_presences.friends =
						mutState.ready?.merged_presences?.friends.filter(
							(f) => (f.user_id || f.user?.id) !== d.user.id,
						);
				const finalFriend = {
					status: d.status || friend.status,
					activities: d.activities || friend.activities,
					client_status: d.client_status || friend.client_status,
					user_id: d.user.id,
				};
				mutState.ready?.merged_presences?.friends.push(finalFriend as any);
				if (mutState === reactState) return;
				setReactState(mutState);
			}),
		];
		return () => {
			ids.forEach((id) => removeGatewayListener(id));
		};
	}, [reactState]);
	return (
		<ErrorBoundary fallback={<Error />}>
			<Context.Provider value={{ state: reactState, setState }}>
				<HashRouter>
					<Routes>
						<Route path="/" element={<Login />} />
						<Route path="/home" element={<Home />} />
						<Route path="/notification" element={<Notification />} />
						<Route path="/context-menu" element={<ContextMenu />} />
						<Route path="/message" element={<Message />} />
						<Route path="/contact-card" element={<ContactCard />} />
						<Route path="/options" element={<Options />} />
					</Routes>
				</HashRouter>
			</Context.Provider>
		</ErrorBoundary>
	);
}

export default App;
