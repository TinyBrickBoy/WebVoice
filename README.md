# Sonus Web

The astro-based web interface for interacting with the Sonus protocol using websockets. For Sonus itself, please
see [github.com/MinceraftMC/Sonus](https://github.com/MinceraftMC/Sonus).

Discord for support: https://discord.gg/zC8xjtSPKC

## Public instance

A public instance of this site using Cloudflare Workers is available at https://sonus.minceraft.dev/
and can be used by specifying `https://sonus.minceraft.dev/%s?api=wss://sonus.example.org/api` as the `link-pattern`
in the configuration file of your Sonus service.
Don't forget to replace `sonus.example.org` with your actual websocket domain.

## Self-hosting

A [Dockerfile](./Dockerfile) is provided in this repo which builds the project using Astro's node.js adapter.
If you want to customize the application, be sure to specify the `DEFAULT_WEBSOCKET_URL` (e.g.
`wss://sonus.example.org/api`) and `ASTRO_SITE` (e.g. `https://audio.example.org/`) build arguments.
