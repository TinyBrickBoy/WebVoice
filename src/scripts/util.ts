export const respondRedirect = (path: string = "/", status: number = 303) => {
    return new Response(null, {status, headers: {Location: path}});
};

export const constructSocketUrl = (siteUrl: URL) => {
    return new URL("wss://voice.tjcserver.net");
};
export const constructSocketUrl0 = (siteUrl: URL) => {
    const trailingSlash = siteUrl.pathname.endsWith("/");
    const socketUrl = new URL(siteUrl);
    socketUrl.pathname += `${trailingSlash ? "" : "/"}socket`;
    socketUrl.protocol = siteUrl.protocol === "https" ? "wss" : "ws";
    return socketUrl;
};