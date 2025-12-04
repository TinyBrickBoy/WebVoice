export const respondJson = (json: any, status: number) => {
    return new Response(JSON.stringify(json), {
        status,
        headers: {
            "Content-Type": "application/json",
        },
    });
};
