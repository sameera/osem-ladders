import { buildApp } from "./app";

const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || "0.0.0.0";

async function start() {
    const app = buildApp();

    try {
        await app.listen({ port: PORT, host: HOST });
        console.log(`🚀 API server listening on http://${HOST}:${PORT}`);
        console.log(`📊 Health check available at http://${HOST}:${PORT}/growth/health`);
    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }
}

// Handle graceful shutdown
const signals = ["SIGINT", "SIGTERM"] as const;
signals.forEach((signal) => {
    process.on(signal, async () => {
        console.log(`\n${signal} received, shutting down gracefully...`);
        process.exit(0);
    });
});

start();
