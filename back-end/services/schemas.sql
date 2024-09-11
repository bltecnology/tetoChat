CREATE TABLE IF NOT EXISTS whatsapp_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    phone_number_id VARCHAR(50),
    display_phone_number VARCHAR(20),
    contact_name VARCHAR(100),
    wa_id VARCHAR(20),
    status VARCHAR(50) NOT NULL,
    message_id VARCHAR(280),
    message_from VARCHAR(20),
    message_timestamp VARCHAR(20),
    message_type VARCHAR(20),
    message_body VARCHAR(16383),
    contact_id INT,  
    FOREIGN KEY (contact_id) REFERENCES contacts(id),
    user_id INT,
    FOREIGN KEY (user_id) REFERENCES users(id),
    department_id INT,  -- Adicionando a coluna department_id
    FOREIGN KEY (department_id) REFERENCES departments(id)  -- Adicionando a chave estrangeira corretamente
);

CREATE TABLE transfers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  whatsapp_message_id INT,  -- Nome mais consistente com a tabela whatsapp_messages
  department_origin_id INT,
  department_destination_id INT,
  transfer_date DATETIME,
  FOREIGN KEY (whatsapp_message_id) REFERENCES whatsapp_messages(id),  -- Chave estrangeira correta
  FOREIGN KEY (department_origin_id) REFERENCES departments(id),
  FOREIGN KEY (department_destination_id) REFERENCES departments(id)
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
  email VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  position_id INT,  -- Referenciando positions
  department_id INT,  -- Referenciando departments
  FOREIGN KEY (position_id) REFERENCES positions(id),
  FOREIGN KEY (department_id) REFERENCES departments(id)
);

CREATE TABLE IF NOT EXISTS quick_responses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  text TEXT NOT NULL,
  department_id INT NOT NULL,
  FOREIGN KEY (department_id) REFERENCES departments(id)
);

CREATE TABLE IF NOT EXISTS positions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS departments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL
);
