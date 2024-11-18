export const buildSocket = (token: string) => {
    const socket = new WebSocket("wss://voice.tjcserver.net", [token])
    socket.addEventListener("open", (event) => {
        console.log("open", event)
    })
    socket.addEventListener("message", (event) => {
        console.log("message", event)
    })
    socket.addEventListener("close", (event) => {
        console.log("close", event)
    })
    return socket
}