CREATE DATABASE IF NOT EXISTS EcoTechBackend;
use ecotechbackend;

CREATE TABLE IF NOT EXISTS Status (
  value ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL
);

CREATE TABLE IF NOT EXISTS Role (
  value ENUM('USER', 'ADMIN') NOT NULL
);

CREATE TABLE User (
  id INT AUTO_INCREMENT PRIMARY KEY,
  fullName VARCHAR(255),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('USER', 'ADMIN') DEFAULT 'USER' NOT NULL,
  phone_number VARCHAR(20),
  address VARCHAR(255),
  imageUrl VARCHAR(255),
  imageId VARCHAR(255),
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  points INT DEFAULT 0 NOT NULL
);

CREATE TABLE RecycleItem (
  id INT AUTO_INCREMENT PRIMARY KEY,
  itemType VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  item_condition VARCHAR(255) NOT NULL,
  weight INT NOT NULL,
  imageUrl VARCHAR(255),
  imageId VARCHAR(255),
  userId INT,
  status ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE
);

CREATE TABLE PickupRequest (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT,
  pickupAddress VARCHAR(255) NOT NULL,
  pickupDate VARCHAR(255) NOT NULL,
  pickupTime VARCHAR(255) NOT NULL,
  itemsForPickup TEXT NOT NULL,
  specialInstructions TEXT,
  status ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE
);

CREATE TABLE Session (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  userId INT NOT NULL,
  sessionId VARCHAR(255) UNIQUE NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
  expiresAt DATETIME NOT NULL,
  FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE
);

CREATE TABLE Reward (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  points INT NOT NULL,
  imageUrl VARCHAR(255),
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE Redemption (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  rewardId INT NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (userId) REFERENCES User(id),
  FOREIGN KEY (rewardId) REFERENCES Reward(id)
);

select * from user;
select * from session;
select * from recycleItem;