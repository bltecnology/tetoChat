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
exports.addUser = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const database_1 = __importDefault(require("./database"));
const saltRounds = 10;
const addUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, email, password, position, department } = req.body;
    if (!name || !email || !password || !position || !department) {
        return res.status(400).send('Todos os campos são obrigatórios');
    }
    try {
        const hashedPassword = yield bcrypt_1.default.hash(password, saltRounds);
        const [result] = yield database_1.default.execute('INSERT INTO users (name, email, password, position, department) VALUES (?, ?, ?, ?, ?)', [name, email, hashedPassword, position, department]);
        const insertId = result.insertId;
        res.status(201).send(`Usuário adicionado com sucesso. ID: ${insertId}`);
    }
    catch (error) {
        console.error('Erro ao salvar usuário:', error);
        res.status(500).send('Erro ao salvar usuário');
    }
});
exports.addUser = addUser;
