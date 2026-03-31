import { startServer } from "./server";

process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0";

startServer();
