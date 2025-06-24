"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.urlencoded({ extended: true })); // for form submissions, fix fromat so page loads
app.use(express_1.default.static('assets')); // serve files in assets
app.get('/', (req, res) => {
    res.sendFile(path_1.default.join(__dirname, '../views/index.html'), {
        headers: { 'Content-Type': 'text/html' },
    });
});
app.get('/ping', (_req, res) => res.send('pong'));
// --- Eror Handler ----------------------------------------------
app.use((req, res) => {
    res.status(404).send('404 Not Found');
});
// --- Global error handler --------------------------------------
const errorHandler = (err, _req, res, _next) => {
    const defaultError = {
        log: 'Express error handler caught unknown middleware error',
        status: 500,
        message: { err: 'An error occurred' },
    };
    const errorObj = Object.assign(Object.assign({}, defaultError), err);
    console.log(errorObj.log);
    res.status(errorObj.status).json(errorObj.message);
};
app.use(errorHandler);
exports.default = app;
