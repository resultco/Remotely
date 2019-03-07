import * as UI from "./UI.js";
import { RemoteControl } from "./RemoteControl.js";
import { GetCursor } from "./CursorMap.js";
var signalR = window["signalR"];
var lastFrameDelay = Date.now();
export class RCBrowserSockets {
    Connect() {
        this.Connection = new signalR.HubConnectionBuilder()
            .withUrl("/RCBrowserHub")
            .configureLogging(signalR.LogLevel.Information)
            .build();
        this.ApplyMessageHandlers(this.Connection);
        this.Connection.start().catch(err => {
            console.error(err.toString());
            console.log("Connection closed.");
        }).then(() => {
            this.SendScreenCastRequestToDevice();
            UI.ConnectButton.removeAttribute("disabled");
            UI.ConnectBox.style.display = "none";
            UI.ScreenViewer.removeAttribute("hidden");
            UI.StatusMessage.innerHTML = "";
        });
        this.Connection.closedCallbacks.push((ev) => {
            console.log("Connection closed.");
            UI.StatusMessage.innerHTML = "Connection closed.";
            UI.ScreenViewer.setAttribute("hidden", "hidden");
            UI.ConnectBox.style.removeProperty("display");
        });
    }
    ;
    SendScreenCastRequestToDevice() {
        return this.Connection.invoke("SendScreenCastRequestToDevice", RemoteControl.ClientID, RemoteControl.RequesterName, RemoteControl.Mode);
    }
    SendFrameSkip(delayTime) {
        this.Connection.invoke("SendFrameSkip", delayTime);
    }
    SendSelectScreen(index) {
        return this.Connection.invoke("SelectScreen", index);
    }
    SendMouseMove(percentX, percentY) {
        this.Connection.invoke("MouseMove", percentX, percentY);
    }
    SendMouseDown(button, percentX, percentY) {
        this.Connection.invoke("MouseDown", button, percentX, percentY);
    }
    SendMouseUp(button, percentX, percentY) {
        this.Connection.invoke("MouseUp", button, percentX, percentY);
    }
    SendTouchDown() {
        this.Connection.invoke("TouchDown");
    }
    SendLongPress() {
        this.Connection.invoke("LongPress");
    }
    SendTouchMove(moveX, moveY) {
        this.Connection.invoke("TouchMove", moveX, moveY);
    }
    SendTouchUp() {
        this.Connection.invoke("TouchUp");
    }
    SendTap() {
        this.Connection.invoke("Tap");
    }
    SendMouseWheel(deltaX, deltaY) {
        this.Connection.invoke("MouseWheel", deltaX, deltaY);
    }
    SendKeyDown(keyCode) {
        this.Connection.invoke("KeyDown", keyCode);
    }
    SendKeyUp(keyCode) {
        this.Connection.invoke("KeyUp", keyCode);
    }
    SendKeyPress(keyCode) {
        this.Connection.invoke("KeyPress", keyCode);
    }
    SendCtrlAltDel() {
        this.Connection.invoke("CtrlAltDel", RemoteControl.ServiceID);
    }
    SendSharedFileIDs(fileIDs) {
        this.Connection.invoke("SendSharedFileIDs", JSON.parse(fileIDs));
    }
    ApplyMessageHandlers(hubConnection) {
        hubConnection.on("ScreenCount", (primaryScreenIndex, screenCount) => {
            document.querySelector("#screenSelectBar").innerHTML = "";
            for (let i = 0; i < screenCount; i++) {
                var button = document.createElement("button");
                button.innerHTML = `Monitor ${i}`;
                button.classList.add("bar-button");
                if (i == primaryScreenIndex) {
                    button.classList.add("toggled");
                }
                document.querySelector("#screenSelectBar").appendChild(button);
                button.onclick = (ev) => {
                    this.SendSelectScreen(i);
                    document.querySelectorAll("#screenSelectBar .bar-button").forEach(button => {
                        button.classList.remove("toggled");
                    });
                    ev.currentTarget.classList.add("toggled");
                };
            }
        });
        hubConnection.on("ScreenSize", (width, height) => {
            UI.ScreenViewer.width = width;
            UI.ScreenViewer.height = height;
            UI.Screen2DContext.clearRect(0, 0, width, height);
        });
        hubConnection.on("ScreenCapture", (buffer, captureTime) => {
            var img = new Image();
            img.onload = () => {
                lastFrameDelay = Date.now();
                var frameDelay = Date.now() - new Date(captureTime).getTime();
                if (frameDelay > 2000 && Date.now() - lastFrameDelay > 2000) {
                    this.SendFrameSkip(frameDelay * .25);
                }
                UI.Screen2DContext.drawImage(img, 0, 0);
            };
            img.src = "data:image/png;base64," + buffer;
        });
        hubConnection.on("ConnectionFailed", () => {
            UI.ConnectButton.removeAttribute("disabled");
            UI.StatusMessage.innerHTML = "Connection failed or was denied.";
        });
        hubConnection.on("SessionIDNotFound", () => {
            UI.ConnectButton.removeAttribute("disabled");
            UI.StatusMessage.innerHTML = "Session ID not found.";
        });
        hubConnection.on("ScreenCasterDisconnected", () => {
            this.Connection.stop();
        });
        hubConnection.on("DesktopSwitchReady", (newClientID) => {
            RemoteControl.ClientID = newClientID;
            this.Connection.stop();
            this.Connect();
        });
        hubConnection.on("SwitchingDesktops", () => {
            UI.ShowMessage("Switching desktops...");
        });
        hubConnection.on("DesktopSwitchFailed", () => {
            UI.ShowMessage("Desktop switch failed.  Please reconnect.");
        });
        hubConnection.on("CursorChange", (cursor) => {
            var newCursor = GetCursor(cursor);
            UI.ScreenViewer.style.cursor = newCursor;
        });
    }
}
//# sourceMappingURL=RCBrowserSockets.js.map