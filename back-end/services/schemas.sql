CREATE TABLE IF NOT EXISTS whatsapp_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    phone_number_id VARCHAR(50),
    display_phone_number VARCHAR(20),
    contact_name VARCHAR(100),
    wa_id VARCHAR(20),
    message_id VARCHAR(50),
    message_from VARCHAR(20),
    message_timestamp VARCHAR(20),
    message_type VARCHAR(20),
    message_body TEXT,
    contact_id INT,  
    FOREIGN KEY (contact_id) REFERENCES contacts(id)  --chave estrangeira
);



CREATE TABLE IF NOT EXISTS contacts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  tag VARCHAR(20),
  note VARCHAR(280),
  profilePic VARCHAR(255),
  lastMessage TEXT,
  cpf VARCHAR(11),
  rg VARCHAR(10),
  email VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  position VARCHAR(50),
  department VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS quickResponses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  text TEXT NOT NULL,
  department VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS positions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS departments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS queue (
    id INT AUTO_INCREMENT PRIMARY KEY,
    contact_id INT NOT NULL,
    department_atual VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL, -- Valores possíveis: "fila", "respondida"
    FOREIGN KEY (contact_id) REFERENCES contacts(id)
);

