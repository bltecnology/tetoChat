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
const promise_1 = require("mysql2/promise");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const pool = (0, promise_1.createPool)({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});
const executeSQLFile = (filePath) => __awaiter(void 0, void 0, void 0, function* () {
    const sql = fs_1.default.readFileSync(filePath, 'utf-8');
    const statements = sql.split(';').filter(statement => statement.trim() !== '');
    for (const statement of statements) {
        try {
            yield pool.execute(statement);
        }
        catch (error) {
            console.error('Erro ao executar statement:', statement, error);
        }
    }
});
const initDB = () => __awaiter(void 0, void 0, void 0, function* () {
    const schemaPath = path_1.default.join(__dirname, '..', 'schemas.sql');
    yield executeSQLFile(schemaPath);
    console.log('Tabelas criadas ou já existentes.');
});
initDB().catch(error => {
    console.error('Erro ao inicializar o banco de dados:', error);
});
exports.default = pool;
