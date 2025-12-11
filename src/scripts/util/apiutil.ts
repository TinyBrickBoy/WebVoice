export const respondJson = (
    json: any,
    status: number,
    headers: Record<string, string> = {},
) => {
    return new Response(JSON.stringify(json), {
        status,
        headers: {
            "Content-Type": "application/json",
            ...headers,
        },
    });
};
