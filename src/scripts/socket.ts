export const buildSocket = (token: string, open: () => void) => {
    const socket = new WebSocket("wss://voice.tjcserver.net", [token])
    socket.addEventListener("open", open)
    socket.addEventListener("message", (event) => {
        console.log("message", event)
    })
    socket.addEventListener("close", (event) => {
        console.log("close", event)
    })
    return socket
}