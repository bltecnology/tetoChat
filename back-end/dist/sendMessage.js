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
const axios_1 = __importDefault(require("axios"));
const sendMessage = (phone, message) => __awaiter(void 0, void 0, void 0, function* () {
    const url = `https://graph.facebook.com/v14.0/351880008013177/messages`; // Substitua 'YOUR_PHONE_NUMBER_ID'
    const token = 'EAAXfbaD8KnoBO3uulFxWlDPpLEEppHOewRFlQzZBka696ZBMIUplW86YPhC7NuaoHPe1f79ak6dIGyGZBZCZAl9u6sfFKcZBVt0De6duDGo6uZC7lDlNZCKwtl4VdVju3WEMV2WLwyDQ60A7kmoMNmCehIDhRmwmjLuApLEV22xYinkIOrMRqeieQlzXG1oE9cpUFvzXvh0cMAWrueTZA2S0ZD'; // Substitua 'YOUR_ACCESS_TOKEN' pelo token temporário
    try {
        const response = yield axios_1.default.post(url, {
            messaging_product: 'whatsapp',
            to: phone,
            type: 'text',
            text: { body: message },
        }, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });
        console.log('Mensagem enviada:', response.data);
    }
    catch (error) {
        if (error instanceof Error) {
            console.error('Erro ao enviar mensagem:', error.message);
        }
        else {
            console.error('Erro ao enviar mensagem:', error);
        }
    }
});
exports.default = sendMessage;
