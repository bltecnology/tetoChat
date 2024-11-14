import pool from "../models/db.js";
import axios from "axios";
import multer from 'multer';
import FormData from "form-data";
import 'dotenv/config';
import { transfer } from "../controllers/transferController.js";

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
              isNewContact = true;
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

          // Insere a mensagem recebida no banco de dados
          const sql =
            "INSERT INTO whatsapp_messages (phone_number_id, display_phone_number, contact_name, wa_id, message_id, message_from, message_timestamp, message_type, message_body, contact_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

          const lastMessage = "UPDATE contacts SET last_message = ? WHERE id = ?";

          const lastMessageValues = [
            messageBody,
            contactId
          ];

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
            await pool.query(lastMessage, lastMessageValues);
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

          try {
            const [rows] = await pool.query(
              "SELECT stage FROM contacts WHERE id = ?",
              [contactId]
            );
            const welcome = rows[0].stage;
          } catch (error) {
            console.log("Erro ao buscar stage:", error);
          }

          try {
            if(welcome == "finished") {
              await pool.query(
                "UPDATE contacts SET stage = 'welcome' WHERE id = ?",
                [contactId]
              );
            }
          } catch (error) {
            console.log("Erro ao reiniciar stage");
          }

          try {
            redirectBot(contact, messageBody, contactId);
          } catch {
            console.log("Erro ao redirecionar o cliente");
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

// Generalized sendMedia function
async function sendMedia(toPhone, fileBuffer, fileType, fileName, whatsappBusinessAccountId, socket) {
  console.log(`Iniciando envio de arquivo (${fileType}) para o WhatsApp`);

  // Step 1: Upload media to WhatsApp server
  const mediaUploadUrl = `https://graph.facebook.com/v21.0/${whatsappBusinessAccountId}/media`;
  const formData = new FormData();
  formData.append("file", fileBuffer, { filename: fileName, contentType: fileType });
  formData.append("messaging_product", "whatsapp");

  try {
    const uploadHeaders = {
      ...formData.getHeaders(),
      Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
    };
    const mediaResponse = await axios.post(mediaUploadUrl, formData, { headers: uploadHeaders });

    const mediaId = mediaResponse.data.id;
    console.log(`Arquivo enviado ao WhatsApp com ID: ${mediaId}`);

    // Step 2: Send media message with media ID
    const messageUrl = `https://graph.facebook.com/v21.0/${whatsappBusinessAccountId}/messages`;
    const data = {
      messaging_product: "whatsapp",
      to: toPhone,
      type: fileType,
      [fileType]: { id: mediaId },  // Dynamically assign media type field
    };

    const messageHeaders = {
      Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
    };
    const messageResponse = await axios.post(messageUrl, data, { headers: messageHeaders });

    console.log(`Mensagem de mídia enviada para o WhatsApp: ${fileType} para ${toPhone}`);

    // Emit message event if socket is present
    if (socket) {
      socket.emit("new_message", {
        phone_number_id: whatsappBusinessAccountId,
        to: toPhone,
        media_type: fileType,
        file_name: fileName,
        timestamp: new Date().getTime(),
      });
    }

    return messageResponse.data;
  } catch (error) {
    console.error(`Erro ao enviar arquivo de mídia para o WhatsApp: ${error}`);
    throw error;  // Propagate the error
  }
}

// Controller to handle media file requests
export async function sendFile(req, res) {
  const { toPhone, whatsappBusinessAccountId } = req.body;
  const socket = req.app.get("socket");  // Assuming Socket.IO instance is accessible

  // Check if the file exists in the request
  if (!req.file) {
    return res.status(400).json({ error: "Arquivo não encontrado" });
  }

  try {
    // Determine the file type and call the sendMedia function
    const fileBuffer = req.file.buffer;
    const fileType = req.file.mimetype.split("/")[0]; // Extracts 'image', 'video', etc.
    const fileName = req.file.originalname;

    await sendMedia(toPhone, fileBuffer, fileType, fileName, whatsappBusinessAccountId, socket);

    res.status(200).json({ message: "Arquivo enviado com sucesso" });
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

    // Verifica o tamanho do arquivo baixado
    const fileSize = Buffer.byteLength(fileData);
    console.log(`Tamanho do arquivo baixado: ${fileSize} bytes`);

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

// Function to retrieve a file from the database
export async function getFile(req, res) {
  const { messageId } = req.params;

  try {
    const [rows] = await pool.query(
      'SELECT file_type, file_data, file_name FROM media_files WHERE message_id = ?',
      [messageId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'File not found' });
    }

    const file = rows[0];
    const mimeType = {
      image: 'image/jpeg',
      audio: 'audio/ogg',  // Updated for audio/ogg type
      video: 'video/mp4',
      document: 'application/pdf'
    }[file.file_type] || 'application/octet-stream';

    res.set('Content-Type', mimeType);
    res.set('Content-Disposition', `inline; filename="${file.file_name}"`);
    
    // Check if file data is not empty or null
    if (file.file_data && file.file_data.length > 0) {
      console.log("File size:", file.file_data.length);
      console.log("Retrieved file type:", file.file_type);
      console.log("MIME type set in response:", mimeType);

      res.send(Buffer.from(file.file_data));  // Send as buffer
    } else {
      console.error("File data is empty or invalid.");
      res.status(500).json({ error: 'Error retrieving file data' });
    }
  } catch (error) {
    console.error("Error retrieving file:", error);
    res.status(500).json({ error: 'Error retrieving file' });
  }
}

// Redirect to department
async function redirectBot(contact, messageBody, contactId) {
  let departmentName = "";
  let nextStage = "welcome";
  let bodyBotMessage;
  let currentStage = "welcome";

  try {
    let [stageRow] = await pool.query(
      'SELECT stage FROM contacts WHERE id = ?',
      [contactId]
    );
    currentStage = stageRow[0]?.stage || "welcome";
  } catch (error) {
    console.log("Erro ao recuperar stage dentro do redirect")
  }

  switch (currentStage) {
    case "welcome":
      bodyBotMessage = `Olá ${contact.profile.name}! Seja muito bem-vindo(a) ao atendimento digital da Teto Bello. Para direcioná-lo, selecione uma opção abaixo:
      \n\n1 - Comercial / Vendas
      \n2 - Instalação / Assistência Técnica
      \n3 - Financeiro / Adm
      \n4 - Projetos
      \n5 - Compras
      \n6 - Trabalhe Conosco`;
      nextStage = "submenu";
      console.log(`Switch ${currentStage}`)
    break;

    
    case "submenu":
      console.log("Selected Departament",messageBody)
      switch (messageBody) {
        case "1":
          departmentName = "Comercial";
        break;

        case "2":
          departmentName = "Financeiro";
        break;
        
        case "3":
          departmentName = "Instalação";
        break;
        
        case "4":
          departmentName = "Projetos";
        break;
        
        case "5":
          departmentName = "Compras";
        break;
        
        case "6":
          departmentName = "Trabalhe Conosco";
        break;

        default:
          bodyBotMessage = `Desculpe, não entendi. Por favor, escolha uma opção válida.`;
          nextStage = "submenu"
      }

      // Declare departmentRows and getDepartmentId in the outer scope
      let departmentRows = [];
      let getDepartmentId = 0;
      
      if (departmentName){
        try {
          [departmentRows] = await pool.query(
            "SELECT id FROM departments WHERE name = ?",
            [departmentName]
          );
        } catch (error) {
          console.log("Erro na definição do id do departamento")
        }

        if (departmentRows.length > 0) {
          getDepartmentId = departmentRows[0].id;
          console.log("Department ID retrieved:", getDepartmentId);
        } else {
          console.log("No department found with the name:", departmentName);
          return; // Or handle the case where the department is not found
        }
  
        try {
          const mockReq = { body: { contactId, departmentId: getDepartmentId } };
  
          // Simulação de `res` com métodos para capturar o resultado
          const mockRes = {
            status: function(code) {
              this.statusCode = code;
              return this;
            },
            send: function(message) {
              this.message = message;
              console.log("Response sent from transfer with status:", this.statusCode, "and message:", message);
              return this;
            },
          };

          // Executa a função `transfer` com `mockReq` e `mockRes`
          console.log("Calling transfer with:", mockReq.body);
          await transfer(mockReq, mockRes);
          console.log("Transfer completed successfully with status:", mockRes.statusCode);
          nextStage = "atending";
        } catch {
          console.log("Error in calling transfer:", error);
          bodyBotMessage = `Departamento não encontrado! Por favor selecione novamente o departamento desejado
            \n\n1 - Comercial / Vendas
            \n2 - Instalação / Assistência Técnica
            \n3 - Financeiro / Adm
            \n4 - Projetos
            \n5 - Compras
            \n6 - Trabalhe Conosco`;
          await sendMessage(contact, bodyBotMessage, process.env.WHATSAPP_BUSINESS_ACCOUNT_ID);
        }
  
        switch (messageBody) {
          case "1": // Comercial / Vendas
            bodyBotMessage = `Qual produto você procura?
            \n1 - Envidraçamento de sacadas/complementos
            \n2 - Coberturas
            \n3 - Cobertura com envidraçamento de sacadas
            \n4 - Vidraçaria (Vidros/Box/Espelhos)
            \n5 - Esquadrias de alumínio
            \n6 - Guarda corpo e corrimão
            \n7 - Fachadas
            \n8 - Cortinas e persianas
            \n9 - Manutenção
            \n10 - Mais de um item acima.`
            nextStage = "atendent";
            console.log(`Switch ${currentStage}.${messageBody}`)
            break;
      
          case "2": // Instalação / Assistência Técnica
            bodyBotMessage = `O que deseja?
            \n1 - Saber o prazo de instalação do meu contrato
            \n2 - Agendar Instalação
            \n3 - Solicitar Assistência Técnica.`
            nextStage = "atendent";
            console.log(`Switch ${currentStage}.${messageBody}`)
            break;
      
          case "3": // Financeiro / Adm
            bodyBotMessage = `O que deseja?
            \n1 - Solicitar Boleto Bancário
            \n2 - Informações financeiras referentes ao meu contrato.`
            nextStage = "atendent";
            console.log(`Switch ${currentStage}.${messageBody}`)
            break;
      
          case "4": // Projetos
            bodyBotMessage = `Você ainda não recebeu seu projeto executivo? Entre em contato com seu consultor técnico para dar continuidade ao atendimento. Caso precise de suporte, informe seu nome, condomínio, apartamento e número do contrato, e redirecionaremos seu atendimento.`
            nextStage = "atendent";
            console.log(`Switch ${currentStage}.${messageBody}`)
            break;
      
          case "5": // Compras
            bodyBotMessage = `Deseja vender para nós? Por favor, envie seu portfólio abaixo. Caso já seja fornecedor, informe seu nome, o nome do comprador e a empresa para contato.`
            nextStage = "atendent";
            console.log(`Switch ${currentStage}.${messageBody}`)
            break;
      
          case "6": // Trabalhe Conosco
            bodyBotMessage = `Envie seu currículo atualizado abaixo. Se houver uma vaga disponível que corresponda ao seu perfil, entraremos em contato.`
            nextStage = "welcome";
            console.log(`Switch ${currentStage}.${messageBody}`)
            break;
          default:
            bodyBotMessage = `Desculpe, não entendi, poderia informar o número novamente?`
            nextStage = "submenu";
        }
      }
      break;
      

    case "atendent":
      bodyBotMessage = `Estamos te redirecionando para um de nossos atendentes, por favor aguarde`
      nextStage = "atending";
      console.log(`Switch ${currentStage}`)
    break;
  }
  

  try {
    // Send the initial bot message
    await sendMessage(contact.wa_id, bodyBotMessage, process.env.WHATSAPP_BUSINESS_ACCOUNT_ID);
    console.log("Initial bot message sent to", contact.wa_id);

    
    const [rows] = await pool.query(
      "SELECT stage FROM contacts WHERE id = ?",
      [contactId]
    );
    const actualStage = rows[0].stage;

    if(actualStage != nextStage) {
      await pool.query(
        "UPDATE contacts SET stage = ? WHERE id = ?",
        [nextStage,
        contactId]
      );
    }
  } catch (error) {
    console.error("Error sending initial bot message:", error);
    return; // Exit if there's an error to avoid additional processing
  }
}