import pool from '../models/db.js';
import axios from "axios";
import multer from "multer";
import 'dotenv/config';
import FormData from 'form-data';


// Multer configuration for file upload
const storage = multer.memoryStorage();
export const upload = multer({ storage });

export const getProfile = async (req, res) => {
  try {
    // Updated query with JOINs to fetch position and department names
    const query = `
      SELECT u.id, u.name, u.email, p.name AS position, d.name AS department 
      FROM users u
      JOIN positions p ON u.position_id = p.id
      JOIN departments d ON u.department_id = d.id
    `;
    const [rows] = await pool.query(query);
    res.json(rows);
  } catch (error) {
    console.error("Erro ao buscar usuários:", error);
    res.status(500).send("Erro ao buscar usuários");
  }
};

export const updateProfilePicture = async (req, res) => {

    if (!req.file) {
        return res.status(400).send("No file uploaded");
    }

    const fileName = req.file.originalname;
    const fileType = req.file.mimetype;
    const fileType2 = "image/jpg";
    const fileSize = req.file.size;

    // Create upload session
    const uploadSessionUrl = `https://graph.facebook.com/v21.0/app/uploads/?file_length=${fileSize}&file_type=${fileType2}&file_name=${fileName}`

    const uploadSessionHeaders = {
        Authorization: `OAuth ${process.env.WHATSAPP_ACCESS_TOKEN}`
    };

    let uploadSessionResponse;

    try {
        uploadSessionResponse = await axios.post(uploadSessionUrl, null, { headers: uploadSessionHeaders });
        console.log("Upload session created:", uploadSessionResponse.data);
    } catch (error) {
        console.error("Error creating upload session:", error.response?.data || error.message);
        return res.status(500).send({
            message: "Failed to create upload session",
            error: error.response?.data || error.message,
        });
    }

    const uploadSessionId = uploadSessionResponse.data?.id; // Example response property
    if (!uploadSessionId) {
        return res.status(500).send("Upload session ID is missing");
    }

    const uploadUrl = `https://graph.facebook.com/v21.0/${uploadSessionId}`;

    const formData = new FormData();
    formData.append("file", req.file.buffer, {
        filename: req.file.originalname,
        contentType: "image/jpeg",
    });

    const uploadHeaders = {
        Authorization: `OAuth ${process.env.WHATSAPP_ACCESS_TOKEN}`,
        file_offset: 0,
        contentType: "image/jpeg",
        ...formData.getHeaders()
    };

    let uploadResponse;

    try {
        uploadResponse = await axios.post(uploadUrl, formData, { headers: uploadHeaders });
        console.log("File uploaded:", uploadResponse.data);
    } catch (error) {
        console.error("Error  uploading file:", error.response?.data || error.message);
        return res.status(500).send({
            message: "Failed to upload file",
            error: error.response?.data || error.message,
        });
    }

    const uploadId = uploadResponse.data?.h; // Example response property
    if (!uploadId) {
        return res.status(500).send("Upload ID is missing");
    }

    const updateUrl = `https://graph.facebook.com/v21.0/${process.env.WHATSAPP_BUSINESS_ACCOUNT_ID}/whatsapp_business_profile`


    const updateHeaders = {
        Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
        contentType: "application/json",
        ...formData.getHeaders()
    };

    const updateBody = {
        messaging_product: "whatsapp",
        profile_picture_handle: uploadId, // The handle of the uploaded file
    };
    
    try {
        const updateResponse = await axios.post(updateUrl, updateBody, { headers: updateHeaders });
        console.log("Profile updated:", updateResponse.data);
        res.status(200).send({
            message: "Profile picture updated successfully",
            response: updateResponse.data,
        });
    } catch (error) {
        console.error("Error updating profile picture:", error.response?.data || error.message);
        res.status(500).send({
            message: "Failed to update profile picture",
            error: error.response?.data || error.message,
        });
    }
};