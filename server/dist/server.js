"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const app_1 = __importDefault(require("./app"));
console.log('Booting server...');
console.log('Start of server.ts');
process.on('uncaughtException', (err) => {
    console.error('💥 Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason) => {
    console.error('💥 Unhandled Rejection:', reason);
});
const port = process.env.PORT || 4000;
// await connectMongo();
function startServer() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // DB implementation (MongoDB, Pinecone,...)
            // await new Promise((resolve) => setTimeout(resolve, 1000));
            app_1.default
                .listen(port, () => {
                console.log(`✅ App listening on port ${port}`);
            })
                .on('error', (err) => {
                console.error('❌ Failed to start server:', err);
                process.exit(1);
            });
        }
        catch (error) {
            console.error('❌ Failed during initialization:', error instanceof Error ? error.message : error);
            process.exit(1);
        }
    });
}
// Execute the startup function
startServer().catch((error) => {
    console.error('❌ Unhandled error during startup:', error);
    process.exit(1);
});
