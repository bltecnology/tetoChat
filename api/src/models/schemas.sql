CREATE TABLE IF NOT EXISTS departments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS positions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(280) NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  position_id INT,  -- Referenciando positions
  department_id INT,  -- Chave estrangeira que referencia departments
  FOREIGN KEY (position_id) REFERENCES positions(id),
  FOREIGN KEY (department_id) REFERENCES departments(id)  -- Relacionamento 1:N
);

CREATE TABLE IF NOT EXISTS contacts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  tag VARCHAR(20),
  note VARCHAR(280),
  profile_pic VARCHAR(255),
  last_message TEXT,
  cpf VARCHAR(11),
  rg VARCHAR(10),
  email VARCHAR(100),
  status VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  phone_number_id VARCHAR(50),
  display_phone_number VARCHAR(20),
  contact_name VARCHAR(100),
  wa_id VARCHAR(20),
  message_id VARCHAR(280) unique,
  message_from VARCHAR(20),
  message_timestamp VARCHAR(20),
  message_type VARCHAR(20),
  message_body TEXT,  -- Mudado para TEXT
  contact_id INT,
  FOREIGN KEY (contact_id) REFERENCES contacts(id),
  user_id INT,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS media_files (
    id INT PRIMARY KEY AUTO_INCREMENT,
    message_id VARCHAR(280) NOT NULL,
    file_type ENUM('image', 'audio', 'video', 'document') NOT NULL,  -- Tipo de arquivo
    file_data LONGBLOB NOT NULL,  -- Dados binários do arquivo
    file_name VARCHAR(255),       -- Nome original do arquivo (opcional)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (message_id) REFERENCES whatsapp_messages(message_id) ON DELETE CASCADE
);



CREATE TABLE IF NOT EXISTS quick_responses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  text TEXT NOT NULL,
  department_id INT NOT NULL,
  FOREIGN KEY (department_id) REFERENCES departments(id)
);

CREATE TABLE IF NOT EXISTS transfers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  whatsapp_message_id INT, 
  department_origin_id INT,
  department_destination_id INT,
  transfer_date DATETIME,
  FOREIGN KEY (whatsapp_message_id) REFERENCES whatsapp_messages(id), 
  FOREIGN KEY (department_origin_id) REFERENCES departments(id),
  FOREIGN KEY (department_destination_id) REFERENCES departments(id)
);