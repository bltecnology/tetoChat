import bcrypt from 'bcryptjs';
import pool from '../models/db.js';
import express from "express";
import axios from "axios";
import multer from "multer";
import 'dotenv/config';

// Multer configuration for file upload
const storage = multer.memoryStorage();
export const upload = multer({ storage });

const saltRounds = 10;

export const getUsers = async (req, res) => {
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


export const updateUser = async (req, res) => {
  const userId = req.params.id;
  const { name, email, password, position, department } = req.body;

  try {
    const [user] = await pool.query("SELECT * FROM users WHERE id = ?", [
      userId,
    ]);

    if (user.length === 0) {
      return res.status(404).send("Usuário não encontrado");
    }

    const updatedUser = {
      name: name || user[0].name,
      email: email || user[0].email,
      position_id: position || user[0].position,
      department_id: department || user[0].department,
    };

    if (password) {
      updatedUser.password = password;
    }

    await pool.query("UPDATE users SET ? WHERE id = ?", [updatedUser, userId]);

    res.status(200).send("Usuário atualizado com sucesso");
  } catch (error) {
    console.error("Erro ao atualizar usuário:", error);
    res.status(500).send("Erro ao atualizar usuário");
  }
};

export const addUser = async (req, res) => {
  const { name, email, password, position_id, department_id } = req.body;

  // Verifique se todos os campos obrigatórios estão presentes
  if (!name || !email || !password || !position_id || !department_id) {
    return res.status(400).send('Todos os campos são obrigatórios');
  }

  try {
    // Criptografe a senha
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Verifique se o departamento existe
    const [departmentRow] = await pool.query("SELECT id FROM departments WHERE id = ?", [department_id]);
    if (departmentRow.length === 0) {
      return res.status(404).send('Departamento não encontrado');
    }

    // Verifique se a posição existe
    const [positionRow] = await pool.query("SELECT id FROM positions WHERE id = ?", [position_id]);
    if (positionRow.length === 0) {
      return res.status(404).send('Posição não encontrada');
    }

    // Insira o usuário na tabela
    const [result] = await pool.execute(
      'INSERT INTO users (name, email, password, position_id, department_id) VALUES (?, ?, ?, ?, ?)',
      [name, email, hashedPassword, position_id, department_id]
    );

    const insertId = result.insertId;

    res.status(201).send(`Usuário adicionado com sucesso. ID: ${insertId}`);
  } catch (error) {
    console.error('Erro ao salvar usuário:', error);
    res.status(500).send('Erro ao salvar usuário');
  }
};

export const updateProfilePicture = async (req, res) => {
  const { whatsappBusinessAccountId } = req.body;

  if (!whatsappBusinessAccountId || !req.file) {
    return res.status(400).send("Missing required fields: `whatsappBusinessAccountId` or `photo` file");
  }

  const url = `https://graph.facebook.com/v16.0/${whatsappBusinessAccountId}/settings/profile/photo`;

  const formData = new FormData();
  formData.append("file", req.file.buffer, {
    filename: req.file.originalname,
    contentType: req.file.mimetype,
  });

  const headers = {
    Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
    ...formData.getHeaders(),
  };

  try {
    const response = await axios.post(url, formData, { headers });
    res.status(200).send({
      message: "Profile picture updated successfully",
      response: response.data,
    });
  } catch (error) {
    console.error("Error updating profile picture:", error.response?.data || error.message);
    res.status(500).send({
      message: "Failed to update profile picture",
      error: error.response?.data || error.message,
    });
  }
}