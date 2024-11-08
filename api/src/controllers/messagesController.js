import pool from "../models/db.js";
import axios from "axios";
import multer from 'multer';
import FormData from "form-data";
import 'dotenv/config';

// Configuração do multer para armazenar arquivo na memória
const storage = multer.memoryStorage();
export const upload = multer({ storage });

async function sendMessage(toPhone, text, whatsappBusinessAccountId, socket) {
  const url = `https://graph.facebook.com/v21.0/${whatsappBusinessAccountId}/messages`;
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
        console.log(data)

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

          // Processamento de diferentes tipos de mensagem
          let messageBody;
          if (message.type === "text" && message.text) {
            messageBody = message.text.body;
            console.log("Mensagem de texto recebida:", messageBody);

          } else if (message.type === "image" && message.image) {
            const imageId = message.image.id;
            const mimeType = message.image.mime_type;
            messageBody = `[imagem: ${imageId}]`;
            console.log(`Mensagem de imagem recebida: ID da imagem - ${imageId}, Tipo MIME - ${mimeType}`);

            // Salva a imagem usando saveMediaFile
            const fileUrl = `https://graph.facebook.com/v21.0/${imageId}`;
            saveMediaFile(message.id, 'image', fileUrl, `${imageId}.jpg`);

          } else if (message.type === "video" && message.video) {
            const videoId = message.video.id;
            const mimeType = message.video.mime_type;
            messageBody = `[vídeo: ${videoId}]`;
            console.log(`Mensagem de vídeo recebida: ID do vídeo - ${videoId}, Tipo MIME - ${mimeType}`);

            // Salva o vídeo usando saveMediaFile
            const fileUrl = `https://graph.facebook.com/v21.0/${videoId}`;
            saveMediaFile(message.id, 'video', fileUrl, `${videoId}.mp4`);

          } else if (message.type === "document" && message.document) {
            const documentId = message.document.id;
            const mimeType = message.document.mime_type;
            const fileName = message.document.filename;
            messageBody = `[documento: ${documentId}, nome: ${fileName}]`;
            console.log(`Mensagem de documento recebida: ID do documento - ${documentId}, Nome do arquivo - ${fileName}, Tipo MIME - ${mimeType}`);

            // Salva o documento usando saveMediaFile
            const fileUrl = `https://graph.facebook.com/v21.0/${documentId}`;
            saveMediaFile(message.id, 'document', fileUrl, fileName);

          } else if (message.type === "audio" && message.audio) {
            const audioId = message.audio.id;
            const mimeType = message.audio.mime_type;
            messageBody = `[áudio: ${audioId}]`;
            console.log(`Mensagem de áudio recebida: ID do áudio - ${audioId}, Tipo MIME - ${mimeType}`);

            // Salva o áudio usando saveMediaFile
            const fileUrl = `https://graph.facebook.com/v21.0/${audioId}`;
            saveMediaFile(message.id, 'audio', fileUrl, `${audioId}.mp3`);

          } else {
            console.error("Tipo de mensagem não suportado:", message.type);
            allEntriesProcessed = false;
            continue;
          }

          console.log(message)
          console.log(messageBody)
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
            messageBody,
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
              message_body: messageBody,
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
    const url = 'https://graph.facebook.com/v21.0/408476129004761/media';

    // Envia o arquivo usando uma requisição POST
    const response = await axios.post(url, formData, { headers });
    

    // Responde com sucesso se o arquivo for enviado corretamente
    res.status(200).json({ message: "Arquivo enviado com sucesso", data: response.data });

  } catch (error) {
    console.error("Erro ao enviar arquivo:", error);
    res.status(500).json({ error: "Falha ao enviar o arquivo" });
  }
}

export async function saveMediaFile(messageId, fileType, fileUrl, fileName) {
  try {
    // Adiciona o token de acesso como parâmetro na URL
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    const fileUrlWithToken = `${fileUrl}?access_token=${accessToken}`;

    // // Faz o download do arquivo usando a URL com o token
    // const response = await axios.get(fileUrlWithToken, {
    //   responseType: 'arraybuffer',
    //   // Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
    // });
    // // console.log("AQUI URL")
    // // console.log(response.data.url)
    // // console.log("AQUI Response")
    // // console.log(response)
    // // console.log("AQUI CONFIG")
    // // console.log(response.config.url)
    // // console.log(response)

    // const fileData = response.config.url;
    // console.log("AQUI File Data: ",fileData)

    // const responseDoc = await axios.get(fileData, {
    //   // Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`
    // });
    // console.log("AQUI GET URL GRAPH")
    // console.log(responseDoc)

    // First request to get metadata and file URL
    const metadataResponse = await axios.get(fileUrlWithToken);
    const fileDownloadUrl = metadataResponse.data.url;

    console.log("URL for actual file download:", fileDownloadUrl);

    // Second request to download the actual file data
    const fileResponse = await axios.get(fileDownloadUrl, {
      responseType: 'arraybuffer',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    const fileData = fileResponse.data;
    console.log("Get lookaside Completa",fileResponse)
    console.log("Get lookaside Data",fileResponse.data)


    // Verifica o tamanho do arquivo baixado
    const fileSize = Buffer.byteLength(fileData);
    console.log(`Tamanho do arquivo baixado: ${fileSize} bytes`);

    if (fileSize < 1000) { // Condição para verificar se o arquivo baixado é válido
      console.error('O arquivo baixado é menor que o esperado. Pode ter ocorrido um problema no download.');
      return;
    }


    
    // Insere o arquivo na tabela `media_files` do banco de dados
    await pool.query(
      'INSERT INTO media_files (message_id, file_type, file_data, file_name) VALUES (?, ?, ?, ?)',
      [messageId, fileType, fileData, fileName]
    );

    console.log('Arquivo de mídia salvo com sucesso.');
  } catch (error) {
    console.error('Erro ao salvar arquivo de mídia:', error);
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
    const mimeType = {
      image: 'image/jpeg',
      audio: 'audio/mpeg',
      video: 'video/mp4',
      document: 'application/pdf'
    }[file.file_type] || 'application/octet-stream';

    res.set('Content-Type', mimeType);
    res.set('Content-Disposition', `inline; filename="${file.file_name}"`);
    
    // Verifica se os dados não estão vazios
    if (file.file_data && file.file_data.length > 0) {
      console.log("Tamanho do arquivo recuperado:", file.file_data.length);
      res.send(Buffer.from(file.file_data));  // Converte para Buffer antes de enviar
    } else {
      console.error("Dados do arquivo estão vazios ou inválidos.");
      res.status(500).json({ error: 'Erro ao recuperar dados do arquivo' });
    }
  } catch (error) {
    console.error("Erro ao recuperar arquivo:", error);
    res.status(500).json({ error: 'Erro ao recuperar arquivo' });
  }
}
