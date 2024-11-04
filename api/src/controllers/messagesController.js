import pool from "../models/db.js";
import axios from "axios";
import multer from 'multer';
import FormData from "form-data";
import fs from "fs";
import 'dotenv/config';



async function sendMessage(toPhone, text, whatsappBusinessAccountId, socket) {
  const url = `https://graph.facebook.com/v20.0/${whatsappBusinessAccountId}/messages`;
  const data = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: toPhone,
    type: "text",
    text: { body: text },
  };
  console.log("Iniciando envio de mensagem para o WhatsApp");

  const headers = {
    Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
  };

  try {
    const response = await axios.post(url, data, { headers });

    console.log(`Mensagem enviada para o WhatsApp: ${text} para ${toPhone}`);

    if (socket) {
      socket.emit("new_message", {
        phone_number_id: whatsappBusinessAccountId,
        to: toPhone,
        message_body: text,
        timestamp: new Date().getTime(),
      });
    }

    return response.data;
  } catch (error) {
    console.error("Erro ao enviar mensagem para o WhatsApp:", error);
  }
}

// Buscar mensagens existentes
export const getMessages = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM whatsapp_messages");
    res.json(rows);
  } catch (error) {
    console.error("Erro ao buscar mensagens:", error);
    res.status(500).send("Erro ao buscar mensagens");
  }
};

// Enviar mensagem
export const send = async (req, res) => {
  const { toPhone, text } = req.body;

  // Verifica se o usuário está autenticado
  if (!req.user || !req.user.id) {
    return res.status(401).send("Usuário não autenticado");
  }
  const userId = req.user.id;

  // Verifica se os campos toPhone e text foram enviados
  if (!toPhone || !text) {
    return res.status(400).send("toPhone e text são obrigatórios");
  }

  // Verifica se as variáveis de ambiente do WhatsApp estão configuradas
  if (
    !process.env.WHATSAPP_BUSINESS_ACCOUNT_ID ||
    !process.env.DISPLAY_PHONE_NUMBER
  ) {
    return res.status(500).send("Configurações do WhatsApp estão ausentes");
  }

  try {
    // Envia a mensagem para o WhatsApp
    await sendMessage(toPhone, text, process.env.WHATSAPP_BUSINESS_ACCOUNT_ID);

    // Verifica se o contato já existe no banco de dados, senão, insere
    const [contactRows] = await pool.query(
      "SELECT id FROM contacts WHERE phone = ?",
      [toPhone]
    );
    let contactId;
    if (contactRows.length > 0) {
      contactId = contactRows[0].id;
    } else {
      const [result] = await pool.query(
        "INSERT INTO contacts (name, phone) VALUES (?, ?)",
        ["API", toPhone]
      );
      contactId = result.insertId;
    }

    // Cria um ID de conversa único
    const conversationId = `conv-${Date.now()}`;

    // Insere a mensagem no banco de dados
    const insertMessageQuery = `
      INSERT INTO whatsapp_messages (phone_number_id, display_phone_number, contact_name, wa_id, message_id, message_from, message_timestamp, message_type, message_body, contact_id, user_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    await pool.query(insertMessageQuery, [
      process.env.WHATSAPP_BUSINESS_ACCOUNT_ID,
      process.env.DISPLAY_PHONE_NUMBER,
      "API",
      toPhone,
      `msg-${Date.now()}`,
      "me",
      Math.floor(Date.now() / 1000).toString(),
      "text",
      text,
      contactId,
      userId,
    ]);

    // Seleciona o departamento do usuário
    const [userRow] = await pool.query(
      "SELECT department_id FROM users WHERE id = ?",
      [userId]
    );
    const [departamentRowName] = await pool.query(
      "SELECT name FROM departments WHERE id = ?",
      [userRow[0].department_id]
    );

    const departmentName = departamentRowName[0].name;
    console.log("Departamento encontrado:", departmentName);

    // Adicionar a mensagem na fila do departamento correspondente
    const queueTableName = `queueOf${departmentName}`;
    const insertQueueQuery = `INSERT INTO ${queueTableName} (contact_id, conversation_id, status)
      VALUES (?, ?, 'fila')`;
    await pool.query(insertQueueQuery, [contactId, conversationId]);
    console.log("Mensagem adicionada à fila:", queueTableName);

    // Responde com sucesso
    res.status(200).send("Mensagem enviada e salva com sucesso");
  } catch (error) {
    console.error("Erro ao enviar mensagem:", error);
    res.status(500).send("Erro ao enviar mensagem");
  }
};

// Webhook para verificar assinatura
export const getWebhook = function (req, res) {
  if (
    req.query["hub.mode"] == "subscribe" &&
    req.query["hub.verify_token"] == process.env.WEBHOOK_VERIFY_TOKEN
  ) {
    res.send(req.query["hub.challenge"]);
  } else {
    res.sendStatus(400);
  }
};

// Receber mensagem (Webhook)
export const receiveMessage = async (request, response) => {
  console.log("Incoming webhook: " + JSON.stringify(request.body));

  const entries = request.body.entry;

  if (entries && entries.length > 0) {
    let allEntriesProcessed = true;

    for (const entry of entries) {
      const changes = entry.changes;
      for (const change of changes) {
        const data = change.value;
        if (data && data.messages && data.messages.length > 0) {
          const message = data.messages[0];
          const contact =
            data.contacts && data.contacts.length > 0 ? data.contacts[0] : null;

          console.log(`Processando mensagem com ID: ${message.id} de ${contact.wa_id}`);

          // Verifique se a mensagem já foi processada
          const [messageExists] = await pool.query(
            "SELECT id FROM whatsapp_messages WHERE message_id = ?",
            [message.id]
          );

          if (messageExists.length > 0) {
            console.log(`Mensagem já processada com ID: ${message.id}`);
            continue; // Ignora esta mensagem
          }

          if (!contact || !contact.profile || !contact.wa_id || !message) {
            console.error("Dados inválidos recebidos:", JSON.stringify(request.body));
            allEntriesProcessed = false;
            continue;
          }

          // Obter ou criar o contato e definir contactId
          let contactId;
          try {
            const [contactRows] = await pool.query(
              "SELECT id FROM contacts WHERE phone = ?",
              [contact.wa_id]
            );
            if (contactRows.length > 0) {
              contactId = contactRows[0].id;
            } else {
              const [result] = await pool.query(
                "INSERT INTO contacts (name, phone) VALUES (?, ?)",
                [contact.profile.name, contact.wa_id]
              );
              contactId = result.insertId;
            }
          } catch (err) {
            console.error("Erro ao buscar ou criar contato:", err);
            allEntriesProcessed = false;
            continue;
          }

          // Lidar com mensagens de texto e imagens separadamente
          if (message.type === "text" && message.text) {
            const messageBody = message.text.body;
            console.log("Mensagem de texto recebida:", messageBody);

            // Lógica para processar mensagens de texto aqui

          } else if (message.type === "image" && message.image) {
            const imageId = message.image.id;
            const mimeType = message.image.mime_type;
            console.log(`Mensagem de imagem recebida: ID da imagem - ${imageId}, Tipo MIME - ${mimeType}`);

            // Exemplo de como salvar a imagem no banco ou realizar alguma ação
            // Aqui você pode decidir baixar a imagem usando o ID fornecido pela API do WhatsApp
          } else {
            console.error("Tipo de mensagem não suportado:", message.type);
            allEntriesProcessed = false;
          }

          // Insere a mensagem recebida no banco de dados
          const sql =
            "INSERT INTO whatsapp_messages (phone_number_id, display_phone_number, contact_name, wa_id, message_id, message_from, message_timestamp, message_type, message_body, contact_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
          const values = [
            data.metadata.phone_number_id,
            data.metadata.display_phone_number,
            contact.profile.name,
            contact.wa_id,
            message.id,
            message.from,
            message.timestamp,
            message.type,
            message.type === "text" ? message.text.body : "[imagem]", // Indica que é uma imagem
            contactId,
          ];

          try {
            await pool.query(sql, values);
            console.log(`Mensagem inserida no banco de dados com ID: ${message.id}`);

            // Emite um evento para os clientes conectados via Socket.IO
            global.io.emit("new_message", {
              phone_number_id: data.metadata.phone_number_id,
              display_phone_number: data.metadata.display_phone_number,
              contact_name: contact.profile.name,
              wa_id: contact.wa_id,
              message_id: message.id,
              message_from: message.from,
              message_timestamp: message.timestamp,
              message_type: message.type,
              message_body: message.type === "text" ? message.text.body : "[imagem]", // Indica que é uma imagem
              contact_id: contactId,
            });

          } catch (err) {
            console.error("Erro ao inserir dados no banco de dados:", err);
            allEntriesProcessed = false;
          }
        }
      }
    }

    if (allEntriesProcessed) {
      response.sendStatus(200);
    } else {
      response.sendStatus(500);
    }
  } else {
    console.error(
      "Estrutura do webhook não corresponde ao esperado:",
      JSON.stringify(request.body)
    );
    response.sendStatus(400);
  }
};


// Configuração do multer para armazenar arquivo na memória
const storage = multer.memoryStorage();
export const upload = multer({ storage });

// Função sendFile corrigida
export async function sendFile(req, res) {
  try {
    // Verifica se o arquivo está presente no request
    if (!req.file) {
      return res.status(400).json({ error: "Arquivo não encontrado" });
    }

    // Cria uma nova instância de FormData
    const formData = new FormData();

    // Anexa o arquivo ao FormData usando o buffer ao invés de um caminho de arquivo
    formData.append("file", req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype
    });

    // Inclui o campo necessário para especificar o produto de mensagens
    formData.append("messaging_product", "whatsapp");

    // Configura as opções de headers, incluindo o token de autenticação e o content-type para FormData
    const headers = {
      ...formData.getHeaders(),
      Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`
    };
    console.log(`TESTE TOKEN WHATSAPP Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`)

    // URL do endpoint da API do WhatsApp para envio de arquivos (verifique se a versão está correta)
    const url = 'https://graph.facebook.com/v20.0/408476129004761/media';

    // Envia o arquivo usando uma requisição POST
    const response = await axios.post(url, formData, { headers });

    // Responde com sucesso se o arquivo for enviado corretamente
    res.status(200).json({ message: "Arquivo enviado com sucesso", data: response.data });
  } catch (error) {
    console.error("Erro ao enviar arquivo:", error);
    res.status(500).json({ error: "Falha ao enviar o arquivo" });
  }
}

// Função para recuperar um arquivo do banco de dados
export async function getFile(req, res) {
  const { messageId } = req.params;

  try {
    const [rows] = await pool.query(
      'SELECT file_type, file_data, file_name FROM media_files WHERE message_id = ?',
      [messageId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Arquivo não encontrado' });
    }

    const file = rows[0];
    
    // Configura o header para o tipo correto de arquivo e envia o conteúdo
    const mimeType = {
      image: 'image/jpeg',
      audio: 'audio/mpeg',
      video: 'video/mp4',
      document: 'application/octet-stream' // Genérico para documentos
    }[file.file_type] || 'application/octet-stream';

    res.set('Content-Type', mimeType);
    res.set('Content-Disposition', `attachment; filename="${file.file_name}"`);
    res.send(file.file_data);
  } catch (error) {
    console.error("Erro ao recuperar arquivo:", error);
    res.status(500).json({ error: 'Erro ao recuperar arquivo' });
  }
}