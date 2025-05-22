CREATE TABLE products (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255),
    price DECIMAL(10,2),
    stock INT,
    description TEXT
  );
  
  INSERT INTO products (name, price, stock) VALUES
  ('Laptop', 999.99, 50),
  ('Smartphone', 699.99, 100);