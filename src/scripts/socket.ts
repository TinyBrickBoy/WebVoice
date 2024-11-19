export const buildSocket = (token: string, onOpen: () => void, onClose: () => void) => {
    const socket = new WebSocket("wss://voice.tjcserver.net", [token])
    socket.addEventListener("open", onOpen)
    socket.addEventListener("close", onClose)
    socket.addEventListener("error", (error) => {
        console.error(error)
        onClose();
    })
    socket.addEventListener("message", (event) => {
        console.log("message", event)
    })
    return socket
}